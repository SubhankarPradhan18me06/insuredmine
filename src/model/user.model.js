const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: String,
  dob: Date,
  address: String,
  phone: String,
  state: String,
  zip: String,
  email: { type: String, unique: false },
  gender: String,
  userType: String
});

module.exports = mongoose.model('User', UserSchema);
