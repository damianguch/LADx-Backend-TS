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
import { createClient } from 'redis';
import db from './dbconnect/db';
const app: Application = express();

import router from './routes/servicesRoutes';

const redisClient = createClient({
  url: 'redis://localhost:6379',
  socket: {
    host: 'localhost', // Or Redis server IP
    port: 6379 // Default Redis port
  }
});

redisClient
  .connect()
  .then(() => console.log('Connected to redis!'))
  .catch((error: Error) => console.error(error.message));

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

// Configure the session middleware
app.use(
  session({
    // session data will be stored in Redis
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET_KEY!,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  })
);

// Augment express-session with a custom SessionData object
declare module 'express-session' {
  interface SessionData {
    email: string;
    otpData: {
      hashedOTP: string;
      expiresAt: number;
    };
    tempUser: {
      fullname: string;
      email: string;
      phone: string | null;
      country: string;
      state: string;
      password: string;
    };
  }
}

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
    'Too many password reset requests, please try again after 15 minutes.'
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

app.use(cors(corsOptions));

// Log App activities on console
app.use(morgan('common'));
// Middleware to parse the request body as JSON data
app.use(express.json());
//For parsing application/x-www-form-urlencoded data
app.use(express.urlencoded({ extended: true }));
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
  console.log(`HTTPS Server running on port ${PORT}...`);
});
