const mongoose = require('mongoose');

const ScheduledMessageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  scheduledAt: { type: Date, required: true, index: true },
  timezone: { type: String }, // optional, e.g., "Asia/Kolkata"
  status: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  doneAt: { type: Date },
  result: { type: mongoose.Schema.Types.Mixed } // store delivery metadata or errors
});

module.exports = mongoose.model('ScheduledMessage', ScheduledMessageSchema);
