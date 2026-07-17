const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Agent = require('../models/Agent');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../config/mail');
const { ROLES } = require('../constants');

// Helper to generate access tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, companyName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create base user record
    const user = await User.create({
      name,
      email,
      password, // hashed automatically on save
      role: ROLES.CUSTOMER,
      verificationToken
    });

    // Create customer profile detail
    await Customer.create({
      user: user._id,
      phone: phone || '',
      address: address || '',
      companyName: companyName || ''
    });

    // Send verification email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
    
    const emailHtml = `
      <h1>Email Verification</h1>
      <p>Thank you for registering at Customer Care Registry. Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" target="_blank" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy this link to your browser: ${verifyUrl}</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Verify your email address - Customer Care Registry',
      html: emailHtml,
      text: `Verify your email: ${verifyUrl}`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email (or server logs) to verify your account.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Fetch associated profile details
    let profile = null;
    if (user.role === ROLES.CUSTOMER) {
      profile = await Customer.findOne({ user: user._id });
    } else if (user.role === ROLES.AGENT) {
      profile = await Agent.findOne({ user: user._id }).populate('assignedCategories');
    }

    // Log login action
    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      ipAddress: req.ip || '',
      details: `${user.role} logged into the system.`
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        profileDetails: profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify email token
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired email verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log into the platform.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with that email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes limit
    await user.save();

    // Reset Link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const emailHtml = `
      <h1>Password Recovery</h1>
      <p>We received a request to reset your Password. Please click the button below to set a new password:</p>
      <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Customer Care Registry',
      html: emailHtml,
      text: `Reset your password: ${resetUrl}`
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link has been dispatched to your email address.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    // Update password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been updated. You can now log in.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === ROLES.CUSTOMER) {
      profile = await Customer.findOne({ user: user._id });
    } else if (user.role === ROLES.AGENT) {
      profile = await Agent.findOne({ user: user._id }).populate('assignedCategories');
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        profileDetails: profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit Profile details
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, companyName, department } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    await user.save();

    let details = null;

    if (user.role === ROLES.CUSTOMER) {
      details = await Customer.findOne({ user: user._id });
      if (phone !== undefined) details.phone = phone;
      if (address !== undefined) details.address = address;
      if (companyName !== undefined) details.companyName = companyName;
      await details.save();
    } else if (user.role === ROLES.AGENT) {
      details = await Agent.findOne({ user: user._id });
      if (department !== undefined) details.department = department;
      await details.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        profileDetails: details
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
    }

    // Serve URL locally path
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Save to user DB
    const user = await User.findById(req.user._id);
    user.profilePicture = fileUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture has been uploaded',
      profilePicture: fileUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
