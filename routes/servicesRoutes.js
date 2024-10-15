const express = require('express');
const csrf = require('csurf');
const router = express.Router();
const { Login, SignUp, verifyOTP, Logout } = require('../controllers/auth');
const { UpdateProfilePhoto, upload } = require('../controllers/profilePhoto');
const { UpdateProfile } = require('../controllers/profile');
const { authenticateJWT } = require('../utils/jwt');

// Middleware for CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production' ? true : false,
    sameSite: 'Strict' // Prevent CSRF attacks
  }
});

// Apply CSRF protection globally but exclude specific routes
router.use((req, res, next) => {
  if (req.method === 'GET' || req.path === '/login' || req.path === '/logout') {
    return next(); // Skip CSRF protection for these routes
  }

  csrfProtection(req, res, next); // Apply CSRF protection
});

router.post('/signup', SignUp);
router.post('/verify-otp', verifyOTP);

//Handling Image Upload in Request
router.put(
  '/users/:id/profilePic',
  authenticateJWT,
  upload.single('profilePic'),
  UpdateProfilePhoto
);

router.put('/users/:id/profile', authenticateJWT, upload.none(), UpdateProfile);

//Use multer to handle multipart/form-data requests.
router.post('/login', upload.none(), Login);
router.post('/logout', Logout);

module.exports = router;
