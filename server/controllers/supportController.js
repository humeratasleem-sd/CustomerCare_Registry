const SupportTicket = require('../models/SupportTicket');
const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const { analyzeSentiment } = require('../helpers/nlp');
const { SUPPORT_TYPE, TICKET_PREFIX, ROLES } = require('../constants');

// Helper to generate support ticket ID
const generateSupportTicketId = (type) => {
  const num = Math.floor(100000 + Math.random() * 900000);
  const prefix = type === SUPPORT_TYPE.REQUEST ? TICKET_PREFIX.REQUEST : TICKET_PREFIX.INQUIRY;
  return `${prefix}${num}`;
};

// @desc    Raise a support request or inquiry
// @route   POST /api/requests
// @access  Private (Customer Only)
exports.createSupportTicket = async (req, res) => {
  try {
    const { type, subject, description } = req.body;

    if (!Object.values(SUPPORT_TYPE).includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid support request type selected' });
    }

    const ticketId = generateSupportTicketId(type);

    const ticket = await SupportTicket.create({
      ticketId,
      ticketType: type,
      customer: req.user._id,
      subject,
      description
    });

    res.status(201).json({
      success: true,
      message: `${type} ticket registered successfully`,
      ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get support requests / inquiries
// @route   GET /api/requests
// @access  Private (Customer / Admin)
exports.getSupportTickets = async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = {};

    if (req.user.role === ROLES.CUSTOMER) {
      query.customer = req.user._id;
    }

    if (type) query.ticketType = type;
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
      .populate('customer', 'name email')
      .populate('assignedAdmin', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update support status or resolution
// @route   PUT /api/requests/:id
// @access  Private (Admin Only)
exports.updateSupportTicketStatus = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    let ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    if (status) ticket.status = status;
    if (resolution) {
      ticket.resolution = resolution;
      ticket.resolvedAt = new Date();
      ticket.status = 'Closed';
    }

    ticket.assignedAdmin = req.user._id;
    await ticket.save();

    res.status(200).json({ success: true, message: 'Ticket updated successfully', ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Feedback after resolution
// @route   POST /api/feedback
// @access  Private (Customer Only)
exports.submitFeedback = async (req, res) => {
  try {
    const { complaintId, rating, comments } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint resolved ticket not found' });
    }

    if (complaint.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You did not submit this ticket.' });
    }

    // Verify if already submitted
    const feedbackExists = await Feedback.findOne({ complaint: complaintId });
    if (feedbackExists) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this complaint' });
    }

    // AI Sentiment Analysis on comments keywords
    const sentiment = analyzeSentiment(comments);

    const feedback = await Feedback.create({
      complaint: complaintId,
      customer: req.user._id,
      rating,
      comments,
      sentiment
    });

    // Update Agent performance metrics if complaint had assigned agent
    if (complaint.assignedAgent) {
      const Agent = require('../models/Agent');
      // Recalculate average performance rating
      const agentFeedbacks = await Feedback.find({
        complaint: { $in: await Complaint.find({ assignedAgent: complaint.assignedAgent }).distinct('_id') }
      });

      const totalRating = agentFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      const avgRating = agentFeedbacks.length > 0 ? (totalRating / agentFeedbacks.length).toFixed(2) : rating;

      await Agent.updateOne(
        { user: complaint.assignedAgent },
        { performanceRating: avgRating }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Feedback registered successfully. Thank you!',
      feedback
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feedbacks / reviews directory
// @route   GET /api/feedback
// @access  Private (Admin / Agent)
exports.getFeedbacks = async (req, res) => {
  try {
    const query = {};

    // Filter by agent's tickets if current user is agent
    if (req.user.role === ROLES.AGENT) {
      const agentTickets = await Complaint.find({ assignedAgent: req.user._id }).distinct('_id');
      query.complaint = { $in: agentTickets };
    }

    const feedbacks = await Feedback.find(query)
      .populate('customer', 'name email profilePicture')
      .populate({
        path: 'complaint',
        select: 'ticketId title assignedAgent',
        populate: { path: 'assignedAgent', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: feedbacks.length, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
