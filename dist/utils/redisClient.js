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
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = void 0;
const redis_1 = require("redis");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL
});
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (error) => console.error('Redis connection error:', error.message));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!redisClient.isOpen) {
        yield redisClient.connect();
    }
});
exports.connectRedis = connectRedis;
exports.default = redisClient;
