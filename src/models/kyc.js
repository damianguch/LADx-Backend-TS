const mongoose = require('mongoose');
const { Schema } = mongoose;

// The kycSchema outlines the structure of the documents to be stored
// in the Kyc collection.
const kycSchema = new Schema(
  {
    residential_address: {
      type: String,
      required: true
    },

    work_address: {
      type: String,
      required: true
    },

    identityUrl: {
      type: String,
      required: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    } // Foreign key to User model
  },
  { timestamps: true }
);

const Kyc = mongoose.model('Kyc', kycSchema);

module.exports = Kyc;
