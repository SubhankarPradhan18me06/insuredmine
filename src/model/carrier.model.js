const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CarrierSchema = new Schema({
  company_name: { type: String, required: true, trim: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Carrier', CarrierSchema);
