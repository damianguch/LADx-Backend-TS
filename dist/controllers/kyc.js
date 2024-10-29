"use strict";
/**********************************************************************
 * Controller: UploadKYC controller
 * Description: Controller contains functions for user KYC details.
 * Author: Damian Oguche
 * Date: 22-10-2024
 ***********************************************************************/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identityUpload = exports.validateKYC = exports.UploadKYC = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinaryConfig_1 = require("../utils/cloudinaryConfig");
const LogFile_1 = __importDefault(require("../models/LogFile"));
const kyc_1 = require("../models/kyc");
const createLog_1 = __importDefault(require("../utils/createLog"));
const date_1 = __importDefault(require("../utils/date"));
const express_validator_1 = require("express-validator");
// Configure Cloudinary storage for Multer
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinaryConfig_1.cloudinary,
    params: {
        folder: 'indentity-pics', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
        // Resize image if needed
        transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
    }
});
const identityUpload = (0, multer_1.default)({ storage: storage });
exports.identityUpload = identityUpload;
// Validation and sanitization middleware
const validateKYC = [
    (0, express_validator_1.body)('residential_address')
        .trim()
        .notEmpty()
        .withMessage('Residential address is required')
        .escape(),
    (0, express_validator_1.body)('work_address')
        .trim()
        .notEmpty()
        .withMessage('Work address is required')
        .escape()
];
exports.validateKYC = validateKYC;
// POST: Create identity
const UploadKYC = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user ID from an authenticated token
    const userId = req.id;
    const identity = req.file; // Get uploaded file from multer
    // Validate request data
    const errors = (0, express_validator_1.validationResult)(req);
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
        const kycDetails = {
            residential_address,
            work_address,
            identityUrl: identity.path, // Cloudinary URL
            userId: userId
        };
        const newKyc = new kyc_1.Kyc(kycDetails);
        yield kyc_1.Kyc.init(); // Ensures indexes are created before saving
        yield newKyc.save();
        // Log the KYC upload
        yield (0, createLog_1.default)('KYC details saved Successfully!');
        const logUpload = new LogFile_1.default({
            ActivityName: `Kyc details added by user ${userId}`,
            AddedOn: date_1.default
        });
        yield logUpload.save();
        res.status(200).json({
            status: '00',
            success: true,
            message: 'KYC details Uploaded Successfully!',
            kycDetails
        });
    }
    catch (err) {
        (0, createLog_1.default)(JSON.stringify({ Error: err.message }));
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error: ' + err.message
        });
    }
});
exports.UploadKYC = UploadKYC;
