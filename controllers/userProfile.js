const LogFile = require('../models/LogFile');
const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');

//Update Profile
const UpdateProfile = async (req, res) => {
  const { id } = req.params;
  const { fullname, country, state } = req.body;

  const userProfile = {
    fullname,
    country,
    state
  };

  try {
    // fetch user info by id
    const userId = { _id: id };
    const user = await User.find(userId);

    if (!user) {
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid operation!'
      });
    }
    await User.findByIdAndUpdate(user[0]._id, {
      userProfile
    });

    const token = req.headers['authorization'];

    // Decode JWT token
    const arrayString = token.split(' ');
    const decodedJWT = jwt.decode(arrayString[1]);
    const userEmail = decodedJWT.email;

    // Save log activity
    const logProfileUpdate = new LogFile({
      fullname,
      activityName: `Profile updated by user: ${user[0].fullname}`,
      addedOn: currentDate
    });

    await logProfileUpdate.save();

    await createAppLog('Profile Updated Successfully!');
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Updated Successfully!'
    });
  } catch (error) {
    await createAppLog(error);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: error.message
    });
  }
};

module.exports = { UpdateProfile };
