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
const { request } = require('express');

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

// POST: Request Delivery
const RequestDetails = async (req, res) => {
  // Get user ID from an authenticated token
  const userId = req.id;

  // Get file upload
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

    // Input validation
    if (!req.body.package_details)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Package details is required' });
    if (!req.body.package_name)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Package name is required' });
    if (!req.body.item_description)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Item description is required' });
    if (!req.body.package_value)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Package value is required' });
    if (!req.body.quantity)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Quantity  is required' });
    if (!req.body.price)
      return res.status(400).json({ message: 'Price is required' });
    if (!req.body.address_from)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Address from is required' });
    if (!req.body.address_to)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Address to is required' });
    if (!req.body.reciever_name)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Reciever name is required' });
    if (!req.body.reciever_phone_number)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Reciever phone number  is required' });
    if (!userId)
      return res
        .status(400)
        .json({ status: 'E00', message: 'User ID is required for KYC.' });

    // Ensure multiple files upload check
    if (!requestItemsImages || requestItemsImages.length === 0) {
      return res
        .status(400)
        .json({ message: 'At least one Image upload is required.' });
    }

    // Collect image URLs
    const imageUrls = requestItemsImages.map((file) => file.path);

    const requestDetails = {
      package_details: req.body.package_details,
      package_name: req.body.package_name,
      item_description: req.body.item_description,
      package_value: req.body.package_value,
      quantity: req.body.quantity,
      price: req.body.price,
      address_from: req.body.address_from,
      address_to: req.body.address_to,
      reciever_name: req.body.reciever_name,
      reciever_phone_number: req.body.reciever_phone_number,
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

    // Escape and sanitize inputs if they are provided
    if (package_details) package_details = escape(package_details);
    if (package_name) package_name = escape(package_name);
    if (item_description) item_description = escape(item_description);
    if (package_value) package_value = escape(package_value);
    if (quantity) quantity = escape(quantity);
    if (price) price = escape(price);
    if (address_from) address_from = escape(address_from);
    if (address_to) address_to = escape(address_to);
    if (reciever_name) reciever_name = escape(reciever_name);
    if (reciever_phone_number)
      reciever_phone_number = escape(reciever_phone_number);

    // Find the existing request details
    const requestDetails = await Sender.findById(userId);
    if (!requestDetails) {
      return res.status(404).json({ message: 'Request details not found.' });
    }

    // If images were uploaded, replace the existing image URLs
    if (requestItemImages && requestItemImages.length > 0) {
      const newImageUrls = requestItemImages.map((file) => file.path);
      requestDetails.requestItemsUrls = newImageUrls; // Replace old images
    }

    // Initialize an update object
    let requestDetailsObject = {
      ...(package_details && { package_details }),
      ...(package_name && { package_name }),
      ...(item_description && { item_description }),
      ...(package_value && { package_value }),
      ...(quantity && { quantity }),
      ...(price && { price }),
      ...(address_from && { address_from }),
      ...(address_to && { address_to }),
      ...(reciever_name && { reciever_name }),
      ...(reciever_phone_number && { reciever_phone_number })
    };

    try {
      // Update the request details in the database
      const updatedRequestDetails = await Sender.findByIdAndUpdate(
        userId,
        { $set: requestDetailsObject },
        { new: true }
      );

      if (!updatedRequestDetails) {
        return res.status(404).json({ message: 'Request details not found.' });
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
      requestDetails
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
