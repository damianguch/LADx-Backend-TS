const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  ActivityName: String,
  AddedOn: String
});

const LogFile = mongoose.model('LogFile', userSchema);

module.exports = LogFile;
