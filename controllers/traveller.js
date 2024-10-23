/**********************************************************************
 * Controller: Traveller Details controller
 * Description: Controller contains functions for traveller details.
 * Author: Damian Oguche
 * Date: 23-10-2024
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
    // Get request body
    let {
      flight_number,
      departure_city,
      destination_city,
      depature_date,
      destination_date,
      arrival_time,
      boarding_time,
      airline_name,
      item_weight
    } = req.body;

    // Escape and sanitize inputs
    flight_number = escape(flight_number);
    departure_city = escape(departure_city);
    destination_city = escape(destination_city);
    depature_date = escape(depature_date);
    destination_date = escape(destination_date);
    arrival_time = escape(arrival_time);
    boarding_time = escape(boarding_time);
    airline_name = escape(airline_name);
    item_weight = escape(item_weight);

    // Input validation
    if (!flight_number)
      return res
        .status(400)
        .json({ status: 'E00', message: 'flight number is required' });
    if (!departure_city)
      return res
        .status(400)
        .json({ status: 'E00', message: 'depature city is required' });
    if (!destination_city)
      return res.status(400).json({ message: 'Destination City is required' });
    if (!depature_date)
      return res.status(400).json({ message: 'Departure date is required' });
    if (!arrival_time)
      return res.status(400).json({ message: 'Arrival time is required' });
    if (!boarding_time)
      return res.status(400).json({ message: 'Boarding time is required' });
    if (!item_weight)
      return res.status(400).json({ message: 'Item weight is required' });
    if (!airline_name)
      return res.status(400).json({ message: 'Airline name is required' });
    if (!userId)
      return res.status(400).json({ message: 'User ID is required for KYC.' });

    const travelDetails = {
      flight_number,
      departure_city,
      destination_city,
      depature_date,
      destination_date,
      arrival_time,
      boarding_time,
      airline_name,
      item_weight,
      userId
    };

    try {
      const newTravelDetails = new Traveller(travelDetails);
      await Traveller.init(); // Ensures indexes are created before saving
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

// PUT: edit travel details
const UpdateTravelDetails = async (req, res) => {};

module.exports = {
  TravelDetails,
  UpdateTravelDetails
};
