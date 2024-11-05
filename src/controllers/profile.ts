/**************************************************************************
 * Controller: Profile controller
 * Description: This controller contains the functions for profile update.
 * Author: Damian Oguche
 * Date: 12-10-2024
 **************************************************************************/

import { Request, Response } from 'express';
import LogFile from '../models/LogFile';
import User, { IUser } from '../models/user';
import createAppLog from '../utils/createLog';
import currentDate from '../utils/date';
import { sanitizeProfileInput } from '../utils/sanitize';
import { profileUpdateSchema } from '../schema/profile.schema';

// Get User Profile
const GetUserProfile = async (req: Request, res: Response): Promise<void> => {
  const id = req.id;

  try {
    // Automatically casts id to an ObjectId
    const user: IUser = await User.findById(id);

    if (!user) {
      await createAppLog('User profile not found!');
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'User profile not found!'
      });
    }

    const userProfile = {
      fullname: user.fullname,
      country: user.country,
      state: user.state
    };

    await createAppLog('Profile Retrieved Successfully!');
    res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Retrieved Successfully!',
      profile: userProfile
    });
  } catch (err: any) {
    await createAppLog(
      `Error retrieving profile for user ID: ${id} - ${err.message}`
    );
    res.status(500).json({
      status: 'E00',
      success: false,
      message: err.message
    });
  }
};

//Update Profile
const UpdateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate incoming data
    const { error, value } = profileUpdateSchema.validate(req.body);

    // Validation fails, error object contains the check failures
    if (error) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid input data',
        errors: error.details.map((detail) => detail.message)
      });
    }

    // Sanitize validated input
    // If validation succeeds, value contains the validated
    // data from req.body.
    const sanitizedData = sanitizeProfileInput(value);

    const id = req.id;
    // fetch user info by id
    const user: IUser = await User.findById(id);

    if (!user) {
      await createAppLog(`User not found - ID: ${id}`);
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'User profile not found!'
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: sanitizedData },
      { new: true, runValidators: true }
    );

    // Log Profile Update activity
    await createAppLog(`Profile Updated for user ID: ${id}`);
    const logUpdate = new LogFile({
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      ActivityName: `Profile updated by user ID: ${id}`,
      AddedOn: currentDate
    });

    await logUpdate.save();

    res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Updated Successfully!',
      data: sanitizedData
    });
  } catch (err: any) {
    await createAppLog(`Error updating profile for user ${err.message}`);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'An error occurred while updating the profile: ' + err.message
    });
  }
};

export { UpdateProfile, GetUserProfile };
