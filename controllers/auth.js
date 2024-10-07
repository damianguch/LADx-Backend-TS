const User = require('../models/user');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createAppLog } = require('../utils/createLog');
const { EmailCode } = require('../utils/randomNumbers');
const { encryptPasswordWithBcrypt } = require('../utils/passwordEncrypt');

// sign up
const SignUp = async (req, res) => {
  try {
    // get request body
    const { fullname, email, country, password, confirm_password } = req.body;

    // data validation
    if (!fullname) {
      await createAppLog(JSON.stringify('Full name can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Full name can not be empty'
      });
    }

    if (!email) {
      await createAppLog(JSON.stringify('Email can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Email can not be empty'
      });
    }

    if (!country) {
      await createAppLog(JSON.stringify('Country can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Country can not be empty'
      });
    }

    if (!password) {
      await createAppLog(JSON.stringify('Password can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Password can not be empty'
      });
    }

    if (!confirm_password) {
      await createAppLog(JSON.stringify('Confirm password can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Confirm password can not be empty'
      });
    }

    if (password != confirm_password) {
      await createAppLog(JSON.stringify('Password does not match!')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Password does not match!'
      });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email already registered'
      });
    } else {
      const encrypt_password = await encryptPasswordWithBcrypt(password);
      const verification_code = await EmailCode(6); // generate 6 digit code

      const userData = {
        fullname,
        email,
        country,
        password: encrypt_password,
        confirm_password: encrypt_password,
        password_reset_link: '',
        email_verification_code: verification_code,
        is_email_verified: 0
      };

      // Save the user to the database
      const newUser = new User(userData);
      await User.init();
      await newUser.save();

      // log data
      await createAppLog(JSON.stringify(userData));

      return res.status(200).json({
        status: '00',
        success: true,
        message: 'Check the code sent to your email address and type below'
      });
    }
  } catch (err) {
    await createAppLog(JSON.stringify(err));
    console.log(err);
    res.status(200).json({
      status: 'E00',
      success: false,
      message: 'Error'
    });
  }
};

module.exports = {
  SignUp
};
