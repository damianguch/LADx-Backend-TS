"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
(0, winston_1.addColors)({
    info: 'blue',
    error: 'red',
    warn: 'yellow'
});
const logger = (0, winston_1.createLogger)({
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
