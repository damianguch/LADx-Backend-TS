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
exports.connectRedis = void 0;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../logger/logger"));
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                return new Error('Redis retry attempts exhausted');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});
redisClient.on('error', (err) => {
    logger_1.default.error('Redis Client Error:', err);
});
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redisClient.connect();
    }
    catch (error) {
        logger_1.default.error('Redis Connection Error:', error);
        process.exit(1);
    }
});
exports.connectRedis = connectRedis;
exports.default = redisClient;
