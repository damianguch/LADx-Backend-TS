/**************************************************************************
 * Controller: Profile controller
 * Description: This controller contains the functions for profile update.
 * Author: Damian Oguche
 * Date: 12-10-2024
 **************************************************************************/

const LogFile = require('../models/LogFile');
const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const { sanitizeProfileInput } = require('../utils/sanitize');
const { profileUpdateSchema } = require('../validators/profileValidator');

// Get User Profile
const GetUserProfile = async (req, res) => {
  const id = req.id;

  try {
    // Automatically casts id to an ObjectId
    const user = await User.findById(id);

    if (!user) {
      await createAppLog('User profile not found!');
      return res.status(400).json({
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
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Retrieved Successfully!',
      profile: userProfile
    });
  } catch (err) {
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
const UpdateProfile = async (req, res) => {
  try {
    // Validate incoming data
    const { error, value } = profileUpdateSchema.validate(req.body);

    // Validation fails, error object contains the check failures
    if (error) {
      return res.status(400).json({
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
    const user = await User.findById(id);

    if (!user) {
      await createAppLog(`User not found - ID: ${id}`);
      return res.status(400).json({
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
    await createAppLog(`Profile Updated for user ID: ${userId}`);
    const logUpdate = new LogFile({
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      ActivityName: `Profile updated by user ID: ${id}`,
      AddedOn: currentDate
    });

    await logUpdate.save();

    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Updated Successfully!',
      data: sanitizedData
    });
  } catch (err) {
    await createAppLog(
      `Error updating profile for user ID: ${userId} - ${err.message}`
    );
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'An error occurred while updating the profile: ' + err.message
    });
  }
};

module.exports = {
  UpdateProfile,
  GetUserProfile
};
