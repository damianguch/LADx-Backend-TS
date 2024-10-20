/**********************************************************************
 * Controller: Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 14-10-2024
 ***********************************************************************/

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinaryConfig');
const LogFile = require('../models/LogFile');
const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-pics', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Resize image if needed
    transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
  }
});

const upload = multer({ storage: storage });

// PUT: Update Profile Photo
const UpdateProfilePhoto = async (req, res) => {
  const id = req.id;

  const profilePic = req.file; // Get uploaded file from multer
  if (!profilePic) return res.status(400).json({ message: 'No file uploaded' });

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

    // If there is an old profile picture, delete it from Cloudinary using
    // the stored publicId
    if (user.profilePicPublicId) {
      const result = await cloudinary.uploader.destroy(user.profilePicPublicId);
      console.log(`Deleted old image:`, result);
    }

    // Build the user profile photo update object
    const profilePhoto = {};

    // Get the new cloudinary image URL
    profilePhoto.profilePicUrl = req.file.path; // Cloudinary URL

    // Get the publicId
    profilePhoto.profilePicPublicId = req.file.filename; // Cloudinary publicId

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
      profilePhoto
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
