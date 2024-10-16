/*******************************************
 * Controller: Profile Photo controller
 * Description: Controller contains functions for profile
                photo update.
 * Author: Damian Oguche
 * Date: 14-10-2024
 ********************************************/

const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { createAppLog } = require('../utils/createLog');
const mongoose = require('mongoose');

// GET: Retrieve Profile Photo
const GetProfilePhoto = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    await createAppLog(`Unauthorized! Please login`);
    return res.status(401).json({ message: 'Unauthorized. Please login' });
  }

  const SECRET_KEY = process.env.JWT_SECRET_KEY;
  const decoded = jwt.verify(token, SECRET_KEY);
  const id = decoded.id;

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

    // Automatically casts id to an ObjectId
    const user = await User.findById(id);

    console.log(user);

    if (!user || !user.profilePicUrl) {
      await createAppLog('User profile photo not found!');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'User profile Photo not found!'
      });
    }

    await createAppLog('Profile Photo Retrieved Successfully!');
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Photo Retrieved Successfully!',
      profilePic: user.profilePicUrl
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
  GetProfilePhoto
};
