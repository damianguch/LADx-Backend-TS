"use strict";
/**********************************************************************
 * Controller: Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 14-10-2024
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
exports.upload = exports.UpdateProfilePhoto = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinaryConfig_1 = require("../utils/cloudinaryConfig");
const LogFile_1 = __importDefault(require("../models/LogFile"));
const user_1 = __importDefault(require("../models/user"));
const createLog_1 = __importDefault(require("../utils/createLog"));
const date_1 = __importDefault(require("../utils/date"));
// Configure Cloudinary storage for Multer
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinaryConfig_1.cloudinary,
    params: {
        folder: 'profile-pics', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg'],
        // Resize image if needed
        transformation: { width: 150, height: 150, crop: 'limit', quality: 'auto' }
    }
});
const upload = (0, multer_1.default)({ storage: storage });
exports.upload = upload;
// PUT: Update Profile Photo
const UpdateProfilePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.id;
    const profilePic = req.file; // Get uploaded file from multer
    if (!profilePic) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    try {
        // If there is an old profile picture, delete it from Cloudinary using
        // the stored publicId
        if (user_1.default.profilePicPublicId) {
            const result = yield cloudinaryConfig_1.cloudinary.uploader.destroy(user_1.default.profilePicPublicId);
            console.log(`Deleted old image:`, result);
        }
        // Build the user profile photo update object
        const profilePhoto = {};
        // Get the new cloudinary image URL
        profilePhoto.profilePicUrl = profilePic.path; // Cloudinary URL
        // Get the publicId
        profilePhoto.profilePicPublicId = profilePic.filename; // Cloudinary publicId
        // Update user profile photo in database
        const user = yield user_1.default.findByIdAndUpdate(id, { $set: profilePhoto });
        if (!user) {
            yield (0, createLog_1.default)('User profile not found!');
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'User profile not found!'
            });
        }
        // Log Profile Photo Update activity
        yield (0, createLog_1.default)('Profile Photo Updated Successfully!');
        const logUpdate = new LogFile_1.default({
            email: user.email,
            fullname: user.fullname,
            ActivityName: `Profile Photo updated by user: ${user.fullname}`,
            AddedOn: date_1.default
        });
        yield logUpdate.save();
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Profile Photo Updated Successfully!',
            profilePhoto
        });
    }
    catch (err) {
        yield (0, createLog_1.default)(JSON.stringify(err.message));
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal server error: ' + err.message
        });
    }
});
exports.UpdateProfilePhoto = UpdateProfilePhoto;
