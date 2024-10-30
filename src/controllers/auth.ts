/*************************************************************************
 * Controller: User Authentication Controller
 * Description: Controller contains functions for all user authentictions.
 * Author: Damian Oguche
 * Date: 02-10-2024
 **************************************************************************/

import User from '../models/user';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { generateToken } from '../utils/jwt';
import LogFile from '../models/LogFile';
import EmailCode from '../utils/randomNumbers';
import createAppLog from '../utils/createLog';
import encryptPasswordWithBcrypt from '../utils/passwordEncrypt';
import currentDate from '../utils/date';
import { sanitizeSignUpInput } from '../utils/sanitize';
import { Request, Response } from 'express';
import { sendOTPEmail } from '../utils/emailService';

const otpStore = new Map(); // More scalable and secure in-memory store

// @POST: SignUp Route
export const SignUp = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get request body
    const sanitizedData = sanitizeSignUpInput(req.body);
    let { fullname, email, country, state, phone, password } = sanitizedData;

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email already registered'
      });
      return;
    }

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
    const otp: string = await EmailCode(6);
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // Store OTP and email in the session
    req.session.otpData = { hashedOTP, expiresAt: Date.now() + 60 * 60 * 1000 };
    req.session.email = email; // Store email in session
    // Store temp user In-Memory Store(Redis)
    req.session.tempUser = tempUser;

    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      else
        console.log('Session saved successfully with tempUser:', req.session);
    });

    console.log(req.session);

    // Optionally send OTP via email
    await sendOTPEmail({ email, otp });

    res.status(200).json({
      status: '00',
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (err: any) {
    createAppLog(JSON.stringify({ Error: err.message }));
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error: ' + err.message
    });
  }
};

// @POST: OTP Verification Route
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { otp } = req.body; // Get otp from request body
  const email = req.session.email; // Retrieve email from session

  console.log(otp);
  console.log(email);

  if (!otp || !email) {
    res.status(400).json({ message: 'OTP or email not found' });
    return;
  }

  try {
    // Fetch stored OTP from session
    const storedOTPData = req.session.otpData;

    if (!storedOTPData) {
      res.status(400).json({ message: 'OTP not found or expired' });
      return;
    }

    const { hashedOTP, expiresAt } = storedOTPData;

    // Check if OTP has expired
    if (Date.now() > expiresAt) {
      req.session.destroy((err: any) => {
        if (err) {
          createAppLog(JSON.stringify({ Error: err.message }));
        }
      }); // Clear session data
      res.status(400).json({ message: 'OTP expired' });
      return;
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, hashedOTP);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    // Fetch temp user data from otpStore
    // const tempUser = otpStore.get(`${email}_tempUser`);

    // Fetch tempUser data from session in-memory storage(Redis)
    const tempUser = req.session.tempUser;
    if (!tempUser) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    // Create the user in the database
    const newUser = new User(tempUser);
    await User.init(); // Ensure indexes are created before saving
    const user = await newUser.save();

    // Log the OTP verification activity
    const otpLog = new LogFile({
      email: tempUser.email,
      ActivityName: 'User Verified OTP',
      AddedOn: currentDate
    });
    await otpLog.save();

    // Log the new user creation activity
    const logEntry = new LogFile({
      fullname: tempUser.fullname,
      email: tempUser.email,
      ActivityName: `New user created with email: ${tempUser.email}`,
      AddedOn: currentDate
    });
    await logEntry.save();

    // Clear session and temp user data after successful verification
    req.session.destroy((err: any) => {
      if (err) {
        createAppLog(JSON.stringify({ Error: err.message }));
      }
      otpStore.delete(`${email}_tempUser`);
    }); // Clear session data

    // Generate JWT token with the user payload
    const token = generateToken({ email: user.email, id: user.id });

    await createAppLog(
      JSON.stringify('OTP verified successfully. User account created.')
    );
    res
      .cookie('token', token, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
        sameSite: 'none', // Prevent CSRF attacks if set to Strict
        maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
      })
      .json({
        message: 'OTP verified successfully. User account created.',
        status: 200
      });
  } catch (err: any) {
    createAppLog(JSON.stringify({ Error: err.message }));
    res.status(500).json({ message: 'Internal Server Error: ' + err.message });
  }
};

// @POST: User Login
export const Login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    await createAppLog('Login information' + JSON.stringify(email));

    if (!email) {
      await createAppLog('Email Required!');
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email Required!'
      });
      return;
    }

    if (!password) {
      await createAppLog('Password Required!');
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Password Required!'
      });
      return;
    }

    // Verify user login info(Find user by email)
    const user = await User.findOne({ email });

    if (!user) {
      await createAppLog('This email is not registered');
      res.status(401).json({
        status: 'E00',
        success: false,
        message: 'This email is not registered'
      });
      return;
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await createAppLog('Wrong password.');
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Wrong password.'
      });
      return;
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
    res
      .cookie('token', token, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
        sameSite: 'none', // Prevent CSRF attacks if set to Strict
        maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
      })
      .json({
        status: '200',
        success: true,
        message: 'Login successful!',
        email: user.email
      });
  } catch (err: any) {
    await createAppLog('Error: ' + err.message);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server error: ' + err.message
    });
  }
};

// User Logout
export const Logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies.token;

  if (!token) {
    await createAppLog(`No token found!`);
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;

  // Log the logout activity
  const log = new LogFile({
    email: decoded.email,
    ActivityName: `User ${decoded.email} Logged out of the system`,
    AddedOn: currentDate
  });

  await log.save();

  await createAppLog(`User ${decoded.email} logged out!`);
  res
    .clearCookie('token')
    .clearCookie('csrfToken')
    .json({ message: 'User Logged out' });
};
