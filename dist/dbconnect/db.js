"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
mongoose_1.default
    .connect(process.env.DB_CONNECTION)
    .then(() => console.log('Connected to database!'))
    .catch((error) => {
    console.error('Database connection error:', error.message);
    process.exit(1);
});
// Connection object to communicate with database
const db = mongoose_1.default.connection;
exports.default = db;