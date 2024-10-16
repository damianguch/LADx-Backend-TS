/*******************************************
 * Controller: Forgot Password controller
 * Description: Controller contains functions for password
               reset and email notification.
 * Author: Damian Oguche
 * Date: 16-10-2024
 ********************************************/

const crypto = require('crypto');
const User = require('../models/user'); // Mongoose User model
const bcrypt = require('bcrypt');
const { passwordResetEmail } = require('../utils/emailService');

// POST: Request password reset
const ForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'This email does not exists.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 12);

    // Set token and expiration on user object
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiration
    await user.save();

    // Send reset link via email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    console.log(resetUrl);

    await passwordResetEmail(email, resetUrl);
    res.status(200).json({ message: 'Reset link sent successfully!' });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// POST: Reset password
const ResetPassword = async (req, res) => {
  // The frontend page parses the token and email from the URL.
  const { token, email, newPassword } = req.body;

  try {
    // Hash the token
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
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password and remove the reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });

    // Optional: Send confirmation email to user
    const mailOptions = {
      to: email,
      from: 'no-reply@ladx.africa',
      subject: 'Password Reset Successful',
      text: `Your password has been successfully reset.`
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};

module.exports = {
  ForgotPassword,
  ResetPassword
};
