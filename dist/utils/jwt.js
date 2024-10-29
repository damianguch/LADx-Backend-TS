"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenFromCookie = exports.authenticateJWT = void 0;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
// Ensure a strong secret key in production
const SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!SECRET_KEY) {
    throw new Error('JWT_SECRET_KEY not defined in environment variables');
}
// Function to generate a JWT token
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}
// Authentication middleware
const authenticateJWT = (req, res, next) => {
    var _a;
    // Check header or cookie for token
    const token = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) || req.cookies.token;
    if (token) {
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
            if (err)
                return res.status(403).json({ message: 'Invalid token' });
            req.user = user;
            next();
        });
    }
    else {
        res.status(401).json({ message: 'Authorization token required' });
    }
};
exports.authenticateJWT = authenticateJWT;
// Middleware function to verify JWT tokens
function verifyToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    let tokenArr = token.split(' ');
    jsonwebtoken_1.default.verify(tokenArr[1], process.env.JWT_SECRET_KEY, (err) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        //req.user = decoded;
        next();
    });
}
// Middleware to check JWT token in cookie
const verifyTokenFromCookie = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: 'Unauthorized Please login!' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        // Check if decoded is of type JwtPayload and access `id` if so
        const id = decoded.id;
        // Check if id is a valid ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Invalid user ID format'
            });
            return;
        }
        req.id = id; // Attach user info to the request
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'Forbidden!' });
    }
};
exports.verifyTokenFromCookie = verifyTokenFromCookie;
