import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import session from 'express-session';
import RedisStore from 'connect-redis';
import db from './dbconnect/db';
import router from './routes/servicesRoutes';
import redisClient, { connectRedis } from './utils/redisClient';
import logger from './logger/logger';
import { authRouter } from './routes/authRoutes';

const app: Application = express();

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
(async () => {
  await connectRedis();

  // Keep Redis connection alive
  setInterval(async () => {
    if (redisClient.isOpen) {
      await redisClient.ping();
    }
  }, 6000); // Ping every 60 seconds
})();

// Trust the first proxy
app.set('trust proxy', true);

// Apply CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Add specific headers for authentication and cookies
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && corsOptions.origin.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

// Combined Helmet Configuration
app.use(
  helmet({
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
  })
);

// Basic middleware
app.use(cookieParser());
app.use(morgan('common'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Configuration
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET_KEY!,
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
  })
);

// Rate Limiters
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message:
    'Too many password reset attempts, please try again after 15 minutes.'
});

app.use('/api/v1/forgot-password', resetLimiter);
app.use('/api/v1', limiter);

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  express.static('public', {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  })
);

// Upload Handler
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  const ext = path.extname(req.url);
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else {
    res.status(403).send('Access denied');
  }
});

// Routes
app.use('/api/v1', router);
app.use('/api/v1', authRouter);

// Production static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
}

// Server Setup
const PORT = process.env.PORT || 1337;
const host: string = '0.0.0.0';
const httpServer = http.createServer(app);

// Graceful Shutdown
process.on('SIGINT', async () => {
  try {
    await db.close();
    console.log('Connection to db closed by application termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Start Server
httpServer.listen({ port: PORT, host }, () => {
  logger.info(`Server running on port ${PORT}...`, {
    timestamp: new Date().toISOString()
  });
});
