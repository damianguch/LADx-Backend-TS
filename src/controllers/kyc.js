/**********************************************************************
 * Controller: UploadKYC controller
 * Description: Controller contains functions for user KYC details.
 * Author: Damian Oguche
 * Date: 22-10-2024
 ***********************************************************************/

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinaryConfig');
const LogFile = require('../models/LogFile');
const Kyc = require('../models/kyc');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const { escape } = require('validator');

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'indentity-pics', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Resize image if needed
    transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
  }
});

const identityUpload = multer({ storage: storage });

// POST: Create identity
const UploadKYC = async (req, res) => {
  // Get user ID from an authenticated token
  const userId = req.id;
  const identity = req.file; // Get uploaded file from multer

  try {
    // Get request body
    let { residential_address, work_address } = req.body;

    // Escape and sanitize inputs
    residential_address = escape(residential_address);
    work_address = escape(work_address);

    // Input validation
    if (!residential_address)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Residential address is required' });
    if (!work_address)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Work address is required' });

    if (!userId)
      return res.status(400).json({ message: 'User ID is required for KYC.' });

    const kycDetails = {
      residential_address,
      work_address,
      identityUrl: identity.path, // Cloudinary URL
      userId
    };

    const newKyc = new Kyc(kycDetails);
    await Kyc.init(); // Ensures indexes are created before saving
    await newKyc.save();

    // Log the KYC upload
    await createAppLog('KYC details saved Successfully!');
    const logUpload = new LogFile({
      ActivityName: `Kyc details added by user ${userId}`,
      AddedOn: currentDate
    });
    await logUpload.save();

    return res.status(200).json({
      status: '00',
      success: true,
      message: 'KYC details Uploaded Successfully!',
      kycDetails
    });
  } catch (err) {
    createAppLog(JSON.stringify({ Error: err.message }));
    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + err.message
    });
  }
};

module.exports = {
  UploadKYC,
  identityUpload
};
