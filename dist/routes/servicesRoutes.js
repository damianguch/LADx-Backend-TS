"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const csurf_1 = __importDefault(require("csurf"));
const express_1 = require("express");
const router = (0, express_1.Router)();
const { Login, SignUp, verifyOTP, Logout } = require('../controllers/auth');
const { UpdateProfilePhoto, upload } = require('../controllers/profilePhoto');
const { UpdateProfile, GetUserProfile } = require('../controllers/profile');
const { verifyTokenFromCookie } = require('../utils/jwt');
const { ForgotPassword, ResetPassword } = require('../controllers/forgotPassword');
const { GetProfilePhoto } = require('../controllers/getProfilePhoto');
const { UploadKYC, identityUpload } = require('../controllers/kyc');
const { TravelDetails, UpdateTravelDetails, travelUpload } = require('../controllers/traveller');
const { RequestDetails, requestItemsImageUpload, UpdateRequestDetails } = require('../controllers/sender');
const { uploadErrorHandler } = require('../utils/multerError');
const { validateUserSignup } = require('../validators/userValidtor');
// Middleware for CSRF protection
const csrfProtection = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV == 'production' ? true : false,
        sameSite: 'strict' // Prevent CSRF attacks
    }
});
// Apply CSRF protection globally but exclude specific routes
// router.use((req, res, next) => {
//   if (req.method === 'GET' || req.path === '/login' || req.path === '/logout') {
//     return next(); // Skip CSRF protection for these routes
//   }
//   csrfProtection(req, res, next); // Apply CSRF protection
// });
router.post('/signup', validateUserSignup, SignUp);
router.post('/verify-otp', verifyOTP);
//Use multer to handle multipart/form-data requests.
router.post('/login', upload.none(), Login);
router.post('/logout', Logout);
router.post('/forgot-password', ForgotPassword);
router.put('/reset-password', ResetPassword);
// Handling Image Upload in Request
router.put('/users/profilePhoto', verifyTokenFromCookie, upload.single('profilePic'), uploadErrorHandler, UpdateProfilePhoto);
// Get User profile
router.get('/users/profile', verifyTokenFromCookie, GetUserProfile);
// Get Profile Photo
router.get('/users/profilePhoto', verifyTokenFromCookie, GetProfilePhoto);
// Use multer to handle multipart/form-data requests.
router.put('/users/profile', verifyTokenFromCookie, upload.none(), UpdateProfile);
// KYC upload route
router.post('/kyc', verifyTokenFromCookie, identityUpload.single('identity'), uploadErrorHandler, UploadKYC);
// Create traveller's details route
router.post('/users/travel-details', verifyTokenFromCookie, TravelDetails);
// Update traveller's request details route
router.put('/users/travel-details', verifyTokenFromCookie, UpdateTravelDetails);
// Create senders request details route
router.post('/users/request-details', verifyTokenFromCookie, requestItemsImageUpload, // Handles multiple images
uploadErrorHandler, RequestDetails);
// Update sender's request details route
router.put('/users/request-details', verifyTokenFromCookie, requestItemsImageUpload, UpdateRequestDetails);
exports.default = router;
