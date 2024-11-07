/*************************************************************************
 * Controller: User Authentication Controller
 * Description: Controller contains functions for all user authentictions.
 * Author: Damian Oguche
 * Date: 02-10-2024
 **************************************************************************/

import User, { IUser } from '../models/user';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { generateToken } from '../utils/jwt';
import LogFile from '../models/LogFile';
import createAppLog from '../utils/createLog';
import encryptPasswordWithBcrypt from '../utils/passwordEncrypt';
import currentDate from '../utils/date';
import { sanitizeSignUpInput } from '../utils/sanitize';
import { Request, Response } from 'express';
import { sendOTPEmail } from '../utils/emailService';
import { loginSchema } from '../schema/user.schema';
import { z } from 'zod';
import logger from '../logger/logger';
import { verifyOTPSchema } from '../schema/otp.schema';
import generateOTP from '../utils/randomNumbers';

// Custom error response interface
interface ErrorResponse {
  status: string;
  success: boolean;
  message: string;
  errors?: z.ZodError['errors'];
}

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
    const otp: string = await generateOTP(6);
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    console.log(otp);

    // Store OTP and email in the session
    req.session.otpData = { hashedOTP, expiresAt: Date.now() + 60 * 60 * 1000 };
    req.session.email = email; // Store email in session

    // Store temp user In-Memory Store(Redis)
    req.session.tempUser = tempUser;

    req.session.save((err) => {
      if (err) {
        // Info level logging
        logger.error(`Session save error`, {
          timestamp: new Date().toISOString()
        });
      }

      // Info level logging
      else
        logger.info('Session saved successfully', {
          timestamp: new Date().toISOString()
        });
    });

    // Send OTP via email
    const result = await sendOTPEmail({ email, otp });

    logger.info(`${result.message} - ${email}`, {
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      status: '00',
      success: true,
      message: result.message
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
  // Validate the request body using Zod
  const { otp } = verifyOTPSchema.parse(req.body);
  const email = req.session.email; // Retrieve email from session

  console.log(otp);
  console.log(email);

  if (!otp || !email) {
    res.status(400).json({
      otp: otp,
      email: email,
      message: 'OTP or email not found'
    });
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

    // Verify OTP (Compare otp from req.body and session)
    const isMatch = await bcrypt.compare(otp, hashedOTP);
    if (!isMatch) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid OTP'
      });
      return;
    }

    // Fetch tempUser data from session storage(Redis)
    const tempUser = req.session.tempUser;
    if (!tempUser) {
      res.status(400).json({ message: 'User not found' });
      return;
    }

    // Create the user in the database
    const newUser = new User(tempUser);
    await User.init(); // Ensure indexes are created before saving
    const user: IUser = await newUser.save();

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
    });

    // Generate JWT token with the user payload
    const token = generateToken({ email: user.email, id: user.id });

    await createAppLog(
      JSON.stringify('OTP verified successfully. User account created.')
    );

    // Info level logging
    logger.info(`OTP verified, User account created. - ${email}`, {
      timestamp: new Date().toISOString()
    });

    res
      .cookie('token', token, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
        sameSite: 'none', // Prevent CSRF attacks if set to Strict
        maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
      })
      .json({
        status: '00',
        success: true,
        message: 'OTP verified successfully. User account created.'
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

// @POST Resend OTP
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    // Retrieve the email from the session
    const email = req.session.email;

    if (!email) {
      logger.warn('No email found in session', {
        timestamp: new Date().toISOString()
      });
      res.status(400).json({
        status: 'EOO',
        success: false,
        error: 'Email is required for resending OTP.'
      });

      return;
    }

    // Generate a new OTP(previous one expired or was not received)
    const otp: string = await generateOTP(6);
    logger.info(`Generated new OTP for ${email}`);

    console.log(otp);

    // Send OTP to user's email
    await sendOTPEmail({ email, otp });
    logger.info(`OTP resent successfully to email: ${email}`);

    // Respond to the client
    res.status(200).json({
      status: '00',
      success: true,
      message: 'OTP resent successfully.'
    });
  } catch (err: any) {
    // Log and respond to any errors
    logger.error(`Error resending OTP: ${err.message}`);
    res.status(500).json({
      status: 'E00',
      succes: false,
      message: `Failed to resend OTP. Please try again later: ${err.message}`
    });
  }
};

// @POST: User Login
export const Login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body using Zod
    const validationResult = loginSchema.safeParse(req.body);

    // If validation fails, return detailed error response
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        status: 'E00',
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      };

      await createAppLog(
        `Login validation error: ${JSON.stringify(errorResponse)}`
      );
      res.status(400).json(errorResponse);
      return;
    }

    const { email, password } = validationResult.data;

    // Log login attempt
    await createAppLog(`Login attempt for email: ${email}`);

    // Info level logging
    logger.info(`Login attempt for email: ${email}`, {
      timestamp: new Date().toISOString()
    });

    // Find user by email with select to explicitly choose fields
    const user: IUser = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      await createAppLog(`Login failed: Email not registered - ${email}`);
      // Errorlevel logging
      logger.error(`Login failed: Email not registered - ${email}`, {
        timestamp: new Date().toISOString()
      });
      res.status(401).json({
        status: 'E00',
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await createAppLog(`Login failed: Incorrect password - ${email}`);
      res.status(401).json({
        status: 'E00',
        success: false,
        message: 'Wrong password.'
      });
      return;
    }

    // Generate JWT token with the user payload
    const token = generateToken({
      email: user.email,
      id: user.id
    });

    // Log the login activity
    await createAppLog(`User logged in successfully: ${email}`);
    const logEntry = new LogFile({
      email: user.email,
      ActivityName: 'User Login',
      AddedOn: currentDate
    });

    await logEntry.save();

    // Info level logging
    logger.info(`Login successful!: ${email}`, {
      timestamp: new Date().toISOString()
    });

    // Set secure, HTTP-only cookie
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
        email: user.email,
        role: user.role
      });
  } catch (err: any) {
    await createAppLog(`Login Error:  ${err.message}`);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: `Internal Server error: ${err.message}`
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
  const logExit = new LogFile({
    email: decoded.email,
    ActivityName: `User ${decoded.email} Logged out of the system`,
    AddedOn: currentDate
  });

  await logExit.save();

  await createAppLog(`User ${decoded.email} logged out!`);
  res
    .clearCookie('token')
    .clearCookie('csrfToken')
    .json({ message: 'User Logged out' });
};
