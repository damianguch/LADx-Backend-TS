"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserSignup = void 0;
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
