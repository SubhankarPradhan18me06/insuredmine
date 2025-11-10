const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountSchema = new Schema({
  accountName: { type: String, required: true, trim: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Optional compound index to avoid duplicate account names for same user
AccountSchema.index({ accountName: 1, user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Account', AccountSchema);
