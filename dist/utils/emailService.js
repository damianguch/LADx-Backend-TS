"use strict";
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
exports.ConfirmPasswordResetEmail = exports.passwordResetEmail = exports.sendOTPEmail = exports.client = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
const createLog_1 = __importDefault(require("./createLog"));
const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN
};
const SES_Config = {
    credentials,
    region: process.env.AWS_REGION
};
const client = new client_ses_1.SESClient(SES_Config);
exports.client = client;
// Send OTP Email
const sendOTPEmail = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Source: 'ladxofficial@gmail.com',
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Body: {
                Text: {
                    Data: `Your OTP code is ${otp}`
                }
            },
            Subject: {
                Data: 'Your OTP Code'
            }
        }
    };
    try {
        // Send the created object to the AWS server
        const command = new client_ses_1.SendEmailCommand(params);
        const response = yield client.send(command);
        (0, createLog_1.default)('OTP sent successfully: ' + response);
        return response;
    }
    catch (error) {
        console.error('Error sending OTP:', error.message);
        (0, createLog_1.default)(JSON.stringify('Error sending OTP:' + error.message));
    }
});
exports.sendOTPEmail = sendOTPEmail;
//Send Password Reset Email
const passwordResetEmail = (email, resetUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Source: 'ladxofficial@gmail.com',
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Body: {
                Text: {
                    Data: `Your password reset link is ${resetUrl}`
                }
            },
            Subject: {
                Data: 'Your Password Reset Request'
            }
        }
    };
    try {
        const command = new client_ses_1.SendEmailCommand(params);
        const response = yield client.send(command);
        (0, createLog_1.default)('Password Reset link sent successfully: ' + response);
    }
    catch (error) {
        console.error('Error sending reset link:', error.message);
        (0, createLog_1.default)(JSON.stringify('Error sending reset link:' + error.message));
    }
});
exports.passwordResetEmail = passwordResetEmail;
// Send Reset confirmation email to user
const ConfirmPasswordResetEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Source: 'ladxofficial@gmail.com',
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Body: {
                Text: {
                    Data: `Your password reset was successful!.`
                }
            },
            Subject: {
                Data: 'Password Reset Successful'
            }
        }
    };
    try {
        const command = new client_ses_1.SendEmailCommand(params);
        const res = yield client.send(command);
        console.log(res);
        yield (0, createLog_1.default)(JSON.stringify('Password reset Successfull'));
    }
    catch (error) {
        yield (0, createLog_1.default)(JSON.stringify(error.message));
        return console.log(error.message);
    }
});
exports.ConfirmPasswordResetEmail = ConfirmPasswordResetEmail;
