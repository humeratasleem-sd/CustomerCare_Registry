const Complaint = require('../models/Complaint');
const ComplaintCategory = require('../models/ComplaintCategory');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { sendEmail } = require('../config/mail');
const { predictPriority, predictCategory } = require('../helpers/nlp');
const { COMPLAINT_STATUS, COMPLAINT_PRIORITY, ROLES, TICKET_PREFIX } = require('../constants');

// Helper to generate unique ticket ID
const generateTicketId = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${TICKET_PREFIX.COMPLAINT}${num}`;
};

// @desc    Raise a new complaint
// @route   POST /api/complaints
// @access  Private (Customer Only)
exports.createComplaint = async (req, res) => {
  try {
    const { title, description } = req.body;
    let { category, priority } = req.body;

    // AI Prediction: Auto-assign Category and Priority if they are missing or left empty
    if (!category || category === 'auto' || category === '') {
      const predictedCatId = await predictCategory(title, description);
      if (predictedCatId) category = predictedCatId.toString();
    }
    
    if (!priority || priority === 'auto' || priority === '') {
      priority = predictPriority(title, description);
    }

    // Verify category exists
    const categoryDoc = await ComplaintCategory.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Complaint category not found' });
    }

    // Calculate SLA deadline
    const slaHours = categoryDoc.slaHours || 48;
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + slaHours);

    // Process attachments from multer upload
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push(`/uploads/${file.filename}`);
      });
    }

    const ticketId = generateTicketId();

    // Create complaint document
    const complaint = new Complaint({
      ticketId,
      customer: req.user._id,
      category,
      title,
      description,
      priority,
      status: COMPLAINT_STATUS.PENDING,
      attachments,
      slaDeadline
    });

    // Record initial timeline activity
    complaint.timeline.push({
      status: COMPLAINT_STATUS.PENDING,
      updatedBy: req.user._id,
      action: 'TICKET_CREATED',
      comments: 'Customer raised ticket in portal.'
    });

    // Automated Agent Load-Balanced Routing:
    // Find agents qualified for this category, who are available
    const qualifiedAgents = await Agent.find({
      assignedCategories: category,
      availability: true
    }).populate('user');

    let assignedAgentId = null;

    if (qualifiedAgents.length > 0) {
      // Find the agent with the lowest unresolved/active complaint load
      let bestAgent = null;
      let minLoad = Infinity;

      for (const agent of qualifiedAgents) {
        // Unresolved load includes: Assigned, In Progress, Waiting Customer, Escalated
        const activeLoad = await Complaint.countDocuments({
          assignedAgent: agent.user._id,
          status: { $in: [COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.IN_PROGRESS, COMPLAINT_STATUS.WAITING_CUSTOMER, COMPLAINT_STATUS.ESCALATED] }
        });

        if (activeLoad < minLoad) {
          minLoad = activeLoad;
          bestAgent = agent;
        }
      }

      if (bestAgent) {
        assignedAgentId = bestAgent.user._id;
        complaint.assignedAgent = assignedAgentId;
        complaint.status = COMPLAINT_STATUS.ASSIGNED;

        // Record assignment on timeline
        complaint.timeline.push({
          status: COMPLAINT_STATUS.ASSIGNED,
          updatedBy: req.user._id,
          action: 'AUTO_AGENT_ASSIGNMENT',
          comments: `System routed ticket to Agent ${bestAgent.user.name} (Active Load: ${minLoad} tickets).`
        });
      }
    }

    await complaint.save();

    // Update Customer complaint count
    await Customer.updateOne(
      { user: req.user._id },
      { $inc: { complaintCount: 1 } }
    );

    // Create Notification for Customer
    await Notification.create({
      recipient: req.user._id,
      title: 'Complaint Registered',
      message: `Your complaint has been logged under ID ${ticketId}. Priority: ${priority}.`,
      type: 'Complaint_Update',
      referenceId: complaint._id
    });

    // Create Notification and email for Agent if assigned
    if (assignedAgentId) {
      const agentUser = await User.findById(assignedAgentId);
      await Notification.create({
        recipient: assignedAgentId,
        title: 'New Complaint Assigned',
        message: `Ticket ${ticketId} has been assigned to you. SLA Deadline: ${slaDeadline.toLocaleString()}`,
        type: 'Assignment',
        referenceId: complaint._id
      });

      // Send email to Agent
      await sendEmail({
        to: agentUser.email,
        subject: `New Ticket Assigned - ${ticketId}`,
        html: `<h3>New Customer Complaint</h3>
               <p><strong>Ticket ID:</strong> ${ticketId}</p>
               <p><strong>Category:</strong> ${categoryDoc.name}</p>
               <p><strong>Title:</strong> ${title}</p>
               <p><strong>Priority:</strong> ${priority}</p>
               <p>Please log in to your dashboard to review it.</p>`
      });
    }

    // Send email to Customer
    await sendEmail({
      to: req.user.email,
      subject: `Complaint Registered - ${ticketId}`,
      html: `<h3>We have received your complaint</h3>
             <p>A support representative has been assigned to review your issue.</p>
             <p><strong>Ticket ID:</strong> ${ticketId}</p>
             <p><strong>Title:</strong> ${title}</p>
             <p><strong>SLA Resolution Estimate:</strong> ${slaHours} hours</p>
             <p>Track progress inside the client registry portal.</p>`
    });

    res.status(201).json({
      success: true,
      message: 'Complaint ticket created successfully',
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints with filters, search, pagination, and sorting
// @route   GET /api/complaints
// @access  Private (All Roles - Filtered by role)
exports.getComplaints = async (req, res) => {
  try {
    const { status, priority, category, isEscalated, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    // Role-based Access Isolation
    if (req.user.role === ROLES.CUSTOMER) {
      query.customer = req.user._id;
    } else if (req.user.role === ROLES.AGENT) {
      query.assignedAgent = req.user._id;
    }

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (isEscalated !== undefined) query.isEscalated = isEscalated === 'true';

    // Global Search (Indexed Title, Description, and Ticket ID query)
    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    const complaints = await Complaint.find(query)
      .populate('customer', 'name email profilePicture')
      .populate('category', 'name slaHours')
      .populate('assignedAgent', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      count: complaints.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalCount: total,
      complaints
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Private (All roles with ownership check)
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('customer', 'name email profilePicture')
      .populate('category', 'name slaHours')
      .populate('assignedAgent', 'name email profilePicture')
      .populate('timeline.updatedBy', 'name role')
      .populate('internalNotes.addedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    // Security check: Customers can only view their own complaints
    if (req.user.role === ROLES.CUSTOMER && complaint.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this ticket' });
    }

    // Security check: Agents can only view assigned complaints unless they are Admins
    if (req.user.role === ROLES.AGENT && complaint.assignedAgent && complaint.assignedAgent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. Ticket is assigned to another Agent.' });
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status or assignee
// @route   PUT /api/complaints/:id
// @access  Private (Agent / Admin)
exports.updateComplaint = async (req, res) => {
  try {
    const { status, pRating, priority, assignedAgent } = req.body;
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    const previousStatus = complaint.status;

    // Check authority: Agents can only update their assigned tickets
    if (req.user.role === ROLES.AGENT && complaint.assignedAgent && complaint.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You are not assigned to this ticket.' });
    }

    // 1. Assign/Reassign agent (Admin only)
    if (assignedAgent && req.user.role === ROLES.ADMIN) {
      complaint.assignedAgent = assignedAgent;
      complaint.status = COMPLAINT_STATUS.ASSIGNED;
      
      complaint.timeline.push({
        status: COMPLAINT_STATUS.ASSIGNED,
        updatedBy: req.user._id,
        action: 'AGENT_ASSIGNMENT',
        comments: `Admin manually assigned ticket to Agent.`
      });

      // notify agent
      await Notification.create({
        recipient: assignedAgent,
        title: 'Ticket Assigned to You',
        message: `Admin has assigned ticket ${complaint.ticketId} to you.`,
        type: 'Assignment',
        referenceId: complaint._id
      });
    }

    // 2. Update priority (Admin only)
    if (priority && req.user.role === ROLES.ADMIN) {
      complaint.priority = priority;
    }

    // 3. Update status (Admin or Assigned Agent)
    if (status && status !== previousStatus) {
      complaint.status = status;

      complaint.timeline.push({
        status,
        updatedBy: req.user._id,
        action: 'STATUS_UPDATED',
        comments: `Status transitioned from ${previousStatus} to ${status}.`
      });

      // Notify customer
      await Notification.create({
        recipient: complaint.customer,
        title: `Complaint Status Updated: ${status}`,
        message: `Your ticket ${complaint.ticketId} is now marked as ${status}.`,
        type: 'Complaint_Update',
        referenceId: complaint._id
      });
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept assigned complaint
// @route   PUT /api/complaints/:id/accept
// @access  Private (Agent Only)
exports.acceptComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to accept this complaint' });
    }

    complaint.status = COMPLAINT_STATUS.IN_PROGRESS;
    complaint.timeline.push({
      status: COMPLAINT_STATUS.IN_PROGRESS,
      updatedBy: req.user._id,
      action: 'TICKET_ACCEPTED',
      comments: 'Agent accepted the assignment and began investigation.'
    });

    await complaint.save();

    await Notification.create({
      recipient: complaint.customer,
      title: 'Investigation Initiated',
      message: `Your complaint ${complaint.ticketId} has been accepted and is In Progress.`,
      type: 'Complaint_Update',
      referenceId: complaint._id
    });

    res.status(200).json({ success: true, message: 'Complaint accepted. Status set to In Progress.', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject assigned complaint
// @route   PUT /api/complaints/:id/reject
// @access  Private (Agent Only)
exports.rejectComplaint = async (req, res) => {
  try {
    const { comments } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to reject this complaint' });
    }

    complaint.assignedAgent = undefined;
    complaint.status = COMPLAINT_STATUS.PENDING;
    complaint.timeline.push({
      status: COMPLAINT_STATUS.PENDING,
      updatedBy: req.user._id,
      action: 'TICKET_REJECTED',
      comments: comments || 'Agent rejected assignment, returned to queue.'
    });

    await complaint.save();

    // Notify admins about the rejection so they reassign
    const admins = await User.find({ role: ROLES.ADMIN });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        title: 'Assigned Ticket Rejected',
        message: `Agent rejected ticket ${complaint.ticketId}. Reason: ${comments || 'No active reasons given.'}`,
        type: 'System',
        referenceId: complaint._id
      });
    }

    res.status(200).json({ success: true, message: 'Complaint returned to queue.', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add internal notes to ticket
// @route   POST /api/complaints/:id/notes
// @access  Private (Agent / Admin)
exports.addInternalNote = async (req, res) => {
  try {
    const { note } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.internalNotes.push({
      note,
      addedBy: req.user._id
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Internal note logging saved successfully',
      internalNotes: complaint.internalNotes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Escalate complaint manually
// @route   POST /api/complaints/:id/escalate
// @access  Private (Agent / Admin)
exports.escalateComplaint = async (req, res) => {
  try {
    const { comments } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = COMPLAINT_STATUS.ESCALATED;
    complaint.isEscalated = true;
    complaint.timeline.push({
      status: COMPLAINT_STATUS.ESCALATED,
      updatedBy: req.user._id,
      action: 'MANUAL_ESCALATION',
      comments: comments || 'Agent or Admin marked ticket as Escalated.'
    });

    await complaint.save();

    // Notify Customer and Admins
    await Notification.create({
      recipient: complaint.customer,
      title: 'Ticket Escalated',
      message: `Your complaint ${complaint.ticketId} has been escalated to senior management.`,
      type: 'Complaint_Update',
      referenceId: complaint._id
    });

    const admins = await User.find({ role: ROLES.ADMIN });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        title: 'Ticket Escalated Warning',
        message: `Ticket ${complaint.ticketId} escalated by ${req.user.name}.`,
        type: 'SLA_VIOLATION',
        referenceId: complaint._id
      });
    }

    res.status(200).json({ success: true, message: 'Complaint escalated successfully', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve complaint
// @route   POST /api/complaints/:id/resolve
// @access  Private (Agent / Admin)
exports.resolveComplaint = async (req, res) => {
  try {
    const { resolutionDetails } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Process resolution attachments
    const resolutionAttachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        resolutionAttachments.push(`/uploads/${file.filename}`);
      });
    }

    complaint.status = COMPLAINT_STATUS.RESOLVED;
    complaint.resolutionDetails = resolutionDetails;
    complaint.resolutionAttachments = resolutionAttachments;
    complaint.resolvedAt = new Date();
    
    complaint.timeline.push({
      status: COMPLAINT_STATUS.RESOLVED,
      updatedBy: req.user._id,
      action: 'TICKET_RESOLVED',
      comments: `Ticket resolved. Summary: ${resolutionDetails}`
    });

    await complaint.save();

    // Increment Agent's resolvedCount count
    if (complaint.assignedAgent) {
      await Agent.updateOne(
        { user: complaint.assignedAgent },
        { $inc: { resolvedCount: 1 } }
      );
    }

    // Send Notification to Customer requesting review
    await Notification.create({
      recipient: complaint.customer,
      title: 'Issue Resolved & Review Requested',
      message: `Your complaint ${complaint.ticketId} is marked as Resolved. Please review and provide feedback.`,
      type: 'Resolution_Feedback',
      referenceId: complaint._id
    });

    // Send email to Customer
    const customerUser = await User.findById(complaint.customer);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const feedbackUrl = `${clientUrl}/complaints/${complaint._id}`;

    await sendEmail({
      to: customerUser.email,
      subject: `Complaint Resolved - ${complaint.ticketId}`,
      html: `<h3>Your complaint has been resolved</h3>
             <p>Our support team has resolved issue ${complaint.ticketId}.</p>
             <p><strong>Resolution details:</strong> ${resolutionDetails}</p>
             <p>Please log of your account to approve the resolution or request amendments.</p>
             <a href="${feedbackUrl}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Leave Feedback</a>`
    });

    res.status(200).json({ success: true, message: 'Complaint resolved. Customer notified.', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Close complaint
// @route   POST /api/complaints/:id/close
// @access  Private (Customer / Admin)
exports.closeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Authorize: Only complaining customer or Admin can close
    if (req.user.role === ROLES.CUSTOMER && complaint.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this ticket.' });
    }

    complaint.status = COMPLAINT_STATUS.CLOSED;
    complaint.closedAt = new Date();
    
    complaint.timeline.push({
      status: COMPLAINT_STATUS.CLOSED,
      updatedBy: req.user._id,
      action: 'TICKET_CLOSED',
      comments: 'Customer or Admin closed the resolved complaint.'
    });

    await complaint.save();

    // Notify agent if assigned
    if (complaint.assignedAgent) {
      await Notification.create({
        recipient: complaint.assignedAgent,
        title: 'Ticket Closed',
        message: `Ticket ${complaint.ticketId} has been officially Closed by user.`,
        type: 'Complaint_Update',
        referenceId: complaint._id
      });
    }

    res.status(200).json({ success: true, message: 'Complaint officially closed.', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
