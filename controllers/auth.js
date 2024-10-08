const User = require('../models/user');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const LogFile = require('../models/LogFile');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createAppLog } = require('../utils/createLog');
const { encryptPasswordWithBcrypt } = require('../utils/passwordEncrypt');

// User Registration
const SignUp = async (req, res) => {
  try {
    // get request body
    const { fullname, email, country, state, password, confirm_password } =
      req.body;

    // data validation
    if (!fullname) {
      await createAppLog(JSON.stringify('Full name is required')); // log error
      return res.status(200).json({
        status: 'E00',
        success: false,
        message: 'Full name is required'
      });
    }

    if (!email) {
      await createAppLog(JSON.stringify('Email is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email is required'
      });
    }

    if (!country) {
      await createAppLog(JSON.stringify('Country is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Country is required'
      });
    }

    if (!state) {
      await createAppLog(JSON.stringify('State is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'State is required'
      });
    }

    if (!password) {
      await createAppLog(JSON.stringify('Password is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Password is required'
      });
    }

    if (!confirm_password) {
      await createAppLog(JSON.stringify('Confirm password is required')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Confirm password is required'
      });
    }

    if (password != confirm_password) {
      await createAppLog(JSON.stringify('Password does not match!')); // log error
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Password does not match!'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email already registered'
      });
    }

    const encrypt_password = await encryptPasswordWithBcrypt(password);

    const userData = {
      fullname,
      email,
      country,
      state,
      password: encrypt_password,
      confirm_password: encrypt_password,
      password_reset_link: '',
      email_verification_code: hashedOTP,
      is_email_verified: 0,
      roles: 0
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

// User Login
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    await createAppLog('Login information' + JSON.stringify(email));

    if (!email) {
      await createAppLog('Email cannot be empty!');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email cannot be empty!'
      });
    }

    if (!password) {
      await createAppLog('Password cannot be empty!');
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Password cannot be empty!'
      });
    }

    // Verify user login information
    const user = await User.findOne({ email });

    if (!user) {
      await createAppLog('This email is not registered');
      return res.status(401).json({
        status: 'E00',
        success: false,
        message: 'This email is not registered'
      });
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid && user.email) {
      await createAppLog('Wrong password.');
      return res.status(401).json({
        status: 'E00',
        success: false,
        message: 'Wrong password.'
      });
    }

    // Generate a JWT token with the user payload
    const token = generateToken({ email: user.email });
    await createAppLog('Login success ' + JSON.stringify(token));

    // Log the login activity
    const today = new Date();
    const currentDate =
      today.toISOString().slice(0, 10) +
      ' ' +
      today.toISOString().slice(11, 19) +
      'Hrs';

    const log = new LogFile({
      email: user.email,
      UserType: 1,
      ActivityName: 'Logged into the system with credential: ' + user.email,
      AddedOn: currentDate
    });

    let user_status = '';
    let userid = user.id;
    //let userName = user.;
    let toplevelId = null;
    let userType = user.UserType;
    let sponsorId = user.SponsorID;

    if (userType == 1) {
      toplevelId = user.id;
    } else if (userType == 2) {
      toplevelId = user.toplevelEmail;
    } else if (userType == 3) {
      toplevelId = user.toplevelEmail;
    } else if (userType == 4) {
      toplevelId = user.toplevelEmail;
    }

    await log.save();

    return res.status(200).json({
      status: '200',
      success: true,
      message: 'Login successful!',
      token: token,
      email: user.email,
      user_type: userType,
      sponsorId: sponsorId
    });
  } catch (err) {
    await createAppLog('Error: ' + err.message);
    console.log(err);
    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Login not successful! Something went wrong.'
    });
  }
};

module.exports = {
  SignUp,
  Login
};
