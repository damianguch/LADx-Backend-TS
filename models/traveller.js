const mongoose = require('mongoose');
const { Schema } = mongoose;

// userSchema outlines the structure of the documents to be stored
// in the Users collection.
const travellerSchema = new Schema(
  {
    flight_number: {
      type: String,
      required: true
    },

    departure_city: {
      type: String,
      required: true
    },

    destination_city: {
      type: String,
      required: true
    },

    departure_date: {
      type: Date,
      required: true
    },

    destination_date: {
      type: Date,
      required: true
    },

    arrival_time: {
      type: String,
      required: true
    },

    boarding_time: {
      type: String,
      required: true
    },

    airline_name: String,
    item_weight: Number,

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    } // Foreign key to User model
  },
  { timestamps: true }
);

const Traveller = mongoose.model('Traveller', travellerSchema);
module.exports = Traveller;
