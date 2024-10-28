"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logSchema = new mongoose_1.default.Schema({
    fullname: String,
    email: String,
    ActivityName: String,
    AddedOn: String
});
const LogFile = mongoose_1.default.model('LogFile', logSchema);
exports.default = LogFile;
