/*************************************************************************
 * Controller: Forgot Password controller
 * Description: Controller contains functions for password reset and email
 *              notification.
 * Author: Damian Oguche
 * Date: 16-10-2024
 **************************************************************************/

import crypto from 'crypto';
import User from '../models/user'; // Mongoose User model
import {
  passwordResetEmail,
  ConfirmPasswordResetEmail
} from '../utils/emailService';
import createAppLog from '../utils/createLog';
import encryptPasswordWithBcrypt from '../utils/passwordEncrypt';
import { Request, Response } from 'express';

// POST: Request Password Reset
const ForgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Please enter a valid email' });
    return;
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'This email does not exists.' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // ForgotPassword - Hash token with SHA-256
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiration on user object
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hr expiration
    await user.save();

    // Send reset link via email
    const resetUrl = `${process.env.FRONTEND_URL}?token=${resetToken}&email=${email}`;

    await passwordResetEmail(email, resetUrl);
    res.status(200).json({ message: 'Reset link sent successfully!' });
  } catch (err: any) {
    createAppLog(JSON.stringify({ Error: err.message }));
    res.status(500).json({ Error: err.message });
  }
};

// PUT: Reset password
const ResetPassword = async (req: Request, res: Response): Promise<void> => {
  // The frontend page parses the token and email from the URL.
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    res.status(400).json({ message: 'No credentials provided!' });
    return;
  }

  try {
    // ResetPassword - Hash the token with SHA-256 before comparison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user with the hashed token and check expiration
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Token has not expired
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired token.' });
      return;
    }

    // Hash new password
    const hashedPassword = await encryptPasswordWithBcrypt(password);

    // Update user's password and remove the reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email to user
    await ConfirmPasswordResetEmail(email);
    await createAppLog('Password reset successful!');
    res.status(200).json({ message: 'Password reset successful!' });
  } catch (err: any) {
    await createAppLog('Error reseting password: ' + err.message);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Server error, please try again later: ' + err.message
    });
  }
};

export { ForgotPassword, ResetPassword };
