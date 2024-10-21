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
const otpStore = new Map(); // More scalable and secure in-memory store

// SignUp - Request OTP Route
const SignUp = async (req, res) => {
  try {
    // Get request body
    let { fullname, email, country, state, phone, password, confirm_password } =
      req.body;

    // Escape and sanitize inputs
    fullname = escape(fullname);
    email = escape(email);
    country = escape(country);
    state = escape(state);
    phone = escape(phone);
    password = escape(password);
    confirm_password = escape(confirm_password);

    // Input validation
    if (!fullname)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Full name is required' });
    if (!email || !isEmail(email))
      return res
        .status(400)
        .json({ status: 'E00', message: 'Invalid email format' });
    if (!phone)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Phone number is required' });
    if (!country)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Country is required' });
    if (!state)
      return res
        .status(400)
        .json({ status: 'E00', message: 'State is required' });
    if (!password)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Password is required' });
    if (password !== confirm_password)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Passwords do not match' });

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ status: 'E00', message: 'Email already registered' });

    // Generate OTP and hash it
    const otp = await EmailCode(6);
    console.log(otp);
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // Store OTP in a map with an expiration time
    // otpStore.set(email, { hashedOTP, expiresAt: Date.now() + 60 * 60 * 1000 });

    // Store OTP and email in the session
    req.session.otpData = { hashedOTP, expiresAt: Date.now() + 60 * 60 * 1000 };
    req.session.email = email; // Store email in session

    // Hash password for later use (only after OTP verification)
    const encryptedPassword = await encryptPasswordWithBcrypt(password);

    // Save user info temporarily (could be done in Redis or DB for better scalability)
    const tempUser = {
      fullname,
      email,
      phone,
      country,
      state,
      password: encryptedPassword
    };

    // Optionally send OTP via email
    // await sendOTPEmail(email, otp);

    // Store temp user in memory
    // otpStore.set(`${email}_tempUser`, tempUser);
    req.session.tempUser = tempUser;

    return res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    return res
      .status(500)
      .json({ status: 'E500', message: 'Internal Server Error' });
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
    const tempUser = req.session.tempUser;
    if (!tempUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Create the user in the database
    const newUser = new User(tempUser);
    await User.init(); // Ensure indexes are created before saving
    await newUser.save();

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

    await createAppLog(
      JSON.stringify('OTP verified, User created successfully')
    );
    return res
      .status(201)
      .json({ message: 'OTP verified, User created successfully' });
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
