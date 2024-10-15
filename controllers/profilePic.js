const LogFile = require('../models/LogFile');
const multer = require('multer');
const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');

/**
 * Controller: Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 12-10-2024
 */

// Ensure the uploads directory exists
const profilePicDir = 'uploads/profile-pics';
if (!fs.existsSync(profilePicDir)) {
  // Create directory if it doesn't exist
  fs.mkdirSync(profilePicDir, { recursive: true });
}

/*
 * Configure multer to use the diskStorage engine to store
 * uploaded files on the server's disk.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Specify upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Generate a unique filename
  }
});

// Initialize Multer with the storage configuration
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/; // Supported image formats
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) are allowed!'));
    }
  }
});

//Update Profile Photo
const UpdateProfilePhoto = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    await createAppLog(`Unauthorized! Please login`);
    return res.status(401).json({ message: 'Unauthorized. Please login' });
  }

  const SECRET_KEY = process.env.JWT_SECRET_KEY;
  const decoded = jwt.verify(token, SECRET_KEY);
  const id = decoded.id;

  const profilePic = req.file; // Get uploaded file from multer

  console.log(profilePic);

  try {
    // const id = '6706543830437af5872e9c1b';
    // const { id } = req.params;

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

    if (!user) {
      await createAppLog('User profile not found!');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'User profile not found!'
      });
    }

    // Retrieve old profile picture path before updating the profile
    const oldProfilePic = user.profilePic;

    // Build the user profile photo update object
    const profilePhoto = {};

    if (!profilePic)
      return res.status(400).json({ message: 'No file uploaded' });

    // If profile picture is uploaded, save the path(Image Url) to the database
    profilePhoto.profilePic = `uploads/${profilePic.filename}`;

    // Delete the old profile picture file if it exists
    if (oldProfilePic && fs.existsSync(`.${oldProfilePic}`)) {
      fs.unlinkSync(`.${oldProfilePic}`); // Delete the old file
    }

    console.log(profilePhoto);

    // Update user profile photo in database
    await User.findByIdAndUpdate(id, { $set: profilePhoto });

    // Log Profile Photo Update activity
    const logProfilePhotoUpdate = new LogFile({
      email: user.email,
      fullname: user.fullname,
      ActivityName: `Profile Photo updated by user: ${user.fullname}`,
      AddedOn: currentDate
    });

    await logProfilePhotoUpdate.save();

    await createAppLog('Profile Photo Updated Successfully!');
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Photo Updated Successfully!',
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
  UpdateProfilePhoto,
  upload
};
