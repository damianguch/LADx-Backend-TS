import csrf from 'csurf';
import { Router } from 'express';
import { validateKYC } from '../controllers/kyc';
const router = Router();

import { Login, SignUp, verifyOTP, Logout } from '../controllers/auth';
import { UpdateProfilePhoto, upload } from '../controllers/profilePhoto';
import { UpdateProfile, GetUserProfile } from '../controllers/profile';
import { verifyTokenFromCookie } from '../utils/jwt';
import { ForgotPassword, ResetPassword } from '../controllers/forgotPassword';
import { GetProfilePhoto } from '../controllers/getProfilePhoto';
import { UploadKYC, identityUpload } from '../controllers/kyc';
import { TravelDetails, UpdateTravelDetails } from '../controllers/traveller';
import {
  RequestDetails,
  requestItemsImageUpload,
  UpdateRequestDetails
} from '../controllers/sender';
import { uploadErrorHandler } from '../utils/multerError';
import { validateUserSignup } from '../validators/userValidtor';

// Middleware for CSRF protection
const csrfProtection = csrf({
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
router.put(
  '/users/profilePhoto',
  verifyTokenFromCookie,
  upload.single('profilePic'),
  uploadErrorHandler,
  UpdateProfilePhoto
);

// Get User profile
router.get('/users/profile', verifyTokenFromCookie, GetUserProfile);

// Get Profile Photo
router.get('/users/profilePhoto', verifyTokenFromCookie, GetProfilePhoto);

// Use multer to handle multipart/form-data requests.
router.put(
  '/users/profile',
  verifyTokenFromCookie,
  upload.none(),
  UpdateProfile
);

// KYC upload route
router.post(
  '/kyc',
  verifyTokenFromCookie,
  identityUpload.single('identity'),
  uploadErrorHandler,
  validateKYC,
  UploadKYC
);

// Create traveller's details route
router.post('/users/travel-details', verifyTokenFromCookie, TravelDetails);

// Update traveller's request details route
router.put('/users/travel-details', verifyTokenFromCookie, UpdateTravelDetails);

// Create senders request details route
router.post(
  '/users/request-details',
  verifyTokenFromCookie,
  requestItemsImageUpload, // Handles multiple images
  uploadErrorHandler,
  RequestDetails
);

// Update sender's request details route
router.put(
  '/users/request-details',
  verifyTokenFromCookie,
  requestItemsImageUpload,
  UpdateRequestDetails
);

export default router;