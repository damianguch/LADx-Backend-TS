"use strict";
/*************************************************************************
 * Controller: Forgot Password controller
 * Description: Controller contains functions for password reset and email
 *              notification.
 * Author: Damian Oguche
 * Date: 16-10-2024
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
exports.ResetPassword = exports.ForgotPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_1 = __importDefault(require("../models/user")); // Mongoose User model
const emailService_1 = require("../utils/emailService");
const createLog_1 = __importDefault(require("../utils/createLog"));
const passwordEncrypt_1 = __importDefault(require("../utils/passwordEncrypt"));
// POST: Request Password Reset
const ForgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ message: 'Please enter a valid email' });
        return;
    }
    try {
        // Find user by email
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'This email does not exists.' });
            return;
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        // ForgotPassword - Hash token with SHA-256
        const hashedToken = crypto_1.default
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        // Set token and expiration on user object
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hr expiration
        yield user.save();
        // Send reset link via email
        const resetUrl = `${process.env.FRONTEND_URL}?token=${resetToken}&email=${email}`;
        yield (0, emailService_1.passwordResetEmail)(email, resetUrl);
        res.status(200).json({ message: 'Reset link sent successfully!' });
    }
    catch (err) {
        (0, createLog_1.default)(JSON.stringify({ Error: err.message }));
        res.status(500).json({ Error: err.message });
    }
});
exports.ForgotPassword = ForgotPassword;
// PUT: Reset password
const ResetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The frontend page parses the token and email from the URL.
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
        res.status(400).json({ message: 'No credentials provided!' });
        return;
    }
    try {
        // ResetPassword - Hash the token with SHA-256 before comparison
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        // Find the user with the hashed token and check expiration
        const user = yield user_1.default.findOne({
            email,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Token has not expired
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired token.' });
            return;
        }
        // Hash new password
        const hashedPassword = yield (0, passwordEncrypt_1.default)(password);
        // Update user's password and remove the reset token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        yield user.save();
        // Send confirmation email to user
        yield (0, emailService_1.ConfirmPasswordResetEmail)(email);
        yield (0, createLog_1.default)('Password reset successful!');
        res.status(200).json({ message: 'Password reset successful!' });
    }
    catch (err) {
        yield (0, createLog_1.default)('Error reseting password: ' + err.message);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Server error, please try again later: ' + err.message
        });
    }
});
exports.ResetPassword = ResetPassword;
