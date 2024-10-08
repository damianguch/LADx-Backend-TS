const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { EmailCode } = require('../utils/randomNumbers');
const { createAppLog } = require('../utils/createLog');
const User = require('../models/user');
const { encryptPasswordWithBcrypt } = require('../utils/passwordEncrypt');
const { generateToken } = require('./jwt');

let otpStore = {}; // In-memory storage of OTPs

let userInfo = {};

// Send OTP via Email
const sendOTPEmail = (email, otp) => {
  let transporter = nodemailer.createTransport({
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    secure: false
  });

  const mailOptions = {
    from: 'no-reply@ladX.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  return transporter.sendMail(mailOptions);
};

// Request OTP On Signup
const requestOTP = async (req, res) => {
  const otp = await EmailCode(6); // generate 6 digit code
  const hashedOTP = await bcrypt.hash(otp, 10); // Store hashed OTP for security
  otpStore.email = hashedOTP; // Save OTP for verification later

  try {
    // get request body
    const {
      fullname,
      email,
      country,
      state,
      phone,
      password,
      confirm_password
    } = req.body;

    // data validation
    if (!fullname) {
      await createAppLog(JSON.stringify('Full name is required')); // log error
      return res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Full name is required'
      });
    }

    if (!email) {
      await createAppLog(JSON.stringify('Email is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email is required'
      });
    }

    if (!phone) {
      await createAppLog(JSON.stringify('Phone number is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Phone number is required'
      });
    }

    if (!country) {
      await createAppLog(JSON.stringify('Country is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Country is required'
      });
    }

    if (!state) {
      await createAppLog(JSON.stringify('State is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'State is required'
      });
    }

    if (!password) {
      await createAppLog(JSON.stringify('Password is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Password is required'
      });
    }

    if (!confirm_password) {
      await createAppLog(JSON.stringify('Confirm password is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Confirm password is required'
      });
    }

    if (password != confirm_password) {
      await createAppLog(JSON.stringify('Password does not match!')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Password does not match!'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email already registered'
      });
    }

    userInfo = {
      fullname,
      email,
      phone,
      country,
      state,
      password,
      confirm_password
    };

    await sendOTPEmail(email, otp);
    return res
      .status(200)
      .json({ message: 'OTP sent successfully', otp, userInfo });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending OTP', error });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' });
  }

  const storedOTP = otpStore['email'];

  if (!storedOTP) {
    return res.status(400).json({ message: 'OTP not found for this email' });
  }

  const isMatch = await bcrypt.compare(otp, storedOTP);

  if (isMatch) {
    const token = generateToken({ email: userInfo.email });

    const encrypt_password = await encryptPasswordWithBcrypt(userInfo.password);

    const userData = {
      fullname: userInfo.fullname,
      email: userInfo.email,
      phone: userInfo.phone,
      country: userInfo.country,
      state: userInfo.state,
      password: encrypt_password,
      confirm_password: encrypt_password,
      password_reset_link: '',
      email_verification_code: storedOTP,
      is_email_verified: 0,
      roles: 0
    };

    // Save the user to the database
    const newUser = new User(userData);
    await User.init();
    await newUser.save();

    delete otpStore[email]; // Remove OTP after successful verification

    // log data
    await createAppLog(JSON.stringify(userData));

    return res
      .status(200)
      .json({ message: 'OTP verified successfully', token });
  } else {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
};

module.exports = { requestOTP, verifyOTP };
