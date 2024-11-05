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
exports.UpdateRole = void 0;
const user_1 = __importDefault(require("../models/user"));
const createLog_1 = __importDefault(require("../utils/createLog"));
const logger_1 = __importDefault(require("../logger/logger"));
const UpdateRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { role } = req.body;
    const userId = req.id;
    // Validate that the role is valid
    if (!['sender', 'traveler'].includes(role)) {
        res.status(400).json({
            status: 'E00',
            success: false,
            message: 'Invalid role selected'
        });
        return;
    }
    try {
        // Update the user’s role in the database
        const user = yield user_1.default.findByIdAndUpdate(userId, { role }, { new: true });
        if (!user) {
            res
                .status(404)
                .json({ status: 'E00', success: false, message: 'User not found' });
            return;
        }
        // Info level logging
        logger_1.default.info('Role Updated Successfully', {
            timestamp: new Date().toISOString()
        });
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Role updated successfully'
        });
    }
    catch (err) {
        (0, createLog_1.default)(`Error updating role: ${err.message}`);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: `Error updating role: ${err.message}`
        });
    }
});
exports.UpdateRole = UpdateRole;
