const User = require('../models/user');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const LogFile = require('../models/LogFile');
const { EmailCode } = require('../utils/randomNumbers');
const { createAppLog } = require('../utils/createLog');
const { encryptPasswordWithBcrypt } = require('../utils/passwordEncrypt');
const { sendOTPEmail } = require('../utils/emailService');
const { isEmail, escape } = require('validator');

let otpStore = {}; // In-memory storage of OTPs
let emailStore = {}; // Im-memory storage of email

// Signup Route/Request OTP
const SignUp = async (req, res) => {
  // get request body
  const { fullname, email, country, state, phone, password, confirm_password } =
    req.body;

  // data validation

  if (!fullname) {
    await createAppLog(JSON.stringify('Full name is required')); // log error
    return res.status(400).json({
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

  // Validate email format
  if (!isEmail(email)) {
    return res.status(400).json({
      status: 'E00',
      success: false,
      message: 'Invalid email format'
    });
  } else {
    emailStore.email = email;
  }

  if (!phone) {
    await createAppLog(JSON.stringify('Phone number is required')); // log error
    return res.status(400).json({
      status: 'E00',
      success: false,
      message: 'Phone number is required'
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

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      await createAppLog(JSON.stringify('Email already registered'));
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Email already registered'
      });
    }

    const otp = await EmailCode(6); // generate 6 digit code

    const hashedOTP = await bcrypt.hash(otp, 10); // Store hashed OTP for security
    otpStore.email = hashedOTP; // Save OTP for verification later

    const encrypt_password = await encryptPasswordWithBcrypt(password);

    userInfo = {
      fullname,
      email,
      phone,
      country,
      state,
      password: encrypt_password,
      password_reset_link: '',
      email_verification_code: hashedOTP,
      is_email_verified: 0,
      roles: 0
    };

    // Save the user to the database
    const newUser = new User(userInfo);
    await User.init();
    await newUser.save();

    const result = await sendOTPEmail(email, otp);
    await createAppLog(JSON.stringify(result));

    return res
      .status(201)
      .json({ message: 'User created successfully', result });
  } catch (error) {
    createAppLog(JSON.stringify({ error: error.message }));
    return res.status(500).json({ error: error.message });
  }
};

// OTP Verification route
const verifyOTP = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' });
  }

  try {
    const storedOTP = otpStore['email'];
    const storedEmail = emailStore['email'];

    const user = await User.findOne({ email: storedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!storedOTP) {
      return res.status(400).json({ message: 'OTP not found ' });
    }

    const isMatch = await bcrypt.compare(otp, storedOTP);
    if (isMatch) {
      user.is_email_verified = 1;
      await user.save();

      // Remove OTP/email after successful verification
      delete otpStore['email'];
      delete emailStore['email'];

      // log data
      await createAppLog(JSON.stringify('OTP verified successfully!'));
      return res.status(200).json({ message: 'OTP verified successfully!' });
    } else {
      await createAppLog(JSON.stringify('Invalid OTP'));
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    createAppLog(JSON.stringify('OTP Verification Error!'));
    return res.status(500).json({ message: 'Internal Server Error!' });
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
  verifyOTP,
  Login
};
