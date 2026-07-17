const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Complaint = require('../models/Complaint');
const { ROLES } = require('../constants');

// @desc    Get or create chat associated with a complaint ticket
// @route   GET /api/chats/complaint/:complaintId
// @access  Private (Customer & Agent & Admin)
exports.getChatByComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Reference complaint not found' });
    }

    // Security check: Only customer, assigned agent, or admin can chat
    const isCustomer = req.user.role === ROLES.CUSTOMER && complaint.customer.toString() === req.user._id.toString();
    const isAgent = req.user.role === ROLES.AGENT && complaint.assignedAgent && complaint.assignedAgent.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isCustomer && !isAgent && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not authorized to participate in this chat.' });
    }

    if (!complaint.assignedAgent) {
      return res.status(400).json({ success: false, message: 'Chat cannot open until an agent has been assigned to this ticket.' });
    }

    // Find and check if chat thread exists
    let chat = await Chat.findOne({ complaint: complaintId });
    if (!chat) {
      chat = await Chat.create({
        complaint: complaintId,
        customer: complaint.customer,
        agent: complaint.assignedAgent
      });
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all messages inside a chat thread
// @route   GET /api/chats/:chatId/messages
// @access  Private (Customer & Agent & Admin)
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat workspace not found' });
    }

    // Security check: Only thread members or Admins can access
    const isCustomer = req.user.role === ROLES.CUSTOMER && chat.customer.toString() === req.user._id.toString();
    const isAgent = req.user.role === ROLES.AGENT && chat.agent.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isCustomer && !isAgent && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Unauthorized query on chat log.' });
    }

    // Clear unread counts for reader role
    if (req.user.role === ROLES.CUSTOMER) {
      chat.unreadCountCustomer = 0;
    } else if (req.user.role === ROLES.AGENT) {
      chat.unreadCountAgent = 0;
    }
    await chat.save();

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email profilePicture role')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Post message manually (REST Fallback)
// @route   POST /api/chats/:chatId/messages
// @access  Private (Customer & Agent)
exports.postMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageText } = req.body;
    let chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat workspace not found' });
    }

    // Process attachments if uploaded
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push(`/uploads/${file.filename}`);
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      messageText,
      attachments
    });

    // Update thread lastMessageAt, and increment unread counts
    chat.lastMessageAt = Date.now();
    if (req.user.role === ROLES.CUSTOMER) {
      chat.unreadCountAgent += 1;
    } else {
      chat.unreadCountCustomer += 1;
    }
    await chat.save();

    // Populate sender info returning
    const populatedMessage = await message.populate('sender', 'name email profilePicture role');

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
