const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Complaint_Update', 'Assignment', 'New_Message', 'Resolution_Feedback', 'SLA_Violation', 'System'],
    default: 'System'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Link to related complaint/ticket
    default: null
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
