import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
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
  origin: 'https://ladx-frontend.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
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

// Apply initial middleware
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SECRET_KEY));
app.use(morgan('common'));

// Session Configuration
app.use(
  session({
    store: new RedisStore({
      client: redisClient
    }),
    secret: process.env.SECRET_KEY!,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000 // 10 minutes
    }
  })
);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:']
      }
    }
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message:
    'Too many password reset attempts, please try again after 15 minutes.'
});

// Apply rate limit to password reset
app.use('/api/v1/forgot-password', resetLimiter);

app.use('/api/v1', limiter);

// Routes
app.use('/api/v1', router);
app.use('/api/v1', authRouter);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({
    status: 'E00',
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  });
});

// Server setup
const PORT = process.env.PORT || 1337;
const server = http.createServer(app);

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

const host: string = '0.0.0.0';

// Start server
server.listen({ port: PORT, host }, () => {
  logger.info(`Server running on port ${PORT}...`, {
    timestamp: new Date().toISOString()
  });
});
