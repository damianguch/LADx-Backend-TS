const nodemailer = require('nodemailer');

// Send OTP via Email
const sendOTPEmail = (email, otp) => {
  let transporter = nodemailer.createTransport({
    port: process.env.EMAIL_PORT,
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    secure: false
  });

  const mailOptions = {
    from: 'no-reply@ladX.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
