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
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ladx.africa',
        'https://www.ladx.africa',
      ]
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['set-cookie']
};

// Initialize Redis and Session store
const RedisSessionStore = new RedisStore({ 
  client: redisClient,
  prefix: "ladx_session:",
  ttl: 60 * 60 // 1 hour
});

// Initialize Redis client
(async () => {
  try {
    await connectRedis();
    logger.info('Redis client connected successfully');
    
    // Keep Redis connection alive
    setInterval(async () => {
      if (redisClient.isOpen) {
        await redisClient.ping();
      }
    }, 30000);
  } catch (error) {
    logger.error('Redis connection error:', error);
    process.exit(1);
  }
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
      client: redisClient,
      prefix: "ladx:",
      ttl: 60 * 10 // 10 minutes
    }),
    secret: process.env.SECRET_KEY!,
    name: 'ladx.sid',
    resave: true, // Changed to true
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    }
  })
);

// Add session debugging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    next();
  });
}

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
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL!, 'https://ladx-backend-ts.onrender.com'],
        upgradeInsecureRequests: null
      }
    }
  })
);

// Session check middleware
app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    logger.error('Session middleware not properly initialized');
    return res.status(500).json({
      status: 'E00',
      success: false,
      message: 'Internal server error'
    });
  }
  next();
});

// Development logging
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug({
      sessionId: req.sessionID,
      session: req.session,
      cookies: req.cookies
    });
    next();
  });
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/v1', limiter);

// Routes
app.use('/api/v1', router);
app.use('/api/v1', authRouter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV,
    redis: redisClient.isOpen ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({
    status: 'E00',
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Server setup
const PORT = process.env.PORT || 1337;
const server = http.createServer(app);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    try {
      await redisClient.quit();
      await db.close();
      logger.info('Server shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
