const User = require('../models/User');
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const ComplaintCategory = require('../models/ComplaintCategory');
const AuditLog = require('../models/AuditLog');
const SystemSettings = require('../models/SystemSettings');
const { ROLES } = require('../constants');

// @desc    Get all users with search and filter
// @route   GET /api/admin/users
// @access  Private (Admin Only)
exports.getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    // Populate roles properties details
    const populatedUsers = await Promise.all(
      users.map(async (user) => {
        let details = null;
        if (user.role === ROLES.CUSTOMER) {
          details = await Customer.findOne({ user: user._id });
        } else if (user.role === ROLES.AGENT) {
          details = await Agent.findOne({ user: user._id }).populate('assignedCategories');
        }
        return { ...user.toObject(), profileDetails: details };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalCount: total,
      users: populatedUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create/Register a new Agent account
// @route   POST /api/admin/agents
// @access  Private (Admin Only)
exports.createAgentAccount = async (req, res) => {
  try {
    const { name, email, password, department, assignedCategories } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
    }

    // Create Base User record
    const user = await User.create({
      name,
      email,
      password,
      role: ROLES.AGENT,
      isVerified: true // Admins pre-verify Agents
    });

    // Create Agent profile detail
    const agent = await Agent.create({
      user: user._id,
      department,
      assignedCategories: assignedCategories || []
    });

    // Audit logging
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_AGENT_ACCOUNT',
      ipAddress: req.ip || '',
      details: `Created agent account for ${user.email} in department: ${department}`
    });

    res.status(201).json({
      success: true,
      message: 'Agent account successfully provisioned',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      agent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suspend user profile
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private (Admin Only)
exports.suspendUser = async (req, res) => {
  try {
    const { status } = req.body; // Active or Suspended
    if (!['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status state. Use Active or Suspended.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === ROLES.ADMIN) {
      return res.status(400).json({ success: false, message: 'Administrative configuration accounts cannot be suspended.' });
    }

    user.status = status;
    await user.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'SUSPEND_USER',
      details: `Changed account status of user ${user.email} to ${status}`
    });

    res.status(200).json({ success: true, message: `Account status updated to ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user profile
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === ROLES.ADMIN) {
      return res.status(400).json({ success: false, message: 'Default Admins accounts cannot be deleted.' });
    }

    // Clean sub profiles
    if (user.role === ROLES.CUSTOMER) {
      await Customer.deleteOne({ user: user._id });
    } else if (user.role === ROLES.AGENT) {
      await Agent.deleteOne({ user: user._id });
    }

    await User.deleteOne({ _id: user._id });

    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE_USER',
      details: `Deleted user profile: ${user.email} (${user.role})`
    });

    res.status(200).json({ success: true, message: 'User profile purged from system DB.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private (All Roles)
exports.getCategories = async (req, res) => {
  try {
    const categories = await ComplaintCategory.find({});
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/admin/categories
// @access  Private (Admin Only)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, slaHours } = req.body;

    const exists = await ComplaintCategory.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await ComplaintCategory.create({
      name,
      description,
      slaHours
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_CATEGORY',
      details: `Created complaint category: ${name}`
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin/Manager Only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, slaHours, isActive } = req.body;
    let category = await ComplaintCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name;
    if (description) category.description = description;
    if (slaHours) category.slaHours = slaHours;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_CATEGORY',
      details: `Updated complaint category: ${category.name}`
    });

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin Only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await ComplaintCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category to remove not found' });
    }

    await ComplaintCategory.deleteOne({ _id: category._id });

    await AuditLog.create({
      user: req.user._id,
      action: 'DELETE_CATEGORY',
      details: `Deleted complaint category: ${category.name}`
    });

    res.status(200).json({ success: true, message: 'Category successfully deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin Only)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin Only)
exports.getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin Only)
exports.updateSystemSettings = async (req, res) => {
  try {
    const { enableAiPredictions, automaticEscalationTimeHours, maxFileSizeMB, systemEmailSender } = req.body;
    let settings = await SystemSettings.findOne({});

    if (!settings) {
      settings = new SystemSettings();
    }

    if (enableAiPredictions !== undefined) settings.enableAiPredictions = enableAiPredictions;
    if (automaticEscalationTimeHours !== undefined) settings.automaticEscalationTimeHours = automaticEscalationTimeHours;
    if (maxFileSizeMB !== undefined) settings.maxFileSizeMB = maxFileSizeMB;
    if (systemEmailSender !== undefined) settings.systemEmailSender = systemEmailSender;

    await settings.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_SETTINGS',
      details: 'Updated global system application configurations'
    });

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
