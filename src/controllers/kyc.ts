/**********************************************************************
 * Controller: UploadKYC controller
 * Description: Controller contains functions for user KYC details.
 * Author: Damian Oguche
 * Date: 22-10-2024
 ***********************************************************************/

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../utils/cloudinaryConfig';
import LogFile from '../models/LogFile';
import { Kyc } from '../models/kyc';
import createAppLog from '../utils/createLog';
import currentDate from '../utils/date';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'indentity-pics', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    // Resize image if needed
    transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
  } as any
});

const identityUpload = multer({ storage: storage });

// Validation and sanitization middleware
const validateKYC = [
  body('residential_address')
    .trim()
    .notEmpty()
    .withMessage('Residential address is required')
    .escape(),
  body('work_address')
    .trim()
    .notEmpty()
    .withMessage('Work address is required')
    .escape()
];

// interfaces/KycDetails.ts
export interface KycDetails {
  residential_address: string;
  work_address: string;
  identityUrl: string;
  userId: string;
}

// POST: Create identity
const UploadKYC = async (req: Request, res: Response): Promise<void> => {
  // Get user ID from an authenticated token
  const userId = req.id;
  const identity = req.file as Express.Multer.File; // Get uploaded file from multer

  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ status: 'E00', errors: errors.array() });
    return;
  }

  if (!userId) {
    res.status(400).json({ message: 'User ID is required for KYC.' });
  }

  try {
    // Get request body
    let { residential_address, work_address } = req.body;

    const kycDetails: KycDetails = {
      residential_address,
      work_address,
      identityUrl: identity.path, // Cloudinary URL
      userId: userId!
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

    res.status(200).json({
      status: '00',
      success: true,
      message: 'KYC details Uploaded Successfully!',
      kycDetails
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

export { UploadKYC, validateKYC, identityUpload };
