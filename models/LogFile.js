const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  UserType: String,
  ActivityName: String,
  Route: String,
  SuperUserId: String,
  AddedOn: String
});

const LogFile = mongoose.model('LogFile', userSchema);

module.exports = LogFile;
