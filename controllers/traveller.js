/**********************************************************************
 * Controller: Traveller Details controller
 * Description: Controller contains functions for traveller details.
 * Author: Damian Oguche
 * Date: 24-10-2024
 ***********************************************************************/

const LogFile = require('../models/LogFile');
const Traveller = require('../models/traveller');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const { escape } = require('validator');
const Joi = require('joi');

// Validation schema using Joi
const travelDetailsSchema = Joi.object({
  flight_number: Joi.string().required().messages({
    'any.required': 'Flight number is required'
  }),
  departure_city: Joi.string().required().messages({
    'any.required': 'Departure city is required'
  }),
  destination_city: Joi.string().required().messages({
    'any.required': 'Destination city is required'
  }),
  departure_date: Joi.date().required().messages({
    'any.required': 'Departure date is required'
  }),
  destination_date: Joi.date().optional(),
  arrival_time: Joi.string().required().messages({
    'any.required': 'Arrival time is required'
  }),
  boarding_time: Joi.string().required().messages({
    'any.required': 'Boarding time is required'
  }),
  airline_name: Joi.string().required().messages({
    'any.required': 'Airline name is required'
  }),
  item_weight: Joi.number().required().messages({
    'any.required': 'Item weight is required'
  })
});

// POST: Upload travel details
const TravelDetails = async (req, res) => {
  // Get user id from an authenticated token
  const userId = req.id;

  if (!userId) {
    return res.status(400).json({
      status: 'E00',
      success: false,
      message: 'User ID is required for travel details submission.'
    });
  }

  // Validate request body against schema
  const { error, value } = travelDetailsSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      status: 'E00',
      success: false,
      message: 'Validation errors occurred',
      errors: error.details.map((err) => err.message)
    });
  }

  // Escape and sanitize fields
  const sanitizedData = {
    flight_number: escape(value.flight_number),
    departure_city: escape(value.departure_city),
    destination_city: escape(value.destination_city),
    departure_date: new Date(value.departure_date),
    destination_date: new Date(value.destination_date),
    arrival_time: escape(value.arrival_time),
    boarding_time: escape(value.boarding_time),
    airline_name: escape(value.airline_name),
    item_weight: value.item_weight,
    userId
  };

  try {
    const newTravelDetails = new Traveller(sanitizedData);
    await Traveller.init();
    await newTravelDetails.save();

    // Log the action
    await createAppLog('Travel details saved Successfully!');
    const logEntry = new LogFile({
      ActivityName: `Travel details added by user ${userId}`,
      AddedOn: currentDate
    });
    await logEntry.save();

    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Travel details saved Successfully!',
      travelDetails: sanitizedData
    });
  } catch (err) {
    createAppLog(`Error saving travel details: ${err.message}`);
    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + err.message
    });
  }
};

// PUT: Edit travel details
const UpdateTravelDetails = async (req, res) => {
  // Get the user ID from the authenticated token
  const userId = req.id;

  if (!userId)
    return res.status(400).json({
      status: 'E00',
      success: false,
      message: 'User ID is required for request update.'
    });

  try {
    // Find the existing request details
    // const existingTravelDetails = await Traveller.findOne({ userId });

    //update object (conditional spread operator)
    const travelDetails = {
      ...(req.body.flight_number && {
        flight_number: escape(req.body.flight_number)
      }),
      ...(req.body.departure_city && {
        departure_city: escape(req.body.departure_city)
      }),
      ...(req.body.destination_city && {
        destination_city: escape(req.body.destination_city)
      }),
      ...(req.body.departure_date && {
        departure_date: new Date(req.body.departure_date)
      }),
      ...(req.body.destination_date && {
        destination_date: new Date(req.body.destination_date)
      }),
      ...(req.body.arrival_time && {
        arrival_time: escape(req.body.arrival_time)
      }),
      ...(req.body.boarding_time && {
        boarding_time: escape(req.body.boarding_time)
      }),
      ...(req.body.airline_name && {
        airline_name: escape(req.body.airline_name)
      }),
      ...(req.body.item_weight && { item_weight: Number(req.body.item_weight) })
    };

    // Validate dates and number fields before proceeding
    if (
      isNaN(travelDetails.departure_date) ||
      isNaN(travelDetails.destination_date)
    ) {
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid date format for departure or destination date.'
      });
    }
    if (travelDetails.item_weight && isNaN(travelDetails.item_weight)) {
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Item weight must be a number.'
      });
    }

    // Update the request details in the database
    // const id = existingTravelDetails.id;
    const updatedTravelDetails = await Traveller.findOneAndUpdate(
      { userId },
      { $set: travelDetails },
      { new: true }
    );

    if (!updatedTravelDetails) {
      return res.status(404).json({
        status: 'E00',
        success: false,
        message: `Travel details with user ID ${userId} not found.`
      });
    }

    // Log the update action
    await createAppLog('Travel details updated successfully!');
    const logUpdate = new LogFile({
      ActivityName: `Travel details updated by user ${userId}`,
      AddedOn: currentDate
    });
    await logUpdate.save();

    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Travel details updated successfully!',
      updatedTravelDetails
    });
  } catch (err) {
    createAppLog(JSON.stringify({ Error: err.message }));
    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + err.message
    });
  }
};

module.exports = {
  TravelDetails,
  UpdateTravelDetails
};
