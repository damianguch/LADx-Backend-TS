"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const auth_1 = require("../controllers/auth");
const forgotPassword_1 = require("../controllers/forgotPassword");
const user_schema_1 = require("../schema/user.schema");
const express_1 = require("express");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
authRouter.post('/signup', user_schema_1.validateUserSignup, auth_1.SignUp);
authRouter.post('/verify-otp', auth_1.verifyOTP);
//Use multer to handle multipart/form-data requests.
authRouter.post('/login', auth_1.Login);
authRouter.post('/logout', auth_1.Logout);
authRouter.post('/forgot-password', forgotPassword_1.ForgotPassword);
authRouter.put('/reset-password', forgotPassword_1.ResetPassword);
