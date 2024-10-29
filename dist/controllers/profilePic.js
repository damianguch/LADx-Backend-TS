"use strict";
/**********************************************************************
 * Controller: Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 12-10-2024
 **********************************************************************/
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
const LogFile_1 = __importDefault(require("../models/LogFile"));
const multer_1 = __importDefault(require("multer"));
const user_1 = __importDefault(require("../models/user"));
const createLog_1 = __importDefault(require("../utils/createLog"));
const date_1 = __importDefault(require("../utils/date"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
// Ensure the uploads directory exists
const profilePicDir = 'uploads/profile-pics';
if (!fs_1.default.existsSync(profilePicDir)) {
    // Create directory if it doesn't exist
    fs_1.default.mkdirSync(profilePicDir, { recursive: true });
}
/*
 * Configure multer to use the diskStorage engine to store
 * uploaded files on the server's disk.
 */
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Specify upload directory
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Generate a unique filename
    }
});
// Initialize Multer with the storage configuration
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/; // Supported image formats
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images (jpeg, jpg, png) are allowed!'));
        }
    }
});
exports.upload = upload;
// Update Profile Photo
const UpdateProfilePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token;
    if (!token) {
        yield (0, createLog_1.default)(`Unauthorized! Please login`);
        return res.status(401).json({ message: 'Unauthorized. Please login' });
    }
    const SECRET_KEY = process.env.JWT_SECRET_KEY;
    if (!SECRET_KEY) {
        throw new Error('JWT_SECRET_KEY not defined in environment variables');
    }
    const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
    const id = decoded.id;
    const profilePic = req.file; // Get uploaded file from multer
    console.log(profilePic);
    try {
        // Check if id is a valid ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            yield (0, createLog_1.default)('Invalid user ID format');
            return res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Invalid user ID format'
            });
        }
        // Automatically casts id to an ObjectId
        const user = yield user_1.default.findById(id);
        console.log(user);
        if (!user) {
            yield (0, createLog_1.default)('User profile not found!');
            return res.status(400).json({
                status: 'E00',
                success: false,
                message: 'User profile not found!'
            });
        }
        // Retrieve old profile picture path before updating the profile
        const oldProfilePic = user.profilePic;
        // Build the user profile photo update object
        const profilePhoto = {};
        if (!profilePic)
            return res.status(400).json({ message: 'No file uploaded' });
        // If profile picture is uploaded, save the path(Image Url) to the database
        profilePhoto.profilePic = `uploads/${profilePic.filename}`;
        // Delete the old profile picture file if it exists
        if (oldProfilePic && fs_1.default.existsSync(`.${oldProfilePic}`)) {
            fs_1.default.unlinkSync(`.${oldProfilePic}`); // Delete the old file
        }
        console.log(profilePhoto);
        // Update user profile photo in database
        yield user_1.default.findByIdAndUpdate(id, { $set: profilePhoto });
        // Log Profile Photo Update activity
        const logUpdate = new LogFile_1.default({
            email: user.email,
            fullname: user.fullname,
            ActivityName: `Profile Photo updated by user: ${user.fullname}`,
            AddedOn: date_1.default
        });
        yield logUpdate.save();
        yield (0, createLog_1.default)('Profile Photo Updated Successfully!');
        return res.status(200).json({
            status: '00',
            success: true,
            message: 'Profile Photo Updated Successfully!',
            data: profilePhoto
        });
    }
    catch (err) {
        yield (0, createLog_1.default)(err.message);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: err.message
        });
    }
});
exports.UpdateProfilePhoto = UpdateProfilePhoto;
