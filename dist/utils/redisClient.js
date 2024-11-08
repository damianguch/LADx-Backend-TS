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
    url: process.env.REDIS_URL
});
redisClient.on('connect', () => logger_1.default.info(`Connected to redis`, {
    timestamp: new Date().toISOString()
}));
redisClient.on('error', (error) => logger_1.default.error(`Redis connection error, ${error.message}`, {
    timestamp: new Date().toISOString()
}));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!redisClient.isOpen) {
        yield redisClient.connect();
    }
});
exports.connectRedis = connectRedis;
exports.default = redisClient;
