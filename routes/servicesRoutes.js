const express = require('express');
const csrf = require('csurf');
const router = express.Router();
const { Login, SignUp, verifyOTP, Logout } = require('../controllers/auth');
const { UpdateProfilePhoto, upload } = require('../controllers/profilePic');
const { UpdateProfile } = require('../controllers/profile');

// Middleware for CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production' ? true : false,
    sameSite: 'Strict' // Prevent CSRF attacks
  }
});

// Apply CSRF protection globally but exclude specific routes
// router.use((req, res, next) => {
//   if (req.method === 'GET' || req.path === '/login' || req.path === '/logout') {
//     return next(); // Skip CSRF protection for these routes
//   }

//   csrfProtection(req, res, next); // Apply CSRF protection
// });

router.post('/signup', SignUp);
router.post('/verify-otp', verifyOTP);
router.put('/profilePic/:id', upload.single('profilePic'), UpdateProfilePhoto);
router.put('/profile/:id', upload.none(), UpdateProfile);
router.post('/login', Login);
router.post('/logout', Logout);

module.exports = router;
