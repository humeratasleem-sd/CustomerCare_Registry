const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Please provide department name'],
    trim: true
  },
  assignedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintCategory'
  }],
  performanceRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 5.0
  },
  availability: {
    type: Boolean,
    default: true
  },
  resolvedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Agent', AgentSchema);
