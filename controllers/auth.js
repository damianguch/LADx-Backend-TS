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
    const data = {
      fullname: req.body.fullname,
      email: req.body.email,
      country: req.body.country,
      password: req.body.password,
      confirm_password: req.body.confirm_password
    };

    // data validation
    if (!data.fullname) {
      await createAppLog(JSON.stringify('Full name can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Full name can not be empty'
      });
    }

    if (!data.email) {
      await createAppLog(JSON.stringify('Email can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Email can not be empty'
      });
    }

    if (!data.country) {
      await createAppLog(JSON.stringify('Country can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Country can not be empty'
      });
    }

    if (!data.password) {
      await createAppLog(JSON.stringify('Password can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Password can not be empty'
      });
    }

    if (!data.confirm_password) {
      await createAppLog(JSON.stringify('Confirm password can not be empty')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Confirm password can not be empty'
      });
    }

    if (data.password != data.confirm_password) {
      await createAppLog(JSON.stringify('Password does not match!')); // log error
      res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Password does not match!'
      });
    }

    const encrypt_password = await encryptPasswordWithBcrypt(data.password);
    const verification_code = await EmailCode(6); // generate 6digit code
    const save_data = {
      fullname: data.fullname,
      email: data.email,
      country: data.country,
      password: encrypt_password,
      confirm_password: encrypt_password,
      password_reset_link: '',
      email_verification_code: verification_code,
      is_email_verified: 0
    };

    // Save the user
    const newUser = new User(save_data);
    await newUser.save();

    // log data
    await createAppLog(JSON.stringify(save_data));

    return res.status(200).json({
      status: '00',
      success: true,
      message: 'Check the code sent to your email address and type below'
    });
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
