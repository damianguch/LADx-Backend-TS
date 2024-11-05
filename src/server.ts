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

// Use Helmet for various security headers
app.use(helmet());

app.use(
  helmet({
    xContentTypeOptions: false // Disables 'X-Content-Type-Options: nosniff'
  })
);

// Enforce HTTPS using Helmet HSTS middleware
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true, // Apply to all subdomains
    preload: true
  })
);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'https: data:'],
      'script-src': ["'self'", 'https: data'],
      'style-src': ["'self'", 'https:']
    }
  })
);

app.use(cookieParser());
// Log App activities on console
app.use(morgan('common'));
//For parsing application/x-www-form-urlencoded data
app.use(express.urlencoded({ extended: true }));
// Middleware to parse the request body as JSON data
app.use(express.json());
// Configure the session middleware
app.use(
  session({
    // session data will be stored in Redis
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET_KEY!,
    resave: false,
    saveUninitialized: true,
    rolling: false, // Reset session expiration on each request
    cookie: {
      secure: process.env.NODE_ENV === 'production' ? true : false,
      maxAge: 60 * 60 * 1000,
      sameSite: 'none'
    }
  })
);

// Trust the first proxy
app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { trustProxy: false } // Disable the trust proxy check
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message:
    'Too many password reset attempts, please try again after 15 minutes.'
});

// Apply rate limit to password reset
app.use('/api/v1/forgot-password', resetLimiter);

// Apply rate limit to all requests
app.use('/api/v1', limiter);

// CORS middleware(to handle cross-origin requests.)
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));

// Serve static files from the 'public' folder
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

// Serve static files from the 'uploads' folder
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  const ext = path.extname(req.url);
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else {
    res.status(403).send('Access denied');
  }
});

// Routes Declarations
app.use('/api/v1', router);
app.use('/api/v1', authRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
}

const PORT = process.env.PORT || 1337;

// Start the HTTPS server
const httpServer = http.createServer(app);

(req: Request, res: Response, next: NextFunction) => {
  res.writeHead(200);
  res.setHeader('Content-Type', 'application/javascript');
  next();
};

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

httpServer.listen({ port: PORT, host }, () => {
  logger.info(`HTTPS Server running on port ${PORT}...`, {
    timestamp: new Date().toISOString()
  });
});
