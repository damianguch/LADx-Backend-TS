const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  ActivityName: String,
  AddedOn: String
});

const LogFile = mongoose.model('LogFile', logSchema);

module.exports = LogFile;
