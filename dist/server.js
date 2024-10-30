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
const redis_1 = require("redis");
const db_1 = __importDefault(require("./dbconnect/db"));
const app = (0, express_1.default)();
const servicesRoutes_1 = __importDefault(require("./routes/servicesRoutes"));
const redisClient = (0, redis_1.createClient)({
    url: 'redis://localhost:6379',
    socket: {
        host: 'localhost', // Or Redis server IP
        port: 6379 // Default Redis port
    }
});
redisClient
    .connect()
    .then(() => console.log('Connected to redis!'))
    .catch((error) => console.error(error.message));
// Use Helmet for various security headers
app.use((0, helmet_1.default)());
app.use((0, helmet_1.default)({
    xContentTypeOptions: false // Disables 'X-Content-Type-Options: nosniff'
}));
// Enforce HTTPS using Helmet HSTS middleware
app.use(helmet_1.default.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true, // Apply to all subdomains
    preload: true
}));
app.use(helmet_1.default.contentSecurityPolicy({
    useDefaults: true,
    directives: {
        'img-src': ["'self'", 'https: data:'],
        'script-src': ["'self'", 'https: data'],
        'style-src': ["'self'", 'https:']
    }
}));
app.use((0, cookie_parser_1.default)());
// Log App activities on console
app.use((0, morgan_1.default)('common'));
//For parsing application/x-www-form-urlencoded data
app.use(express_1.default.urlencoded({ extended: true }));
// Middleware to parse the request body as JSON data
app.use(express_1.default.json());
// Configure the session middleware
app.use((0, express_session_1.default)({
    // session data will be stored in Redis
    store: new connect_redis_1.default({ client: redisClient }),
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production' ? true : false,
        maxAge: 60 * 60 * 1000
    }
}));
// Trust the first proxy
app.set('trust proxy', true);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: { trustProxy: false } // Disable the trust proxy check
});
const resetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: 'Too many password reset requests, please try again after 15 minutes.'
});
// Apply rate limit to password reset
app.use('/api/v1/forgot-password', resetLimiter);
// Apply rate limit to all requests
app.use('/api/v1', limiter);
// CORS middleware(to handle cross-origin requests.)
const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Authorization', 'Content-Type']
};
app.use((0, cors_1.default)(corsOptions));
// Serve static files from the 'public' folder
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_1.default.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
// Serve static files from the 'uploads' folder
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', (req, res, next) => {
    const ext = path_1.default.extname(req.url);
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        express_1.default.static(path_1.default.join(__dirname, 'uploads'))(req, res, next);
    }
    else {
        res.status(403).send('Access denied');
    }
});
// Routes Declarations
app.use('/api/v1', servicesRoutes_1.default);
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static('build'));
}
const PORT = process.env.PORT || 1337;
// Start the HTTPS server
const httpServer = http_1.default.createServer(app);
(req, res, next) => {
    res.writeHead(200);
    res.setHeader('Content-Type', 'application/javascript');
    next();
};
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
const host = '0.0.0.0';
httpServer.listen({ port: PORT, host }, () => {
    console.log(`HTTPS Server running on port ${PORT}...`);
});
