const mongoose = require('mongoose');
const { SUPPORT_TYPE } = require('../constants');

const SupportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  ticketType: {
    type: String,
    enum: Object.values(SUPPORT_TYPE),
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'Processing', 'Closed'],
    default: 'Open'
  },
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    type: String,
    default: ''
  },
  resolvedAt: Date
}, {
  timestamps: true
});

SupportTicketSchema.index({ ticketId: 'text', subject: 'text' });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
