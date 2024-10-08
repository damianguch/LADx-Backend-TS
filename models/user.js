const mongoose = require('mongoose');
const { Schema } = mongoose;

// userSchema outlines the structure of the documents to be stored
// in the Users collection.
const userSchema = new Schema({
  fullname: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30
  },

  email: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30,
    unique: true
  },

  country: {
    type: String,
    required: true
  },

  state: {
    type: String,
    required: true
  },

  phone: {
    type: Number,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  confirm_password: {
    type: String,
    required: true
  },

  password_reset_link: {
    type: String
  },

  email_verification_code: {
    type: String
  },

  is_email_verified: Number,

  roles: {
    type: Number,
    default: 0
  },

  created_at: {
    type: Date,
    default: Date.now()
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
