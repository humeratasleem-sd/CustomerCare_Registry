const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { COMPLAINT_STATUS, ROLES } = require('../constants');

// Auto check SLA deadlines every 1 hour (represented in milliseconds)
const SLA_CHECK_INTERVAL = 60 * 60 * 1000;

const startSlaMonitor = () => {
  console.log('SLA monitoring daemon initialized.');
  
  // Run immediately on start
  checkSlaViolations();

  // Run on interval
  setInterval(checkSlaViolations, SLA_CHECK_INTERVAL);
};

const checkSlaViolations = async () => {
  try {
    const defaultAdmin = await User.findOne({ role: ROLES.ADMIN }).sort({ createdAt: 1 });
    if (!defaultAdmin) return;

    // Find all unresolved, non-escalated, non-closed complaints where deadline has passed
    const overdueComplaints = await Complaint.find({
      status: { $in: [COMPLAINT_STATUS.PENDING, COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.IN_PROGRESS] },
      slaDeadline: { $lt: new Date() },
      isEscalated: false
    });

    if (overdueComplaints.length === 0) return;

    console.log(`[SLA MONITOR] Found ${overdueComplaints.length} overdue ticket(s). Auto Escalating...`);

    for (const complaint of overdueComplaints) {
      complaint.isEscalated = true;
      complaint.status = COMPLAINT_STATUS.ESCALATED;
      
      // Add timeline entry
      complaint.timeline.push({
        status: COMPLAINT_STATUS.ESCALATED,
        updatedBy: defaultAdmin._id,
        action: 'SLA_VIOLATION_AUTO_ESCALATION',
        comments: 'System Auto Escalated: The ticket has exceeded its resolution SLA timeline limit.',
        timestamp: new Date()
      });

      await complaint.save();

      // Write audit log
      await AuditLog.create({
        user: defaultAdmin._id,
        action: 'SLA_VIOLATION_AUTO_ESCALATION',
        details: `Ticket ${complaint.ticketId} auto escalated due to SLA expiration.`
      });

      // Send notification to assigned agent if any, or to all Admins
      const notifyRecipients = [];
      if (complaint.assignedAgent) {
        notifyRecipients.push(complaint.assignedAgent);
      } else {
        const admins = await User.find({ role: ROLES.ADMIN });
        admins.forEach(admin => notifyRecipients.push(admin._id));
      }

      for (const userId of notifyRecipients) {
        await Notification.create({
          recipient: userId,
          title: `Overdue SLA Escalation: ${complaint.ticketId}`,
          message: `Ticket "${complaint.title}" has breached SLA deadlines and has been escalated.`,
          type: 'SLA_VIOLATION',
          referenceId: complaint._id
        });
      }
    }
  } catch (error) {
    console.error(`SLA Monitor execution failed: ${error.message}`);
  }
};

module.exports = {
  startSlaMonitor,
  checkSlaViolations
};
