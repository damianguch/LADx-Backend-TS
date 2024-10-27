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
const { currentDate } = require('../utils/date');
const { sanitizeInput } = require('../utils/sanitize');
const otpStore = new Map(); // More scalable and secure in-memory store

// POST: SignUp
const SignUp = async (req, res, next) => {
  try {
    // Get request body
    const sanitizedData = sanitizeInput(req.body);
    let { fullname, email, country, state, phone, password } = sanitizedData;

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email already registered'
      });

    // Hash password for later use (only after OTP verification)
    const encryptedPassword = await encryptPasswordWithBcrypt(password);

    // Save user info temporarily
    const tempUser = {
      fullname,
      email,
      phone,
      country,
      state,
      password: encryptedPassword
    };

    // Generate OTP and hash it
    const otp = await EmailCode(6);
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // Store OTP and email in the session
    req.session.otpData = { hashedOTP, expiresAt: Date.now() + 60 * 60 * 1000 };
    req.session.email = email; // Store email in session

    // Store temp user In-Memory Store(Redis)
    req.session.tempUser = tempUser;

    // Optionally send OTP via email
    // await sendOTPEmail(email, otp);

    return res.status(200).json({
      status: '00',
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (err) {
    createAppLog(JSON.stringify({ Error: err.message }));
    next(err);

    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + err.message
    });
  }
};

// OTP Verification Route
const verifyOTP = async (req, res) => {
  const { otp } = req.body; // Get otp from request body
  const email = req.session.email; // Retrieve email from session

  if (!otp || !email) {
    return res.status(400).json({ message: 'OTP or email not found' });
  }

  try {
    // Fetch stored OTP from session
    const storedOTPData = req.session.otpData;

    if (!storedOTPData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    const { hashedOTP, expiresAt } = storedOTPData;

    // Check if OTP has expired
    if (Date.now() > expiresAt) {
      req.session.destroy(); // Clear session data
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, hashedOTP);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Fetch temp user data from otpStore
    // const tempUser = otpStore.get(`${email}_tempUser`);

    // Fetch tempUser data from session in-memory storage(Redis)
    const tempUser = req.session.tempUser;
    if (!tempUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Create the user in the database
    const newUser = new User(tempUser);
    await User.init(); // Ensure indexes are created before saving
    const user = await newUser.save();

    // Log the OTP verification activity
    const otpVerificationLog = new LogFile({
      email: tempUser.email,
      ActivityName: 'User Verified OTP',
      AddedOn: currentDate
    });
    await otpVerificationLog.save();

    // Log the new user creation activity
    const userCreationLog = new LogFile({
      fullname: tempUser.fullname,
      email: tempUser.email,
      ActivityName: `New user created with email: ${tempUser.email}`,
      AddedOn: currentDate
    });
    await userCreationLog.save();

    // Clear session and temp user data after successful verification
    req.session.destroy(); // Clear session data
    otpStore.delete(`${email}_tempUser`);

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

    await createAppLog(
      JSON.stringify('OTP verified successfully. User account created.')
    );
    return res
      .cookie('token', token, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
        sameSite: 'None', // Prevent CSRF attacks if set to Strict
        maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
      })
      .json({
        message: 'OTP verified successfully. User account created.',
        status: 200
      });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res.status(500).json({ message: 'Internal Server Error' });
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
    const token = generateToken({ email: user.email, id: user.id });

    // Log the login activity
    await createAppLog('User logged in successfully');
    const log = new LogFile({
      email: user.email,
      ActivityName: 'Logged in with credential: ' + user.email,
      AddedOn: currentDate
    });

    await log.save();

    // Store token in HTTP-only, secure cookie
    return res
      .cookie('token', token, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
        sameSite: 'None', // Prevent CSRF attacks if set to Strict
        maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
      })
      .json({
        status: '200',
        success: true,
        message: 'Login successful!',
        email: user.email
      });
  } catch (err) {
    await createAppLog('Error: ' + err.message);
    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server error: ' + err.message
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
