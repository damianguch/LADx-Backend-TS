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

// Define user roles
enum UserRole {
  SENDER = 'sender',
  TRAVELER = 'traveler',
  ADMIN = 'admin'
}

interface ErrorResponse {
  status: string;
  success: boolean;
  message: string;
  errors?: z.ZodError['errors'];
}

export const SignUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const sanitizedData = sanitizeSignUpInput(req.body);
    let { fullname, email, country, state, phone, password, role } = sanitizedData;

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid user role'
      });
      return;
    }

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

    // Store registration data and OTP in session
    req.session.registrationData = {
      fullname,
      email,
      country,
      state,
      phone,
      role,
      password: await encryptPasswordWithBcrypt(password),
      otp: hashedOTP,
      otpExpiry
    };

    // Send OTP via email
    await sendOTPEmail({
      email,
      otp,
      template: 'registration', // You'll need to create this template
      role
    });

    logger.info(`OTP sent to ${email} for ${role} registration`);

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
    const { otp } = verifyOTPSchema.parse(req.body);
    const registrationData = req.session.registrationData;

    if (!registrationData) {
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
        message: 'OTP expired'
      });
      return;
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp.toString(), registrationData.otp);
    if (!isValidOTP) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid OTP'
      });
      return;
    }

    // Create user
    const newUser = new User({
      fullname: registrationData.fullname,
      email: registrationData.email,
      password: registrationData.password,
      country: registrationData.country,
      state: registrationData.state,
      phone: registrationData.phone,
      role: registrationData.role,
      isVerified: true
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken({
      email: newUser.email,
      id: newUser._id,
      role: newUser.role
    });

    // Clear session
    req.session.destroy((err) => {
      if (err) logger.error('Session destruction error:', err);
    });

    // Set cookie and send response
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }).json({
      status: '00',
      success: true,
      message: 'Registration successful',
      role: newUser.role
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

    if (!user.isVerified) {
      res.status(401).json({
        status: 'E00',
        success: false,
        message: 'Email not verified'
      });
      return;
    }

    const token = generateToken({
      email: user.email,
      id: user._id,
      role: user.role
    });

    // Log login activity
    await new LogFile({
      email: user.email,
      ActivityName: `${user.role.toUpperCase()} logged in`,
      AddedOn: currentDate
    }).save();

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    }).json({
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

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const registrationData = req.session.registrationData;
    if (!registrationData) {
      res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Registration session expired'
      });
      return;
    }

    const otp = await generateOTP(6);
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    // Update session with new OTP data
    req.session.registrationData = {
      ...registrationData,
      otp: hashedOTP,
      otpExpiry
    };

    await sendOTPEmail({
      email: registrationData.email,
      otp,
      template: 'resend',
      role: registrationData.role
    });

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;

    // Log logout activity
    await new LogFile({
      email: decoded.email,
      ActivityName: `${decoded.role?.toUpperCase()} logged out`,
      AddedOn: currentDate
    }).save();

    res.clearCookie('token').json({
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
