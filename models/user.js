const mongoose = require('mongoose');
const { Schema } = mongoose;

// userSchema outlines the structure of the documents to be stored
// in the Users collection.
const userSchema = new Schema(
  {
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
    confirm_password: String,
    email_verification_code: String,
    profilePicUrl: String,
    profilePicPublicId: String,

    is_email_verified: {
      type: Number,
      default: 0
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
