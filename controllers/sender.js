/**********************************************************************
 * Controller: Request Details(Sender) controller
 * Description: Controller contains functions for sender details.
 * Author: Damian Oguche
 * Date: 26-10-2024
 ***********************************************************************/

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinaryConfig');
const LogFile = require('../models/LogFile');
const Sender = require('../models/sender');
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

const requestItemsImageUpload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 } // Limit file size to 1MB
}).array('itemPics', 5); // Adjust the limit of files as needed

// POST: Request Delivery
const RequestDetails = async (req, res) => {
  // Get user ID from an authenticated token
  const userId = req.id;

  if (!userId)
    return res
      .status(400)
      .json({ status: 'E00', message: 'User ID is required .' });

  // Get file upload
  const requestItemsImages = req.files;

  // Helper function to sanitize and validate input data
  const sanitizeInputData = (data) => ({
    package_details: escape(data.package_details),
    package_name: escape(data.package_name),
    item_description: escape(data.item_description),
    package_value: escape(data.package_value),
    quantity: Number(data.quantity),
    price: escape(data.price),
    address_from: escape(data.address_from),
    address_to: escape(data.address_to),
    reciever_name: escape(data.reciever_name),
    reciever_phone_number: Number(data.reciever_phone_number)
  });

  try {
    // Sanitize and validate the input
    const sanitizedData = sanitizeInputData(req.body);

    // Validate required fields
    const requiredFields = [
      'package_details',
      'package_name',
      'item_description',
      'package_value',
      'quantity',
      'price',
      'address_from',
      'address_to',
      'reciever_name',
      'reciever_phone_number'
    ];

    for (let field of requiredFields) {
      if (!sanitizedData[field]) {
        return res.status(400).json({
          status: 'E00',
          message: `${field.replace('_', ' ')} is required.`
        });
      }
    }

    // Ensure multiple files upload check
    if (!requestItemsImages || requestItemsImages.length === 0) {
      return res
        .status(400)
        .json({ message: 'At least one Image upload is required.' });
    }

    // Collect image URLs
    const imageUrls = requestItemsImages.map((file) => file.path);

    const requestDetails = {
      ...sanitizedData,
      requestItemsImageUrls: imageUrls, // Store all image URLs
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
        ActivityName: `Request details uploaded by user`,
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
    return res.status(500).json({ message: 'Internal Server Error' + error });
  }
};

// PUT: Update(Partial) request details
const UpdateRequestDetails = async (req, res) => {
  // Get the user ID from the authenticated token
  const userId = req.id;
  if (!userId)
    return res
      .status(400)
      .json({ message: 'User ID is required for request update.' });

  // Get uploaded files (array of images)
  const requestItemsImages = req.files;

  try {
    // Get request body, escape and sanitize inputs
    req.body.package_details = escape(req.body.package_details);
    req.body.package_name = escape(req.body.package_name);
    req.body.item_description = escape(req.body.item_description);
    req.body.package_value = escape(req.body.package_value);
    req.body.quantity = Number(req.body.quantity);
    req.body.price = escape(req.body.price);
    req.body.address_from = escape(req.body.address_from);
    req.body.address_to = escape(req.body.address_to);
    req.body.reciever_name = escape(req.body.reciever_name);
    req.body.reciever_phone_number = Number(req.body.reciever_phone_number);

    // Find the existing request details
    const existingRequestDetails = await Sender.findOne({ userId });
    if (!existingRequestDetails) {
      return res
        .status(404)
        .json({ message: 'Existing Request details not found.' });
    }

    let newImageUrls = [];

    // If images were uploaded, replace the existing image URLs
    if (requestItemsImages && requestItemsImages.length > 0) {
      newImageUrls = requestItemsImages.map((file) => file.path);
      // existingRequestDetails.requestItemsImageUrls = newImageUrls;
    }

    // Initialize an update object(Condition Spread Operator)
    let requestDetailsObject = {
      ...(req.body.package_details && {
        package_details: req.body.package_details
      }),
      ...(req.body.package_name && { package_name: req.body.package_name }),
      ...(req.body.item_description && {
        item_description: req.body.item_description
      }),
      ...(req.body.package_value && { package_value: req.body.package_value }),
      ...(req.body.quantity && { quantity: req.body.quantity }),
      ...(req.body.price && { price: req.body.price }),
      ...(req.body.address_from && { address_from: req.body.address_from }),
      ...(req.body.address_to && { address_to: req.body.address_to }),
      ...(req.body.reciever_name && { reciever_name: req.body.reciever_name }),
      ...(req.body.reciever_phone_number && {
        reciever_phone_number: req.body.reciever_phone_number
      }),
      ...(newImageUrls.length > 0 && { requestItemsImageUrls: newImageUrls })
    };

    let updatedRequestDetails;

    try {
      const id = existingRequestDetails.id;
      // Update the request details in the database
      updatedRequestDetails = await Sender.findByIdAndUpdate(
        id,
        { $set: requestDetailsObject },
        { new: true }
      );

      if (!updatedRequestDetails) {
        return res
          .status(404)
          .json({ message: 'Updated Request details not found.' });
      }

      await createAppLog('Request details updated successfully!');

      // Log the update action
      const logRequestDetailsUpdate = new LogFile({
        ActivityName: `Request details updated by user`,
        AddedOn: currentDate
      });
      await logRequestDetailsUpdate.save();
    } catch (dbError) {
      createAppLog(JSON.stringify({ Error: dbError.message }));
      return res.status(500).json({
        status: 'E00',
        message: 'Error updating request details in the database.'
      });
    }

    // Return success response
    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Request details updated successfully!',
      updatedRequestDetails
    });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  UpdateRequestDetails,
  RequestDetails,
  requestItemsImageUpload
};
