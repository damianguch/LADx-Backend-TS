const nodemailer = require('nodemailer');
const { createAppLog } = require('./createLog');

const transporter = nodemailer.createTransport({
  port: process.env.EMAIL_PORT,
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  secure: false
});

// Send OTP via Email
const sendOTPEmail = async (email, otp) => {
  // Send OTP
  const mailOptions = {
    from: 'no-reply@ladX.africa',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    await createAppLog(JSON.stringify('OTP sent to your email'));
    return { message: 'OTP sent to your email' };
  } catch (error) {
    await createAppLog(JSON.stringify('Error sending OTP'));
    throw new Error('Error sending OTP');
  }
};

// Send Password Reset via Email
const passwordResetEmail = async (email, resetUrl) => {
  // Send Reset link
  const sender = 'no-reply@ladx.africa';
  const recipient = email;

  const mailOptions = {
    from: sender,
    to: recipient,
    subject: 'Your Password Reset Request',
    text: `Your password reset link is ${resetUrl}`
  };

  try {
    let result = await transporter.sendMail(mailOptions);
    if (result) {
      await createAppLog(
        JSON.stringify('Password reset link sent to your email')
      );
    }
    throw new Error('Error sending link');
  } catch (error) {
    await createAppLog(JSON.stringify(error.message));
  }
};

module.exports = {
  sendOTPEmail,
  passwordResetEmail
};
