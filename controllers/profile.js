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
    await createAppLog(err.message);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: err.message
    });
  }
};

//Update Profile
const UpdateProfile = async (req, res) => {
  const id = req.id;

  try {
    // fetch user info by id
    // const user = await User.findOne({ _id: id });

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

    const { fullname, country, state } = req.body;

    // Build the user profile update object
    const userProfile = {
      fullname,
      country,
      state
    };

    console.log(userProfile);

    await User.findByIdAndUpdate(id, { $set: userProfile }, { new: true });

    // Log Profile Update activity
    const logProfileUpdate = new LogFile({
      fullname: user.fullname,
      email: user.email,
      ActivityName: `Profile updated by user: ${user.fullname}`,
      AddedOn: currentDate
    });

    await logProfileUpdate.save();

    await createAppLog('Profile Updated Successfully!');
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Updated Successfully!',
      data: userProfile
    });
  } catch (err) {
    await createAppLog(err.message);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  UpdateProfile,
  GetUserProfile
};
