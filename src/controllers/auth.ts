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

    // Generate OTP and hash it
    const otp: string = await generateOTP(6);
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // Store OTP and email in the session with expiration
    req.session.otpData = { hashedOTP, expiresAt: Date.now() + 60 * 60 * 1000 };
    req.session.email = email; // Store email in session
    req.session.tempUser = { fullname, email, phone, country, state, password: encryptedPassword };

    req.session.save((err) => {
      if (err) {
        logger.error('Session save error', { timestamp: new Date().toISOString() });
      }
    });

    // Send OTP via email
    const result = await sendOTPEmail({ email, otp });

    logger.info(`${result.message} - ${email}`, { timestamp: new Date().toISOString() });

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
  try {
    const { otp } = verifyOTPSchema.parse(req.body);
    const email = req.session.email;

    if (!otp || !email) {
      logger.warn('No email or OTP found in session', { timestamp: new Date().toISOString() });
      res.status(400).json({
        status: 'E01',
        success: false,
        message: 'OTP or email not found in session'
      });
      return;
    }

    const storedOTPData = req.session.otpData;

    if (!storedOTPData || Date.now() > storedOTPData.expiresAt) {
      req.session.destroy((err: any) => {
        if (err) createAppLog(JSON.stringify({ Error: err.message }));
      });
      res.status(400).json({ message: 'OTP expired' });
      return;
    }

    const isMatch = await bcrypt.compare(otp, storedOTPData.hashedOTP);
    if (!isMatch) {
      res.status(400).json({ status: 'E03', success: false, message: 'Invalid OTP' });
      return;
    }

    // Create the user in the database
    const tempUser = req.session.tempUser;
    if (!tempUser) {
      res.status(400).json({ message: 'Temporary user data not found' });
      return;
    }

    const newUser = new User(tempUser);
    await User.init();
    const user: IUser = await newUser.save();

    const token = generateToken({ email: user.email, id: user.id });

    // Clear session and log activity
    req.session.destroy((err: any) => {
      if (err) createAppLog(JSON.stringify({ Error: err.message }));
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000
    }).json({
      status: '00',
      success: true,
      message: 'OTP verified successfully. User account created.'
    });
  } catch (err: any) {
    createAppLog(JSON.stringify({ Error: err.message }));
    res.status(500).json({ status: 'E00', success: false, message: 'Internal Server Error: ' + err.message });
  }
};

// @POST: User Login
export const Login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        status: 'E00',
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { email, password } = validationResult.data;
    const user: IUser = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ status: 'E00', success: false, message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ email: user.email, id: user.id });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000
    }).json({
      status: '200',
      success: true,
      message: 'Login successful!',
      email: user.email,
      role: user.role
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'E00',
      success: false,
      message: `Internal Server error: ${err.message}`
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
