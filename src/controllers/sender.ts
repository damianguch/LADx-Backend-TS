/**********************************************************************
 * Controller: Request Details(Sender) controller
 * Description: Controller contains functions for sender details.
 * Author: Damian Oguche
 * Date: 26-10-2024
 ***********************************************************************/

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../utils/cloudinaryConfig';
import LogFile from '../models/LogFile';
import { Sender } from '../models/sender';
import createAppLog from '../utils/createLog';
import currentDate from '../utils/date';
import { escape, isNumeric } from 'validator';
import { Request, Response } from 'express';

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'requestItems-pics', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Resize image if needed
    transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
  } as any
});

const requestItemsImageUpload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 } // Limit file size to 1MB
}).array('itemPics', 5); // Adjust the limit of files as needed

interface RequestData {
  package_details: string;
  package_name: string;
  item_description: string;
  package_value: string;
  quantity: string;
  price: string;
  address_from: string;
  address_to: string;
  reciever_name: string;
  reciever_phone_number: string;
}

// POST: Request Delivery
const RequestDetails = async (req: Request, res: Response): Promise<void> => {
  // Get user ID from an authenticated token
  const userId = req.id;

  if (!userId)
    res.status(400).json({ status: 'E00', message: 'User id is required.' });

  // Get file upload
  const requestItemsImages = (req.files as Express.Multer.File[]) || [];

  // Helper function to sanitize and validate input data
  const sanitizeInputData = (data: RequestData) => ({
    package_details: escape(data.package_details),
    package_name: escape(data.package_name),
    item_description: escape(data.item_description),
    package_value: escape(data.package_value),
    quantity: isNumeric(data.quantity) ? Number(data.quantity) : null,
    price: escape(data.price),
    address_from: escape(data.address_from),
    address_to: escape(data.address_to),
    reciever_name: escape(data.reciever_name),
    reciever_phone_number: isNumeric(data.reciever_phone_number)
      ? Number(data.reciever_phone_number)
      : null
  });

  try {
    // Sanitize and validate the input
    const sanitizedData: { [key: string]: any } = sanitizeInputData(req.body);

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
        res.status(400).json({
          status: 'E00',
          success: false,
          message: `${field.replace('_', ' ')} is required.`
        });
      }
    }

    // Ensure multiple files upload check
    if (!requestItemsImages || requestItemsImages.length === 0) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'At least one Image upload is required.'
      });
    }

    // Collect image URLs
    const imageUrls = requestItemsImages.map((file) => file.path);

    const requestDetails = {
      ...sanitizedData,
      requestItemsImageUrls: imageUrls, // Store all image URLs
      userId
    };

    const newRequestDetails = new Sender(requestDetails);
    await Sender.init();
    await newRequestDetails.save();
    await createAppLog('Request details saved Successfully!');

    const logRequestDetails = new LogFile({
      ActivityName: `Request details uploaded by user ${userId}`,
      AddedOn: currentDate
    });
    await logRequestDetails.save();

    createAppLog('Request details saved Successfully!');
    res.status(200).json({
      status: '00',
      success: true,
      message: 'Request details saved Successfully!',
      requestDetails
    });
  } catch (err: any) {
    createAppLog(JSON.stringify({ Error: err.message }));
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + err.message
    });
  }
};

// PUT: Update(Partial) request details
const UpdateRequestDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Get the user ID from the authenticated token
  const userId = req.id;
  if (!userId)
    res.status(400).json({
      status: 'E00',
      success: false,
      message: 'User ID is required for request update.'
    });

  // Get uploaded files (array of images)
  const requestItemsImages = (req.files as Express.Multer.File[]) || [];

  try {
    let newImageUrls: string[] = [];

    // If images were uploaded, replace the existing image URLs
    if (requestItemsImages && requestItemsImages.length > 0) {
      newImageUrls = requestItemsImages.map((file) => file.path);
      // existingRequestDetails.requestItemsImageUrls = newImageUrls;
    }

    // Initialize an update object(Condition Spread Operator)
    let requestDetails = {
      ...(req.body.package_details && {
        package_details: escape(req.body.package_details)
      }),
      ...(req.body.package_name && {
        package_name: escape(req.body.package_name)
      }),
      ...(req.body.item_description && {
        item_description: escape(req.body.item_description)
      }),
      ...(req.body.package_value && {
        package_value: escape(req.body.package_value)
      }),
      ...(req.body.quantity && { quantity: Number(req.body.quantity) }),
      ...(req.body.price && { price: escape(req.body.price) }),
      ...(req.body.address_from && {
        address_from: escape(req.body.address_from)
      }),
      ...(req.body.address_to && { address_to: escape(req.body.address_to) }),
      ...(req.body.reciever_name && {
        reciever_name: escape(req.body.reciever_name)
      }),
      ...(req.body.reciever_phone_number && {
        reciever_phone_number: Number(req.body.reciever_phone_number)
      }),
      ...(newImageUrls.length > 0 && { requestItemsImageUrls: newImageUrls })
    };

    if (
      requestDetails.reciever_phone_number &&
      isNaN(requestDetails.reciever_phone_number)
    ) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Receiver phone number must be a number.'
      });
    }

    // Find the existing request details
    // const existingRequestDetails = await Sender.findOne({ userId });

    // Update the request details in the database
    // const id = existingRequestDetails.id;
    const updatedRequestDetails = await Sender.findOneAndUpdate(
      { userId },
      { $set: requestDetails },
      { new: true }
    );

    if (!updatedRequestDetails) {
      res.status(404).json({
        status: 'E00',
        success: false,
        message: `Request details with user ID ${userId} not found.`
      });
    }

    // Log the update action
    await createAppLog('Request details updated successfully!');
    const logRequestDetailsUpdate = new LogFile({
      ActivityName: `Request details updated by user ${userId}`,
      AddedOn: currentDate
    });
    await logRequestDetailsUpdate.save();

    // Return success response
    res.status(200).json({
      status: '00',
      success: true,
      message: 'Request details updated successfully!',
      updatedRequestDetails
    });
  } catch (err: any) {
    createAppLog(JSON.stringify({ Error: err.message }));
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + err.message
    });
  }
};

export { UpdateRequestDetails, RequestDetails, requestItemsImageUpload };
