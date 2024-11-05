"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleSchema = void 0;
const zod_1 = require("zod");
exports.roleSchema = zod_1.z.object({
    role: zod_1.z
        .string()
        .min(1, { message: 'Role is required' })
        .refine((val) => val === 'sender' || val === 'traveler', {
        message: 'Invalid role selected'
    })
});
