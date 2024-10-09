const nodemailer = require('nodemailer');
const { createAppLog } = require('./createLog');

// Send OTP via Email
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    secure: false
  });

  // Send OTP
  const mailOptions = {
    from: 'no-reply@ladX.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    await createAppLog(JSON.stringify('OTP sent to your email'));
    return { success: true, message: 'OTP sent to your email' };
  } catch (error) {
    await createAppLog(JSON.stringify('Error sending OTP'));
    throw new Error('Error sending OTP');
  }
};

module.exports = { sendOTPEmail };
