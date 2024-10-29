"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadErrorHandler = void 0;
const multer_1 = __importDefault(require("multer"));
// Middleware to handle error during file upload
const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        res.status(400).json({
            status: 'E00',
            message: 'File upload error: ' + err.message
        });
        return;
    }
    next(err);
};
exports.uploadErrorHandler = uploadErrorHandler;
