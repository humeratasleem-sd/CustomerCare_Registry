const mongoose = require('mongoose');
const { COMPLAINT_STATUS, COMPLAINT_PRIORITY } = require('../constants');

const TimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(COMPLAINT_STATUS),
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  comments: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintCategory',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a complaint title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a detailed description'],
    trim: true
  },
  priority: {
    type: String,
    enum: Object.values(COMPLAINT_PRIORITY),
    default: COMPLAINT_PRIORITY.MEDIUM
  },
  status: {
    type: String,
    enum: Object.values(COMPLAINT_STATUS),
    default: COMPLAINT_STATUS.PENDING
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    type: String // URLs to files
  }],
  slaDeadline: {
    type: Date
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  internalNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolutionDetails: {
    type: String,
    default: ''
  },
  resolutionAttachments: [{
    type: String
  }],
  timeline: [TimelineSchema],
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Create index for search capability
ComplaintSchema.index({ ticketId: 'text', title: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', ComplaintSchema);
