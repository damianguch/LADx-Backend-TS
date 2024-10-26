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

// POST: Upload travel details
const TravelDetails = async (req, res) => {
  // Get user ID from an authenticated token
  const userId = req.id;

  try {
    req.body.flight_number = escape(req.body.flight_number);
    req.body.departure_city = escape(req.body.departure_city);
    req.body.destination_city = escape(req.body.destination_city);
    req.body.departure_date = new Date(req.body.departure_date);
    req.body.destination_date = new Date(req.body.destination_date);
    req.body.arrival_time = escape(req.body.arrival_time);
    req.body.boarding_time = escape(req.body.boarding_time);
    req.body.airline_name = escape(req.body.airline_name);
    req.body.item_weight = Number(req.body.item_weight);

    // Input validation
    if (!req.body.flight_number) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Flight number is required' });
    }
    if (!req.body.departure_city) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Departure city is required' });
    }
    if (!req.body.destination_city) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Destination city is required' });
    }
    if (!req.body.departure_date) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Departure date is required' });
    }
    if (!req.body.arrival_time) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Arrival time is required' });
    }
    if (!req.body.boarding_time) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Boarding time is required' });
    }
    if (!req.body.item_weight) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Item weight is required' });
    }
    if (!req.body.airline_name) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'Airline name is required' });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ status: 'E00', message: 'User ID is required for KYC.' });
    }

    const travelDetails = {
      flight_number: req.body.flight_number,
      departure_city: req.body.departure_city,
      destination_city: req.body.destination_city,
      departure_date: req.body.departure_date,
      destination_date: req.body.destination_date,
      arrival_time: req.body.arrival_time,
      boarding_time: req.body.boarding_time,
      airline_name: req.body.airline_name,
      item_weight: req.body.item_weight,
      userId
    };

    try {
      const newTravelDetails = new Traveller(travelDetails);
      await Traveller.init();
      await newTravelDetails.save();
      await createAppLog('Travel details saved Successfully!');
    } catch (dbError) {
      createAppLog(JSON.stringify({ Error: dbError.message }));
      return res.status(500).json({
        status: 'E00',
        message: 'Error saving travel details to the database.'
      });
    }

    try {
      const logTravelDetails = new LogFile({
        ActivityName: `Travel details added by user`,
        AddedOn: currentDate
      });
      await logTravelDetails.save();
    } catch (logError) {
      console.error('Error saving log file:', logError); // Log the error
      createAppLog(JSON.stringify({ Error: logError.message }));
      return res.status(500).json({
        status: 'E03',
        message: 'Error saving log details to the database.'
      });
    }

    createAppLog(JSON.stringify('Travel details saved Successfully!'));
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Travel details saved Successfully!',
      TravelDetails
    });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// PUT: Edit travel details
const UpdateTravelDetails = async (req, res) => {
  // Get the user ID from the authenticated token
  const userId = req.id;

  if (!userId)
    return res
      .status(400)
      .json({ message: 'User ID is required for request update.' });

  try {
    // Get request body
    // Escape and sanitize inputs if they are provided
    req.body.flight_number = escape(req.body.flight_number);
    req.body.departure_city = escape(req.body.departure_city);
    req.body.destination_city = escape(req.body.destination_city);
    req.body.departure_date = new Date(req.body.departure_date);
    req.body.destination_date = new Date(req.body.destination_date);
    req.body.arrival_time = escape(req.body.arrival_time);
    req.body.boarding_time = escape(req.body.boarding_time);
    req.body.airline_name = escape(req.body.airline_name);
    req.body.item_weight = Number(req.body.item_weight);

    // Find the existing request details
    const travelDetails = await Traveller.findOne({ userId });

    if (!travelDetails) {
      return res
        .status(404)
        .json({ message: `Request details with id ${userId} not found.` });
    }

    // Initialize an update object
    // (Using conditional object property spread syntax)
    let travelDetailsObject = {
      ...(req.body.flight_number && { flight_number: req.body.flight_number }),
      ...(req.body.departure_city && {
        departure_city: req.body.departure_city
      }),
      ...(req.body.destination_city && {
        destination_city: req.body.destination_city
      }),
      ...(req.body.departure_date && {
        departure_date: req.body.departure_date
      }),
      ...(req.body.destination_date && {
        destination_date: req.body.destination_date
      }),
      ...(req.body.arrival_time && { arrival_time: req.body.arrival_time }),
      ...(req.body.boarding_time && { boarding_time: req.body.boarding_time }),
      ...(req.body.airline_name && { airline_name: req.body.airline_name }),
      ...(req.body.item_weight && { item_weight: req.body.item_weight })
    };

    let updatedTravelDetails;

    try {
      // Update the request details in the database
      const id = travelDetails._id;
      updatedTravelDetails = await Traveller.findByIdAndUpdate(
        id,
        { $set: travelDetailsObject },
        { new: true }
      );

      if (!updatedTravelDetails) {
        return res.status(404).json({ message: 'Travel details not found.' });
      }

      await createAppLog('Travel details updated successfully!');

      // Log the update action
      const logTravelDetailsUpdate = new LogFile({
        ActivityName: `Travel details updated by user`,
        AddedOn: currentDate
      });
      await logTravelDetailsUpdate.save();
    } catch (dbError) {
      createAppLog(JSON.stringify({ Error: dbError.message }));
      return res.status(500).json({
        status: 'E00',
        message: 'Error updating travel details in the database.'
      });
    }

    // Return success response
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Travel details updated successfully!',
      updatedTravelDetails
    });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  TravelDetails,
  UpdateTravelDetails
};
