/*************************************************************************
 * Controller: User Authentication Controller
 * Description: Controller contains functions for all user authentictions.
 * Author: Damian Oguche
 * Date: 02-10-2024
 **************************************************************************/

const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/jwt');
const LogFile = require('../models/LogFile');
const { EmailCode } = require('../utils/randomNumbers');
const { createAppLog } = require('../utils/createLog');
const { encryptPasswordWithBcrypt } = require('../utils/passwordEncrypt');
const { sendOTPEmail } = require('../utils/emailService');
const { isEmail, escape } = require('validator');
const { currentDate } = require('../utils/date');
const crypto = require('crypto');

let otpStore = {}; // In-memory storage of OTPs
let emailStore = {}; // Im-memory storage of email

// SignUp-Request OTP Route
const SignUp = async (req, res) => {
  // get request body
  const { fullname, email, country, state, phone, password, confirm_password } =
    req.body;

  // data validation
  if (!fullname) {
    await createAppLog(JSON.stringify('Full name is required')); // log error
    return res.status(400).json({
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

  // Validate email format
  if (!isEmail(email)) {
    return res.status(400).json({
      status: 'E00',
      success: false,
      message: 'Invalid email format'
    });
  } else {
    emailStore.email = email;
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

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      await createAppLog(JSON.stringify('Email already registered'));
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email already registered'
      });
    }

    const otp = await EmailCode(6); // generate 6 digit code

    const hashedOTP = await bcrypt.hash(otp, 10); // Store hashed OTP for security
    otpStore.email = hashedOTP; // Save OTP for verification later

    const encrypt_password = await encryptPasswordWithBcrypt(password);

    userInfo = {
      fullname,
      email,
      phone,
      country,
      state,
      password: encrypt_password,
      email_verification_code: hashedOTP,
      is_email_verified: 0,
      roles: 0
    };

    // Save the user to the database
    const newUser = new User(userInfo);
    await User.init();
    await newUser.save();

    const result = await sendOTPEmail(email, otp);
    await createAppLog(JSON.stringify('User created successfully'));

    // Log the Sign Up activity
    const log = new LogFile({
      fullname: newUser.fullname,
      email: newUser.email,
      ActivityName: 'New user created with credential: ' + newUser.email,
      AddedOn: currentDate
    });

    await log.save();

    return res.status(201).json({
      OTP: result,
      message: 'User created successfully'
    });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res.status(500).json({ Error: error.message });
  }
};

// OTP Verification route
const verifyOTP = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' });
  }

  try {
    const storedOTP = otpStore['email'];
    const storedEmail = emailStore['email'];

    const user = await User.findOne({ email: storedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!storedOTP) {
      return res.status(400).json({ message: 'OTP not found ' });
    }

    const isMatch = await bcrypt.compare(otp, storedOTP);
    if (isMatch) {
      user.is_email_verified = 1;
      await user.save();

      // Remove OTP/email after successful verification
      delete otpStore['email'];
      delete emailStore['email'];

      // log data
      await createAppLog(JSON.stringify('OTP verified successfully!'));

      // Log the verification activity
      const log = new LogFile({
        email: user.email,
        ActivityName: 'User Verified OTP',
        AddedOn: currentDate
      });

      await log.save();

      return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
      await createAppLog(JSON.stringify('Invalid OTP'));
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    createAppLog(JSON.stringify('OTP Verification Error!'));
    return res.status(500).json({ message: 'Internal Server Error!' });
  }
};

// User Login
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    await createAppLog('Login information' + JSON.stringify(email));

    if (!email) {
      await createAppLog('Email Required!');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email Required!'
      });
    }

    if (!password) {
      await createAppLog('Password Required!');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Password Required!'
      });
    }

    // Verify user login info(Find user by email)
    const user = await User.findOne({ email });

    if (!user) {
      await createAppLog('This email is not registered');
      return res.status(401).json({
        status: 'E00',
        success: false,
        message: 'This email is not registered'
      });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await createAppLog('Wrong password.');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Wrong password.'
      });
    }

    // Generate JWT token with the user payload
    try {
      token = generateToken({ email: user.email, id: user.id });
    } catch (err) {
      await createAppLog('Error generating token: ' + err.message);
      return res.status(500).json({
        status: 'E00',
        success: false,
        message: 'Failed to generate token.'
      });
    }

    await createAppLog('User logged in successfully');

    // Log the login activity
    const log = new LogFile({
      email: user.email,
      ActivityName: 'Logged into the system with credential: ' + user.email,
      AddedOn: currentDate
    });

    await log.save();

    // Store token in HTTP-only, secure cookie
    return res
      .cookie('token', token, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
        sameSite: 'Strict', // Prevent CSRF attacks
        maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
      })
      .json({
        status: '200',
        success: true,
        message: 'Login successful!',
        // token: token,
        email: user.email
      });
  } catch (err) {
    await createAppLog('Error: ' + err.message);
    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Login not successful! Something went wrong.'
    });
  }
};

// User Logout
const Logout = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    await createAppLog(`No token found!`);
    return res.status(401).json({ message: 'No token provided' });
  }

  const SECRET_KEY = process.env.JWT_SECRET_KEY;
  const decoded = jwt.verify(token, SECRET_KEY);

  // Log the logout activity
  const log = new LogFile({
    email: decoded.email,
    ActivityName: `User ${decoded.email} Logged out of the system`,
    AddedOn: currentDate
  });

  await log.save();

  await createAppLog(`User ${decoded.email} logged out!`);
  return res
    .clearCookie('token')
    .clearCookie('csrfToken')
    .json({ message: 'User Logged out' });
};

module.exports = {
  SignUp,
  verifyOTP,
  Login,
  Logout
};
