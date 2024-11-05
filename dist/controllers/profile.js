"use strict";
/**************************************************************************
 * Controller: Profile controller
 * Description: This controller contains the functions for profile update.
 * Author: Damian Oguche
 * Date: 12-10-2024
 **************************************************************************/
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
exports.GetUserProfile = exports.UpdateProfile = void 0;
const LogFile_1 = __importDefault(require("../models/LogFile"));
const user_1 = __importDefault(require("../models/user"));
const createLog_1 = __importDefault(require("../utils/createLog"));
const date_1 = __importDefault(require("../utils/date"));
const sanitize_1 = require("../utils/sanitize");
const profile_schema_1 = require("../schema/profile.schema");
// Get User Profile
const GetUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.id;
    try {
        // Automatically casts id to an ObjectId
        const user = yield user_1.default.findById(id);
        if (!user) {
            yield (0, createLog_1.default)('User profile not found!');
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'User profile not found!'
            });
        }
        const userProfile = {
            fullname: user.fullname,
            country: user.country,
            state: user.state
        };
        yield (0, createLog_1.default)('Profile Retrieved Successfully!');
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Profile Retrieved Successfully!',
            profile: userProfile
        });
    }
    catch (err) {
        yield (0, createLog_1.default)(`Error retrieving profile for user ID: ${id} - ${err.message}`);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: err.message
        });
    }
});
exports.GetUserProfile = GetUserProfile;
//Update Profile
const UpdateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate incoming data
        const { error, value } = profile_schema_1.profileUpdateSchema.validate(req.body);
        // Validation fails, error object contains the check failures
        if (error) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Invalid input data',
                errors: error.details.map((detail) => detail.message)
            });
        }
        // Sanitize validated input
        // If validation succeeds, value contains the validated
        // data from req.body.
        const sanitizedData = (0, sanitize_1.sanitizeProfileInput)(value);
        const id = req.id;
        // fetch user info by id
        const user = yield user_1.default.findById(id);
        if (!user) {
            yield (0, createLog_1.default)(`User not found - ID: ${id}`);
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'User profile not found!'
            });
        }
        // Update user profile
        const updatedUser = yield user_1.default.findByIdAndUpdate(id, { $set: sanitizedData }, { new: true, runValidators: true });
        // Log Profile Update activity
        yield (0, createLog_1.default)(`Profile Updated for user ID: ${id}`);
        const logUpdate = new LogFile_1.default({
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            ActivityName: `Profile updated by user ID: ${id}`,
            AddedOn: date_1.default
        });
        yield logUpdate.save();
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Profile Updated Successfully!',
            data: sanitizedData
        });
    }
    catch (err) {
        yield (0, createLog_1.default)(`Error updating profile for user ${err.message}`);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'An error occurred while updating the profile: ' + err.message
        });
    }
});
exports.UpdateProfile = UpdateProfile;
