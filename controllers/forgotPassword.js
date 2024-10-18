/*************************************************************************
 * Controller: Forgot Password controller
 * Description: Controller contains functions for password reset and email
 *              notification.
 * Author: Damian Oguche
 * Date: 16-10-2024
 **************************************************************************/

const crypto = require('crypto');
const User = require('../models/user'); // Mongoose User model
const bcrypt = require('bcrypt');
const {
  passwordResetEmail,
  ConfirmPasswordResetEmail
} = require('../utils/emailService');
const { createAppLog } = require('../utils/createLog');
const { encryptPasswordWithBcrypt } = require('../utils/passwordEncrypt');

// POST: Request password reset
const ForgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please enter a valid email' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'This email does not exists.' });
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

    console.log(resetUrl);

    await passwordResetEmail(email, resetUrl);
    res.status(200).json({ message: 'Reset link sent successfully!' });
  } catch (error) {
    createAppLog(JSON.stringify({ Error: error.message }));
    res.status(500).json({ Error: error.message });
  }
};

// PUT: Reset password
const ResetPassword = async (req, res) => {
  // The frontend page parses the token and email from the URL.
  const { token, email, password } = req.body;

  if (!token || !email || !password)
    return res.status(400).json({ message: 'No credentials provided!' });

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
      return res.status(400).json({ message: 'Invalid or expired token.' });
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
  } catch (error) {
    await createAppLog({ message: error.message });
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};

module.exports = {
  ForgotPassword,
  ResetPassword
};
