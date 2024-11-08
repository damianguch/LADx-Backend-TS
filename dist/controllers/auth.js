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
exports.Logout = exports.Login = exports.resendOTP = exports.verifyOTP = exports.SignUp = void 0;
const user_1 = __importDefault(require("../models/user"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const LogFile_1 = __importDefault(require("../models/LogFile"));
const createLog_1 = __importDefault(require("../utils/createLog"));
const passwordEncrypt_1 = __importDefault(require("../utils/passwordEncrypt"));
const date_1 = __importDefault(require("../utils/date"));
const sanitize_1 = require("../utils/sanitize");
const emailService_1 = require("../utils/emailService");
const user_schema_1 = require("../schema/user.schema");
const logger_1 = __importDefault(require("../logger/logger"));
const otp_schema_1 = require("../schema/otp.schema");
const randomNumbers_1 = __importDefault(require("../utils/randomNumbers"));
const SignUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
        // Generate and hash OTP
        const otp = yield (0, randomNumbers_1.default)(6);
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
        const hashedOTP = yield bcrypt_1.default.hash(otp.toString(), 10);
        const registrationData = {
            fullname,
            email,
            country,
            state,
            phone,
            password: yield (0, passwordEncrypt_1.default)(password),
            otp: hashedOTP,
            otpExpiry
        };
        // Store registration data and OTP in session
        req.session.registrationData = registrationData;
        req.session.save((err) => {
            if (err) {
                // Info level logging
                logger_1.default.error(`Session save error`, {
                    timestamp: new Date().toISOString()
                });
            }
            // Info level logging
            else
                logger_1.default.info('Session saved successfully', {
                    timestamp: new Date().toISOString()
                });
        });
        // Send OTP via email
        yield (0, emailService_1.sendOTPEmail)({ email, otp });
        logger_1.default.info(`OTP sent to ${email}`);
        res.status(200).json({
            status: '00',
            success: true,
            message: 'OTP sent successfully'
        });
    }
    catch (error) {
        logger_1.default.error('SignUp error:', error);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error'
        });
    }
});
exports.SignUp = SignUp;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate the request body using Zod
        const { otp } = otp_schema_1.verifyOTPSchema.parse(req.body);
        // Get session data
        const registrationData = req.session.registrationData;
        // Check if session exists with registration data
        if (!registrationData) {
            logger_1.default.warn('No registration data found in session');
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Registration session expired'
            });
            return;
        }
        // Check OTP expiry
        if (Date.now() > registrationData.otpExpiry) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'OTP has expired'
            });
            return;
        }
        // Verify OTP
        const isValidOTP = yield bcrypt_1.default.compare(otp, registrationData.otp);
        if (!isValidOTP) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Invalid OTP'
            });
            return;
        }
        // Create user since OTP is valid
        const newUser = new user_1.default({
            fullname: registrationData.fullname,
            email: registrationData.email,
            password: registrationData.password,
            country: registrationData.country,
            state: registrationData.state,
            phone: registrationData.phone,
            is_email_verified: 1
        });
        yield newUser.save();
        yield (0, createLog_1.default)(JSON.stringify('OTP verified successfully. User account created.'));
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({ email: newUser.email, id: newUser._id });
        // Clear session after successful verification
        req.session.destroy((err) => {
            if (err)
                logger_1.default.error('Session destruction error:', err);
        });
        res
            .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000
        })
            .status(200)
            .json({
            status: '00',
            success: true,
            message: 'OTP verified successfully. User account created.'
        });
    }
    catch (error) {
        logger_1.default.error('OTP verification error:', error);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error'
        });
    }
});
exports.verifyOTP = verifyOTP;
const resendOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if session exists
        if (!req.session.registrationData) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Registration session expired'
            });
            return;
        }
        const { email } = req.session.registrationData;
        // Generate new OTP
        const otp = yield (0, randomNumbers_1.default)(6);
        const hashedOTP = yield bcrypt_1.default.hash(otp.toString(), 10);
        // Update session with new OTP
        req.session.registrationData = Object.assign(Object.assign({}, req.session.registrationData), { otp: hashedOTP, otpExpiry: Date.now() + 10 * 60 * 1000 });
        // Save session explicitly
        yield new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err)
                    reject(err);
                resolve();
            });
        });
        // Send new OTP
        yield (0, emailService_1.sendOTPEmail)({ email, otp });
        res.status(200).json({
            status: '00',
            success: true,
            message: 'OTP resent successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Resend OTP error:', error);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error'
        });
    }
});
exports.resendOTP = resendOTP;
const Login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validationResult = user_schema_1.loginSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Invalid input',
                errors: validationResult.error.errors
            });
            return;
        }
        const { email, password } = validationResult.data;
        const user = yield user_1.default.findOne({ email }).select('+password');
        if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
            res.status(401).json({
                status: 'E00',
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        if (user.is_email_verified !== 1) {
            // Changed to match your model
            res.status(401).json({
                status: 'E00',
                success: false,
                message: 'Email not verified'
            });
            return;
        }
        const token = (0, jwt_1.generateToken)({
            email: user.email,
            id: user._id
        });
        // Log login activity
        yield new LogFile_1.default({
            email: user.email,
            ActivityName: `${user.role.toUpperCase()} logged in`,
            AddedOn: date_1.default
        }).save();
        res
            .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        })
            .json({
            status: '00',
            success: true,
            message: 'Login successful',
            role: user.role
        });
    }
    catch (error) {
        logger_1.default.error('Login error:', error);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error'
        });
    }
});
exports.Login = Login;
const Logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({
                status: 'E00',
                success: false,
                message: 'Not authenticated'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        // Log logout activity
        yield new LogFile_1.default({
            email: decoded.email,
            ActivityName: `${(_a = decoded.role) === null || _a === void 0 ? void 0 : _a.toUpperCase()} logged out`,
            AddedOn: date_1.default
        }).save();
        // Clear cookies and session
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        if (req.session) {
            req.session.destroy((err) => {
                if (err)
                    logger_1.default.error('Session destruction error:', err);
            });
        }
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Logout error:', error);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error'
        });
    }
});
exports.Logout = Logout;
