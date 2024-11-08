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

interface ErrorResponse {
  status: string;
  success: boolean;
  message: string;
  errors?: z.ZodError['errors'];
}

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

    // Generate and hash OTP
    const otp = await generateOTP(6);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    const registrationData = {
      fullname,
      email,
      country,
      state,
      phone,
      password: await encryptPasswordWithBcrypt(password),
      otp: hashedOTP,
      otpExpiry
    };

    // Store registration data and OTP in session
    req.session.registrationData = registrationData;

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
    await sendOTPEmail({ email, otp });

    logger.info(`OTP sent to ${email}`);

    res.status(200).json({
      status: '00',
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error: any) {
    logger.error('SignUp error:', error);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate the request body using Zod
    const { otp } = verifyOTPSchema.parse(req.body);

    // Get session data
    const registrationData = req.session.registrationData;

    // Check if session exists with registration data
    if (!registrationData) {
      logger.warn('No registration data found in session');
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Registration session expired'
      });
      return;
    }

    // Check OTP expiry
    if (Date.now() > registrationData.otpExpiry) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'OTP has expired'
      });
      return;
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, registrationData.otp);

    if (!isValidOTP) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid OTP'
      });
      return;
    }

    // Create user since OTP is valid
    const newUser = new User({
      fullname: registrationData.fullname,
      email: registrationData.email,
      password: registrationData.password,
      country: registrationData.country,
      state: registrationData.state,
      phone: registrationData.phone,
      is_email_verified: 1
    });

    await newUser.save();

    await createAppLog(
      JSON.stringify('OTP verified successfully. User account created.')
    );

    // Generate JWT token
    const token = generateToken({ email: newUser.email, id: newUser._id });

    // Clear session after successful verification
    req.session.destroy((err) => {
      if (err) logger.error('Session destruction error:', err);
    });

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000
      })
      .status(200)
      .json({
        status: '00',
        success: true,
        message: 'OTP verified successfully. User account created.'
      });
  } catch (error: any) {
    logger.error('OTP verification error:', error);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if session exists
    if (!req.session.registrationData) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Registration session expired'
      });
      return;
    }

    const { email } = req.session.registrationData;

    // Generate new OTP
    const otp = await generateOTP(6);
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    // Update session with new OTP
    req.session.registrationData = {
      ...req.session.registrationData,
      otp: hashedOTP,
      otpExpiry: Date.now() + 10 * 60 * 1000
    };

    // Save session explicitly
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });

    // Send new OTP
    await sendOTPEmail({ email, otp });

    res.status(200).json({
      status: '00',
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error: any) {
    logger.error('Resend OTP error:', error);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export const Login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid input',
        errors: validationResult.error.errors
      });
      return;
    }

    const { email, password } = validationResult.data;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({
        status: 'E00',
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    if (user.is_email_verified !== 1) {
      // Changed to match your model
      res.status(401).json({
        status: 'E00',
        success: false,
        message: 'Email not verified'
      });
      return;
    }

    const token = generateToken({
      email: user.email,
      id: user._id
    });

    // Log login activity
    await new LogFile({
      email: user.email,
      ActivityName: `${user.role.toUpperCase()} logged in`,
      AddedOn: currentDate
    }).save();

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      })
      .json({
        status: '00',
        success: true,
        message: 'Login successful',
        role: user.role
      });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export const Logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({
        status: 'E00',
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!
    ) as JwtPayload;

    // Log logout activity
    await new LogFile({
      email: decoded.email,
      ActivityName: `${decoded.role?.toUpperCase()} logged out`,
      AddedOn: currentDate
    }).save();

    // Clear cookies and session
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    if (req.session) {
      req.session.destroy((err) => {
        if (err) logger.error('Session destruction error:', err);
      });
    }

    res.status(200).json({
      status: '00',
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal Server Error'
    });
  }
};
