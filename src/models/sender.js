const mongoose = require('mongoose');
const { Schema } = mongoose;

// userSchema outlines the structure of the documents to be stored
// in the Users collection.
const senderSchema = new Schema(
  {
    package_details: {
      type: String,
      required: true
    },

    package_name: {
      type: String,
      required: true
    },

    item_description: {
      type: String,
      required: true
    },

    package_value: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    price: {
      type: String,
      required: true
    },

    address_from: {
      type: String,
      required: true
    },

    address_to: {
      type: String,
      required: true
    },

    reciever_name: {
      type: String,
      required: true
    },

    reciever_phone_number: {
      type: Number,
      required: true
    },

    requestItemsImageUrls: {
      type: [String],
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

const Sender = mongoose.model('Sender', senderSchema);
module.exports = Sender;
