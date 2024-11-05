"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleSchema = void 0;
const zod_1 = require("zod");
// Define Zod schema for role validation
const roleSchema = zod_1.z.object({
    role: zod_1.z.enum(['sender', 'traveler'], {
        required_error: 'Role is required',
        invalid_type_error: "Role must be either 'sender' or 'traveler'"
    })
});
exports.roleSchema = roleSchema;
