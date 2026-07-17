const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please specify a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    required: [true, 'Please provide comment text'],
    trim: true,
    maxlength: [500, 'Comments cannot exceed 500 characters']
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: 'Neutral'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
