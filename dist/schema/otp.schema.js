"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTPSchema = void 0;
const zod_1 = require("zod");
// Define the schema for the request body
exports.verifyOTPSchema = zod_1.z.object({
    otp: zod_1.z.string().min(4).max(6)
});
