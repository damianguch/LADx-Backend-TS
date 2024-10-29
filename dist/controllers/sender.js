"use strict";
/**********************************************************************
 * Controller: Request Details(Sender) controller
 * Description: Controller contains functions for sender details.
 * Author: Damian Oguche
 * Date: 26-10-2024
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
exports.requestItemsImageUpload = exports.RequestDetails = exports.UpdateRequestDetails = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinaryConfig_1 = require("../utils/cloudinaryConfig");
const LogFile_1 = __importDefault(require("../models/LogFile"));
const sender_1 = require("../models/sender");
const createLog_1 = __importDefault(require("../utils/createLog"));
const date_1 = __importDefault(require("../utils/date"));
const validator_1 = require("validator");
// Configure Cloudinary storage for Multer
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinaryConfig_1.cloudinary,
    params: {
        folder: 'requestItems-pics', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
        // Resize image if needed
        transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
    }
});
const requestItemsImageUpload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 } // Limit file size to 1MB
}).array('itemPics', 5); // Adjust the limit of files as needed
exports.requestItemsImageUpload = requestItemsImageUpload;
// POST: Request Delivery
const RequestDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user ID from an authenticated token
    const userId = req.id;
    if (!userId)
        res.status(400).json({ status: 'E00', message: 'User id is required.' });
    // Get file upload
    const requestItemsImages = req.files || [];
    // Helper function to sanitize and validate input data
    const sanitizeInputData = (data) => ({
        package_details: (0, validator_1.escape)(data.package_details),
        package_name: (0, validator_1.escape)(data.package_name),
        item_description: (0, validator_1.escape)(data.item_description),
        package_value: (0, validator_1.escape)(data.package_value),
        quantity: (0, validator_1.isNumeric)(data.quantity) ? Number(data.quantity) : null,
        price: (0, validator_1.escape)(data.price),
        address_from: (0, validator_1.escape)(data.address_from),
        address_to: (0, validator_1.escape)(data.address_to),
        reciever_name: (0, validator_1.escape)(data.reciever_name),
        reciever_phone_number: (0, validator_1.isNumeric)(data.reciever_phone_number)
            ? Number(data.reciever_phone_number)
            : null
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
        const requestDetails = Object.assign(Object.assign({}, sanitizedData), { requestItemsImageUrls: imageUrls, // Store all image URLs
            userId });
        const newRequestDetails = new sender_1.Sender(requestDetails);
        yield sender_1.Sender.init();
        yield newRequestDetails.save();
        yield (0, createLog_1.default)('Request details saved Successfully!');
        const logRequestDetails = new LogFile_1.default({
            ActivityName: `Request details uploaded by user ${userId}`,
            AddedOn: date_1.default
        });
        yield logRequestDetails.save();
        (0, createLog_1.default)('Request details saved Successfully!');
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Request details saved Successfully!',
            requestDetails
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
exports.RequestDetails = RequestDetails;
// PUT: Update(Partial) request details
const UpdateRequestDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the user ID from the authenticated token
    const userId = req.id;
    if (!userId)
        res.status(400).json({
            status: 'E00',
            success: false,
            message: 'User ID is required for request update.'
        });
    // Get uploaded files (array of images)
    const requestItemsImages = req.files || [];
    try {
        let newImageUrls = [];
        // If images were uploaded, replace the existing image URLs
        if (requestItemsImages && requestItemsImages.length > 0) {
            newImageUrls = requestItemsImages.map((file) => file.path);
            // existingRequestDetails.requestItemsImageUrls = newImageUrls;
        }
        // Initialize an update object(Condition Spread Operator)
        let requestDetails = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (req.body.package_details && {
            package_details: (0, validator_1.escape)(req.body.package_details)
        })), (req.body.package_name && {
            package_name: (0, validator_1.escape)(req.body.package_name)
        })), (req.body.item_description && {
            item_description: (0, validator_1.escape)(req.body.item_description)
        })), (req.body.package_value && {
            package_value: (0, validator_1.escape)(req.body.package_value)
        })), (req.body.quantity && { quantity: Number(req.body.quantity) })), (req.body.price && { price: (0, validator_1.escape)(req.body.price) })), (req.body.address_from && {
            address_from: (0, validator_1.escape)(req.body.address_from)
        })), (req.body.address_to && { address_to: (0, validator_1.escape)(req.body.address_to) })), (req.body.reciever_name && {
            reciever_name: (0, validator_1.escape)(req.body.reciever_name)
        })), (req.body.reciever_phone_number && {
            reciever_phone_number: Number(req.body.reciever_phone_number)
        })), (newImageUrls.length > 0 && { requestItemsImageUrls: newImageUrls }));
        if (requestDetails.reciever_phone_number &&
            isNaN(requestDetails.reciever_phone_number)) {
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
        const updatedRequestDetails = yield sender_1.Sender.findOneAndUpdate({ userId }, { $set: requestDetails }, { new: true });
        if (!updatedRequestDetails) {
            res.status(404).json({
                status: 'E00',
                success: false,
                message: `Request details with user ID ${userId} not found.`
            });
        }
        // Log the update action
        yield (0, createLog_1.default)('Request details updated successfully!');
        const logRequestDetailsUpdate = new LogFile_1.default({
            ActivityName: `Request details updated by user ${userId}`,
            AddedOn: date_1.default
        });
        yield logRequestDetailsUpdate.save();
        // Return success response
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Request details updated successfully!',
            updatedRequestDetails
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
exports.UpdateRequestDetails = UpdateRequestDetails;
