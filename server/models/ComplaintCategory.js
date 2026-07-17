const mongoose = require('mongoose');

const ComplaintCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    unique: true,
    trim: true,
    maxlength: [40, 'Category name cannot exceed 40 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide category description'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  slaHours: {
    type: Number,
    required: [true, 'Please specify resource SLA in hours'],
    default: 48
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ComplaintCategory', ComplaintCategorySchema);
