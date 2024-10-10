const express = require('express');
const csrf = require('csurf');
const router = express.Router();

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

const { Login, SignUp, verifyOTP, Logout } = require('../controllers/auth');
const { UpdateProfile } = require('../controllers/userProfile');

// router.post('/signup', SignUp);
router.post('/signup', SignUp);
router.post('/verify-otp', verifyOTP);
router.put('/users/:id', UpdateProfile);
router.post('/login', Login);
router.post('/logout', Logout);

module.exports = router;
