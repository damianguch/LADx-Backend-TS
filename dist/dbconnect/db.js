"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../logger/logger"));
mongoose_1.default
    .connect(process.env.MONGO_LOCAL)
    .then(() => logger_1.default.success(`Connected to database!`, {
    timestamp: new Date().toISOString()
}))
    .catch((error) => {
    logger_1.default.error(`Database connection error: ${error.message}`, {
        timestamp: new Date().toISOString()
    });
    process.exit(1);
});
// Connection object to communicate with database
const db = mongoose_1.default.connection;
exports.default = db;
