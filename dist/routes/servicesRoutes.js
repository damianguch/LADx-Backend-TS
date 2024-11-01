"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const csurf_1 = __importDefault(require("csurf"));
const express_1 = require("express");
const kyc_1 = require("../controllers/kyc");
const auth_1 = require("../controllers/auth");
const profilePhoto_1 = require("../controllers/profilePhoto");
const profile_1 = require("../controllers/profile");
const jwt_1 = require("../utils/jwt");
const forgotPassword_1 = require("../controllers/forgotPassword");
const getProfilePhoto_1 = require("../controllers/getProfilePhoto");
const kyc_2 = require("../controllers/kyc");
const traveler_1 = require("../controllers/traveler");
const sender_1 = require("../controllers/sender");
const multerError_1 = require("../utils/multerError");
const userValidtor_1 = require("../validators/userValidtor");
const router = (0, express_1.Router)();
// Middleware for CSRF protection
const csrfProtection = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV == 'production' ? true : false,
        sameSite: 'strict' // Prevent CSRF attacks
    }
});
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
router.post('/signup', userValidtor_1.validateUserSignup, auth_1.SignUp);
router.post('/verify-otp', auth_1.verifyOTP);
//Use multer to handle multipart/form-data requests.
router.post('/login', profilePhoto_1.upload.none(), auth_1.Login);
router.post('/logout', auth_1.Logout);
router.post('/forgot-password', forgotPassword_1.ForgotPassword);
router.put('/reset-password', forgotPassword_1.ResetPassword);
// Handling Image Upload in Request
router.put('/users/profilePhoto', jwt_1.verifyTokenFromCookie, profilePhoto_1.upload.single('profilePic'), multerError_1.uploadErrorHandler, profilePhoto_1.UpdateProfilePhoto);
// Get User profile
router.get('/users/profile', jwt_1.verifyTokenFromCookie, profile_1.GetUserProfile);
// Get Profile Photo
router.get('/users/profilePhoto', jwt_1.verifyTokenFromCookie, getProfilePhoto_1.GetProfilePhoto);
// Use multer to handle multipart/form-data requests.
router.put('/users/profile', jwt_1.verifyTokenFromCookie, profilePhoto_1.upload.none(), profile_1.UpdateProfile);
// KYC upload route
router.post('/kyc', jwt_1.verifyTokenFromCookie, kyc_2.identityUpload.single('identity'), multerError_1.uploadErrorHandler, kyc_1.validateKYC, kyc_2.UploadKYC);
// Create traveller's details route
router.post('/users/travel-details', jwt_1.verifyTokenFromCookie, traveler_1.TravelDetails);
// Update traveller's request details route
router.put('/users/travel-details', jwt_1.verifyTokenFromCookie, traveler_1.UpdateTravelDetails);
// Create senders request details route
router.post('/users/request-details', jwt_1.verifyTokenFromCookie, sender_1.requestItemsImageUpload, // Handles multiple images
multerError_1.uploadErrorHandler, sender_1.RequestDetails);
// Update sender's request details route
router.put('/users/request-details', jwt_1.verifyTokenFromCookie, sender_1.requestItemsImageUpload, sender_1.UpdateRequestDetails);
exports.default = router;
