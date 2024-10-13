const LogFile = require('../models/LogFile');
const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const mongoose = require('mongoose');

//Update Profile with Image Upload
const UpdateProfile = async (req, res) => {
  const { id } = req.params;

  // const id = '6706543830437af5872e9c1b';
  const { fullname, country, state } = req.body;

  try {
    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await createAppLog('Invalid user ID format');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid user ID format'
      });
    }

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
  UpdateProfile
};
