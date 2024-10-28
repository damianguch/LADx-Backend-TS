/**********************************************************************
 * Controller: Get Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 14-10-2024
 **********************************************************************/

import { Request, Response } from 'express';
import User from '../models/user';
import createAppLog from '../utils/createLog';

// GET: Retrieve Profile Photo
const GetProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  const id = req.id;

  try {
    // Automatically casts id to an ObjectId
    const user = await User.findById(id);

    if (!user || !user.profilePicUrl) {
      await createAppLog('User profile photo not found!');
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'User profile Photo not found!'
      });
    }

    await createAppLog('Profile Photo Retrieved Successfully!');
    res.status(200).json({
      status: '00',
      success: true,
      message: 'Profile Photo Retrieved Successfully!',
      profilePic: user.profilePicUrl
    });
  } catch (err: any) {
    await createAppLog(err.message);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: err.message
    });
  }
};

export { GetProfilePhoto };
