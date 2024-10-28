/**********************************************************************
 * Controller: Get Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 14-10-2024
 **********************************************************************/

const User = require('../models/user');
const { createAppLog } = require('../utils/createLog');

// GET: Retrieve Profile Photo
const GetProfilePhoto = async (req, res) => {
  const id = req.id;

  try {
    // Automatically casts id to an ObjectId
    const user = await User.findById(id);

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
