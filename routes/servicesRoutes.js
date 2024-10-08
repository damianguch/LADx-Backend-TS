const express = require('express');
const router = express.Router();

const { Login, requestOTP, verifyOTP } = require('../controllers/auth');

// router.post('/signup', SignUp);
router.post('/signup/request-otp', requestOTP);
router.post('/signup/verify-otp', verifyOTP);
router.post('/login', Login);

module.exports = router;
