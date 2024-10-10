const express = require('express');
const router = express.Router();

const { Login, SignUp, verifyOTP, Logout } = require('../controllers/auth');
const { UpdateProfile } = require('../controllers/userProfile');

// router.post('/signup', SignUp);
router.post('/signup', SignUp);
router.post('/verify-otp', verifyOTP);
router.put('/users/:id', UpdateProfile);
router.post('/login', Login);
router.post('/logout', Logout);

module.exports = router;
