/**********************************************************************
 * Controller: Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 14-10-2024
 ***********************************************************************/

import { Request, Response } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../utils/cloudinaryConfig';
import LogFile from '../models/LogFile';
import User, { IUser } from '../models/user';
import createAppLog from '../utils/createLog';
import currentDate from '../utils/date';

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile-pics', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Resize image if needed
    transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
  } as any
});

const upload = multer({ storage: storage });

// PUT: Update Profile Photo
const UpdateProfilePhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.id;

  const profilePic = req.file; // Get uploaded file from multer
  if (!profilePic) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  try {
    // If there is an old profile picture, delete it from Cloudinary using
    // the stored publicId
    if (User.profilePicPublicId) {
      const result = await cloudinary.uploader.destroy(User.profilePicPublicId);
      console.log(`Deleted old image:`, result);
    }

    // Build the user profile photo update object
    const profilePhoto = {} as {
      profilePicUrl: string;
      profilePicPublicId: string;
    };

    // Get the new cloudinary image URL
    profilePhoto.profilePicUrl = profilePic.path; // Cloudinary URL
    // Get the publicId
    profilePhoto.profilePicPublicId = profilePic.filename; // Cloudinary publicId

    // Update user profile photo in database
    const user: IUser = await User.findByIdAndUpdate(id, {
      $set: profilePhoto
    });

    if (!user) {
      await createAppLog('User profile not found!');
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'User profile not found!'
      });
    }

    // Log Profile Photo Update activity
    await createAppLog('Profile Photo Updated Successfully!');
    const logUpdate = new LogFile({
      email: user.email,
      fullname: user.fullname,
      ActivityName: `Profile Photo updated by user: ${user.fullname}`,
      AddedOn: currentDate
    });
    await logUpdate.save();

    res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Photo Updated Successfully!',
      profilePhoto
    });
  } catch (err: any) {
    await createAppLog(JSON.stringify(err.message));
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal server error: ' + err.message
    });
  }
};

export { UpdateProfilePhoto, upload };
