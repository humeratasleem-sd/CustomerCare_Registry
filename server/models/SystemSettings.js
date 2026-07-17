const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  enableAiPredictions: {
    type: Boolean,
    default: true
  },
  automaticEscalationTimeHours: {
    type: Number,
    default: 48
  },
  maxFileSizeMB: {
    type: Number,
    default: 5
  },
  systemEmailSender: {
    type: String,
    default: 'system@customercare.com'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
