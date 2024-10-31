"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.validateUserSignup = void 0;
const zod_1 = require("zod");
const joi_1 = __importDefault(require("joi"));
const userSignupSchema = joi_1.default.object({
    fullname: joi_1.default.string().trim().required().messages({
        'any.required': 'Full name is required'
    }),
    email: joi_1.default.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    country: joi_1.default.string().trim().required().messages({
        'any.required': 'Country is required'
    }),
    state: joi_1.default.string().trim().required().messages({
        'any.required': 'State is required'
    }),
    phone: joi_1.default.string().pattern(/^\d+$/).required().messages({
        'any.required': 'Phone number is required',
        'string.pattern.base': 'Phone number should be numeric'
    }),
    password: joi_1.default.string().min(8).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    }),
    confirm_password: joi_1.default.any().valid(joi_1.default.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Confirm password is required'
    })
});
// Express middleware functions generally don’t return a value
// Simply set the return type to void and return nothing explicitly
const validateUserSignup = (req, res, next) => {
    const { error } = userSignupSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map((detail) => detail.message);
        res.status(400).json({ status: 'E00', errors });
        return;
    }
    next();
};
exports.validateUserSignup = validateUserSignup;
// Enhanced input validation schema with detailed error messages
const loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string'
    })
        .min(1, 'Email cannot be empty')
        .email({
        message: 'Invalid email format. Please enter a valid email address'
    })
        .trim()
        .toLowerCase(),
    password: zod_1.z
        .string({
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string'
    })
        .min(1, 'Password cannot be empty')
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password is too long')
});
exports.loginSchema = loginSchema;
