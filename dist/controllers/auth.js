"use strict";
/*************************************************************************
 * Controller: User Authentication Controller
 * Description: Controller contains functions for all user authentictions.
 * Author: Damian Oguche
 * Date: 02-10-2024
 **************************************************************************/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logout = exports.Login = exports.verifyOTP = exports.SignUp = void 0;
const user_1 = __importDefault(require("../models/user"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const LogFile_1 = __importDefault(require("../models/LogFile"));
const randomNumbers_1 = __importDefault(require("../utils/randomNumbers"));
const createLog_1 = __importDefault(require("../utils/createLog"));
const passwordEncrypt_1 = __importDefault(require("../utils/passwordEncrypt"));
const date_1 = __importDefault(require("../utils/date"));
const sanitize_1 = require("../utils/sanitize");
const emailService_1 = require("../utils/emailService");
const otpStore = new Map(); // More scalable and secure in-memory store
// @POST: SignUp Route
const SignUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get request body
        const sanitizedData = (0, sanitize_1.sanitizeSignUpInput)(req.body);
        let { fullname, email, country, state, phone, password } = sanitizedData;
        // Check if email is already registered
        const existingUser = yield user_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Email already registered'
            });
            return;
        }
        // Hash password for later use (only after OTP verification)
        const encryptedPassword = yield (0, passwordEncrypt_1.default)(password);
        // Save user info temporarily
        const tempUser = {
            fullname,
            email,
            phone,
            country,
            state,
            password: encryptedPassword
        };
        // Generate OTP and hash it
        const otp = yield (0, randomNumbers_1.default)(6);
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedOTP = yield bcrypt_1.default.hash(otp, salt);
        // Store OTP and email in the session
        req.session.otpData = { hashedOTP, expiresAt: Date.now() + 60 * 60 * 1000 };
        req.session.email = email; // Store email in session
        console.log(req.session);
        // Store temp user In-Memory Store(Redis)
        req.session.tempUser = tempUser;
        // Optionally send OTP via email
        yield (0, emailService_1.sendOTPEmail)({ email, otp });
        res.status(200).json({
            status: '00',
            success: true,
            message: 'OTP sent to your email'
        });
    }
    catch (err) {
        (0, createLog_1.default)(JSON.stringify({ Error: err.message }));
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error: ' + err.message
        });
    }
});
exports.SignUp = SignUp;
// @POST: OTP Verification Route
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp } = req.body; // Get otp from request body
    const email = req.session.email; // Retrieve email from session
    console.log(otp);
    console.log(email);
    if (!otp || !email) {
        res.status(400).json({ message: 'OTP or email not found' });
        return;
    }
    try {
        // Fetch stored OTP from session
        const storedOTPData = req.session.otpData;
        if (!storedOTPData) {
            res.status(400).json({ message: 'OTP not found or expired' });
            return;
        }
        const { hashedOTP, expiresAt } = storedOTPData;
        // Check if OTP has expired
        if (Date.now() > expiresAt) {
            req.session.destroy((err) => {
                if (err) {
                    (0, createLog_1.default)(JSON.stringify({ Error: err.message }));
                }
            }); // Clear session data
            res.status(400).json({ message: 'OTP expired' });
            return;
        }
        // Verify OTP
        const isMatch = yield bcrypt_1.default.compare(otp, hashedOTP);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid OTP' });
            return;
        }
        // Fetch temp user data from otpStore
        // const tempUser = otpStore.get(`${email}_tempUser`);
        // Fetch tempUser data from session in-memory storage(Redis)
        const tempUser = req.session.tempUser;
        if (!tempUser) {
            res.status(400).json({ message: 'User not found' });
            return;
        }
        // Create the user in the database
        const newUser = new user_1.default(tempUser);
        yield user_1.default.init(); // Ensure indexes are created before saving
        const user = yield newUser.save();
        // Log the OTP verification activity
        const otpLog = new LogFile_1.default({
            email: tempUser.email,
            ActivityName: 'User Verified OTP',
            AddedOn: date_1.default
        });
        yield otpLog.save();
        // Log the new user creation activity
        const logEntry = new LogFile_1.default({
            fullname: tempUser.fullname,
            email: tempUser.email,
            ActivityName: `New user created with email: ${tempUser.email}`,
            AddedOn: date_1.default
        });
        yield logEntry.save();
        // Clear session and temp user data after successful verification
        req.session.destroy((err) => {
            if (err) {
                (0, createLog_1.default)(JSON.stringify({ Error: err.message }));
            }
            otpStore.delete(`${email}_tempUser`);
        }); // Clear session data
        // Generate JWT token with the user payload
        const token = (0, jwt_1.generateToken)({ email: user.email, id: user.id });
        yield (0, createLog_1.default)(JSON.stringify('OTP verified successfully. User account created.'));
        res
            .cookie('token', token, {
            httpOnly: true, // Prevent JavaScript access
            secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
            sameSite: 'none', // Prevent CSRF attacks if set to Strict
            maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
        })
            .json({
            message: 'OTP verified successfully. User account created.',
            status: 200
        });
    }
    catch (err) {
        (0, createLog_1.default)(JSON.stringify({ Error: err.message }));
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
});
exports.verifyOTP = verifyOTP;
// @POST: User Login
const Login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        yield (0, createLog_1.default)('Login information' + JSON.stringify(email));
        if (!email) {
            yield (0, createLog_1.default)('Email Required!');
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Email Required!'
            });
            return;
        }
        if (!password) {
            yield (0, createLog_1.default)('Password Required!');
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Password Required!'
            });
            return;
        }
        // Verify user login info(Find user by email)
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            yield (0, createLog_1.default)('This email is not registered');
            res.status(401).json({
                status: 'E00',
                success: false,
                message: 'This email is not registered'
            });
            return;
        }
        // Compare hashed password
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            yield (0, createLog_1.default)('Wrong password.');
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Wrong password.'
            });
            return;
        }
        // Generate JWT token with the user payload
        const token = (0, jwt_1.generateToken)({ email: user.email, id: user.id });
        // Log the login activity
        yield (0, createLog_1.default)('User logged in successfully');
        const log = new LogFile_1.default({
            email: user.email,
            ActivityName: 'Logged in with credential: ' + user.email,
            AddedOn: date_1.default
        });
        yield log.save();
        // Store token in HTTP-only, secure cookie
        res
            .cookie('token', token, {
            httpOnly: true, // Prevent JavaScript access
            secure: process.env.NODE_ENV === 'production' ? true : false, // Only send cookie over HTTPS in production
            sameSite: 'none', // Prevent CSRF attacks if set to Strict
            maxAge: 60 * 60 * 1000 // Cookie expiration time (1 hour)
        })
            .json({
            status: '200',
            success: true,
            message: 'Login successful!',
            email: user.email
        });
    }
    catch (err) {
        yield (0, createLog_1.default)('Error: ' + err.message);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server error: ' + err.message
        });
    }
});
exports.Login = Login;
// User Logout
const Logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token;
    if (!token) {
        yield (0, createLog_1.default)(`No token found!`);
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
    // Log the logout activity
    const log = new LogFile_1.default({
        email: decoded.email,
        ActivityName: `User ${decoded.email} Logged out of the system`,
        AddedOn: date_1.default
    });
    yield log.save();
    yield (0, createLog_1.default)(`User ${decoded.email} logged out!`);
    res
        .clearCookie('token')
        .clearCookie('csrfToken')
        .json({ message: 'User Logged out' });
});
exports.Logout = Logout;
