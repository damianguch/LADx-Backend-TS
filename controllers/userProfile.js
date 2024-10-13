const LogFile = require('../models/LogFile');
const multer = require('multer');
const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Ensure the uploads/profile-pics directory exists
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

//Update Profile with Image Upload
const UpdateProfile = async (req, res) => {
  const { id } = req.params;
  const { fullname, country, state } = req.body;
  const profilePic = req.file; // Get uploaded file from multer

  console.log(profilePic);

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

    // If profile picture is uploaded, save the path to the database
    if (!profilePic) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    userProfile.profilePic = `uploads/${profilePic.filename}`;

    console.log(userProfile);

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
  UpdateProfile: [
    upload.single('profilePic'), // Expecting `profilePic` from form-data
    UpdateProfile
  ]
};
