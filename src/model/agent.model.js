const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AgentSchema = new Schema({
  name: { type: String, required: true, trim: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Agent', AgentSchema);