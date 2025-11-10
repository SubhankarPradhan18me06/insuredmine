const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PolicySchema = new Schema({
  policy_number: { type: String, required: true, trim: true, index: true },
  policy_start_date: { type: Date },
  policy_end_date: { type: Date },

  // collection ids as described in the requirement
  category_collection_id: { type: String, trim: true },
  company_collection_id: { type: String, trim: true },

  // relations
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  account: { type: Schema.Types.ObjectId, ref: 'Account' },
  agent: { type: Schema.Types.ObjectId, ref: 'Agent' },
  lob: { type: Schema.Types.ObjectId, ref: 'LOB' },
  carrier: { type: Schema.Types.ObjectId, ref: 'Carrier' }
}, { timestamps: true });

// optional: ensure uniqueness of policy number per company_collection_id if desired
// PolicySchema.index({ policy_number: 1, company_collection_id: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Policy', PolicySchema);
