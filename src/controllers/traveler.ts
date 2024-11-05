/**********************************************************************
 * Controller: Traveller Details controller
 * Description: Controller contains functions for traveller details.
 * Author: Damian Oguche
 * Date: 24-10-2024
 ***********************************************************************/

import LogFile from '../models/LogFile';
import Traveller from '../models/traveller';
import createAppLog from '../utils/createLog';
import currentDate from '../utils/date';
import { escape } from 'validator';
import { travelDetailsSchema } from '../schema/travel.schema';
import { sanitizedTraveldetails } from '../utils/sanitize';
import { Request, Response } from 'express';

// @POST: Upload travel details
const TravelDetails = async (req: Request, res: Response): Promise<void> => {
  // Get user id from an authenticated token
  const userId = req.id;

  if (!userId) {
    res.status(400).json({
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
    res.status(400).json({
      status: 'E00',
      success: false,
      message: 'Validation errors occurred',
      errors: error.details.map((err) => err.message)
    });
  }

  const sanitizedData = sanitizedTraveldetails(value);

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

    res.status(200).json({
      status: '00',
      success: true,
      message: 'Travel details saved Successfully!',
      travelDetails: sanitizedData
    });
  } catch (err) {
    createAppLog(`Error saving travel details: ${(err as Error).message}`);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + (err as Error).message
    });
  }
};

// @PUT: Edit travel details
const UpdateTravelDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Get the user ID from the authenticated token
  const userId = req.id;

  if (!userId)
    res.status(400).json({
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
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid date format for departure or destination date.'
      });
    }
    if (travelDetails.item_weight && isNaN(travelDetails.item_weight)) {
      res.status(400).json({
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
      res.status(404).json({
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

    res.status(200).json({
      status: '00',
      success: true,
      message: 'Travel details updated successfully!',
      updatedTravelDetails
    });
  } catch (err) {
    createAppLog(JSON.stringify({ Error: (err as Error).message }));
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + (err as Error).message
    });
  }
};

export { TravelDetails, UpdateTravelDetails };
