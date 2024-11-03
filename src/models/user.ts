const mongoose = require('mongoose');
import { Document } from 'mongoose';
const { Schema } = mongoose;

export interface IUser extends Document {
  role: 'sender' | 'traveler';
  fullname: string;
  email: string;
  country: string;
  state: string;
  phone: number;
  password: string;
  confirm_password?: string;
  email_verification_code?: string;
  profilePicUrl?: string;
  profilePicPublicId?: string;
  is_email_verified: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

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
      enum: ['traveler', 'sender'],
      default: 'sender'
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
