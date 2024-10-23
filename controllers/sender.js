/**********************************************************************
 * Controller: Request Details(Sender) controller
 * Description: Controller contains functions for sender details.
 * Author: Damian Oguche
 * Date: 23-10-2024
 ***********************************************************************/

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinaryConfig');
const LogFile = require('../models/LogFile');
const Sender = require('../models/kyc');
const { createAppLog } = require('../utils/createLog');
const { currentDate } = require('../utils/date');
const { escape } = require('validator');

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'requestItems-pics', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Resize image if needed
    transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
  }
});

const requestItemsImageUpload = multer({ storage: storage }).array(
  'itemPics',
  5
);

// POST: request delivery
const RequestDetails = async (req, res) => {
  // Get user ID from an authenticated token
  const userId = req.id;

  // Get file upload
  const requestItemImages = req.files;

  try {
    // Get request body
    let {
      package_details,
      package_name,
      item_description,
      package_value,
      quantity,
      price,
      address_from,
      address_to,
      reciever_name,
      reciever_phone_number
    } = req.body;

    // Escape and sanitize inputs
    package_details = escape(package_details);
    package_name = escape(package_name);
    item_description = escape(item_description);
    package_value = escape(package_value);
    quantity = escape(quantity);
    price = escape(price);
    address_from = escape(address_from);
    address_to = escape(address_to);
    reciever_name = escape(reciever_name);
    reciever_phone_number = escape(reciever_phone_number);

    // Input validation
    if (!package_details)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Package details is required' });
    if (!package_name)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Package name is required' });
    if (!item_description)
      return res.status(400).json({ message: 'Item description is required' });
    if (!package_value)
      return res.status(400).json({ message: 'Package valueis required' });
    if (!quantity)
      return res.status(400).json({ message: 'Quantity  is required' });
    if (!price) return res.status(400).json({ message: 'Price is required' });
    if (!address_from)
      return res.status(400).json({ message: 'Address from is required' });
    if (!address_to)
      return res.status(400).json({ message: 'Address to is required' });
    if (!reciever_name)
      return res.status(400).json({ message: 'Reciever name is required' });
    if (!reciever_phone_number)
      return res
        .status(400)
        .json({ message: 'Reciever phone number  is required' });
    if (!userId)
      return res.status(400).json({ message: 'User ID is required for KYC.' });

    // Ensure multiple files upload check
    if (!requestItemImages || requestItemImage.length === 0) {
      return res
        .status(400)
        .json({ message: 'At least one Image upload is required.' });
    }

    // Collect image URLs
    const imageUrls = requestItemImages.map((file) => file.path);

    const requestDetails = {
      package_details,
      package_name,
      item_description,
      package_value,
      quantity,
      price,
      address_from,
      address_to,
      reciever_name,
      reciever_phone_number,
      requestItemsUrl: imageUrls, // Store all image URLs
      userId
    };

    try {
      const newRequestDetails = new Sender(requestDetails);
      await Sender.init();
      await newRequestDetails.save();
      await createAppLog('Request details saved Successfully!');
    } catch (dbError) {
      createAppLog(JSON.stringify({ Error: dbError.message }));
      return res.status(500).json({
        status: 'E00',
        message: 'Error saving request details to the database.'
      });
    }

    try {
      const logRequestDetails = new LogFile({
        ActivityName: `Request details added by user`,
        AddedOn: currentDate
      });
      await logRequestDetails.save();
    } catch (logError) {
      console.error('Error saving log file:', logError); // Log the error
      createAppLog(JSON.stringify({ Error: logError.message }));
      return res.status(500).json({
        status: 'E00',
        message: 'Error saving log details to the database.'
      });
    }

    createAppLog(JSON.stringify('Request details saved Successfully!'));
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Request details saved Successfully!',
      requestDetails
    });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// PUT: Update shipping details
const UpdateRequestDetails = async (req, res) => {};

module.exports = {
  UpdateRequestDetails,
  RequestDetails,
  requestItemsImageUpload
};
