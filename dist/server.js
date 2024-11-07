"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const db_1 = __importDefault(require("./dbconnect/db"));
const servicesRoutes_1 = __importDefault(require("./routes/servicesRoutes"));
const redisClient_1 = __importStar(require("./utils/redisClient"));
const logger_1 = __importDefault(require("./logger/logger"));
const authRoutes_1 = require("./routes/authRoutes");
const app = (0, express_1.default)();
// CORS Options definition
const corsOptions = {
    origin: [
        'https://ladx.africa',
        'https://ladx-frontend.netlify.app',
        'https://www.ladx.africa',
        'https://dashboard-lyart-nine-87.vercel.app',
        'http://localhost:3000', // Frontend local development
        'http://localhost:3001' // Dashboard local development
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Credentials'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    exposedHeaders: ['set-cookie']
};
// Initialize Redis client on server startup
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, redisClient_1.connectRedis)();
    // Keep Redis connection alive
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        if (redisClient_1.default.isOpen) {
            yield redisClient_1.default.ping();
        }
    }), 6000); // Ping every 60 seconds
}))();
// Trust the first proxy
app.set('trust proxy', true);
// Apply CORS
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
// Add specific headers for authentication and cookies
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && corsOptions.origin.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});
// Combined Helmet Configuration
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    xContentTypeOptions: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            'img-src': ["'self'", 'https: data: blob:'],
            'script-src': ["'self'", "'unsafe-inline'", 'https:'],
            'style-src': ["'self'", "'unsafe-inline'", 'https:'],
            'connect-src': [
                "'self'",
                'https://ladx-backend-ts.onrender.com',
                'https://ladx.africa',
                'https://dashboard-lyart-nine-87.vercel.app'
            ],
            'frame-ancestors': [
                "'self'",
                'https://ladx.africa',
                'https://dashboard-lyart-nine-87.vercel.app'
            ],
            'form-action': [
                "'self'",
                'https://ladx.africa',
                'https://dashboard-lyart-nine-87.vercel.app'
            ]
        }
    }
}));
// Basic middleware
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)('common'));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Session Configuration
app.use((0, express_session_1.default)({
    store: new connect_redis_1.default({ client: redisClient_1.default }),
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
        domain: process.env.NODE_ENV === 'production' ? '.ladx.africa' : undefined
    }
}));
// Rate Limiters
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }
});
const resetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many password reset attempts, please try again after 15 minutes.'
});
app.use('/api/v1/forgot-password', resetLimiter);
app.use('/api/v1', limiter);
// Static Files
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_1.default.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
// Upload Handler
app.use('/uploads', (req, res, next) => {
    const ext = path_1.default.extname(req.url);
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        express_1.default.static(path_1.default.join(__dirname, 'uploads'))(req, res, next);
    }
    else {
        res.status(403).send('Access denied');
    }
});
// Routes
app.use('/api/v1', servicesRoutes_1.default);
app.use('/api/v1', authRoutes_1.authRouter);
// Production static files
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static('build'));
}
// Server Setup
const PORT = process.env.PORT || 1337;
const host = '0.0.0.0';
const httpServer = http_1.default.createServer(app);
// Graceful Shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db_1.default.close();
        console.log('Connection to db closed by application termination');
        process.exit(0);
    }
    catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
}));
// Start Server
httpServer.listen({ port: PORT, host }, () => {
    logger_1.default.info(`Server running on port ${PORT}...`, {
        timestamp: new Date().toISOString()
    });
});
