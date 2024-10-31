"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
// Define custom log levels, including 'success'
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        success: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'blue',
        success: 'green',
        debug: 'gray'
    }
};
(0, winston_1.addColors)(customLevels.colors);
const logger = (0, winston_1.createLogger)({
    levels: customLevels.levels,
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize({ all: true }), // Apply color to level
            winston_1.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} ${level}: ${message}`;
            }))
        }),
        new winston_1.transports.File({ filename: 'app.log' })
    ]
});
exports.default = logger;
