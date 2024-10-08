const express = require('express');
const router = express.Router();

const { SignUp, Login } = require('../controllers/auth');
const { requestOTP, verifyOTP } = require('../utils/emailService');

router.post('/signup', SignUp);
router.post('/login', Login);
router.post('/signup/request-otp', requestOTP);
router.post('/signup/verify-otp', verifyOTP);

module.exports = router;
