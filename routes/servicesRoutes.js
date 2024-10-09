const express = require('express');
const router = express.Router();

const { Login, SignUp, verifyOTP } = require('../controllers/auth');

// router.post('/signup', SignUp);
router.post('/signup', SignUp);
router.post('/verify-otp', verifyOTP);
router.post('/login', Login);

module.exports = router;
