/**********************************************************************
 * Controller: Profile Photo controller
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

// POST: create identity
const UploadKYC = async (req, res) => {
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

    if (!identity) return res.status(400).json({ message: 'No file uploaded' });

    let identityUrl;
    try {
      identityUrl = req.file.path; // Cloudinary URL
    } catch (uploadError) {
      createAppLog(JSON.stringify({ Error: uploadError.message }));
      return res.status(500).json({
        status: 'E01',
        message: 'Error uploading identity document. Please try again later.'
      });
    }

    const kycDetails = {
      residential_address,
      work_address,
      identityUrl: req.file.path // Cloudinary URL
    };

    // Create the kyc in the database
    const newKyc = new Kyc(kycDetails);
    await Kyc.init(); // Ensure indexes are created before saving
    await newKyc.save();

    // Log Profile Photo Update activity
    const logKYCUpload = new LogFile({
      ActivityName: `Kyc details added by user`,
      AddedOn: currentDate
    });

    await logKYCUpload.save();
    await createAppLog('KYC details Uploaded Successfully!');

    return res.status(200).json({
      status: '00',
      success: true,
      message: 'KYC details Uploaded Successfully!',
      kycDetails
    });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  UploadKYC,
  identityUpload
};
