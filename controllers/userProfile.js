const LogFile = require('../models/LogFile');
const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const mongoose = require('mongoose');

//Update Profile
const UpdateProfile = async (req, res) => {
  const { id } = req.params;
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

    const userProfile = {
      fullname,
      country,
      state
    };

    await User.findByIdAndUpdate(id, { $set: userProfile });

    // Save log activity
    const logProfileUpdate = new LogFile({
      fullname,
      activityName: `Profile updated by user: ${user.fullname}`,
      addedOn: currentDate
    });

    await logProfileUpdate.save();

    await createAppLog('Profile Updated Successfully!');
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Updated Successfully!'
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

module.exports = { UpdateProfile };
