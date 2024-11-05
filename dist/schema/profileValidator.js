"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileUpdateSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const profileUpdateSchema = joi_1.default.object({
    fullname: joi_1.default.string()
        .trim()
        .min(2)
        .max(50)
        .regex(/^[a-zA-Z\s]+$/)
        .optional()
        .messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must not exceed 50 characters',
        'string.pattern.base': 'Full name must contain only letters and spaces'
    }),
    country: joi_1.default.string().trim().min(2).max(50).optional().messages({
        'string.min': 'Country must be at least 2 characters',
        'string.max': 'Country must not exceed 50 characters'
    }),
    state: joi_1.default.string().trim().min(2).max(50).optional().messages({
        'string.min': 'State must be at least 2 characters',
        'string.max': 'State must not exceed 50 characters'
    })
});
exports.profileUpdateSchema = profileUpdateSchema;
