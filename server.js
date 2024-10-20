require('dotenv').config();
const express = require('express');
const db = require('./dbconnect/db');
const https = require('https');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();

// Use Helmet for various security headers
app.use(helmet());

app.use(
  helmet({
    contentTypeOptions: false // Disables 'X-Content-Type-Options: nosniff'
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message:
    'Too many password reset requests from this IP, please try again after 15 minutes.'
});

// Apply rate limit to password reset
app.use('/api/v1/forgot-password', resetLimiter);

// Apply rate limit to all requests
app.use('/api/v1', limiter);

// CORS middleware(to handle cross-origin requests.)
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization', 'Content-Type']
};

app.use(cors(corsOptions));

// Log App activities on console
app.use(morgan('common'));

const servicesRoutes = require('./routes/servicesRoutes');

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

app.use('/uploads', (req, res, next) => {
  const ext = path.extname(req.url);
  if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
    express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else {
    res.status(403).send('Access denied');
  }
});

// Routes Declarations
app.use('/api/v1', servicesRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
}

const PORT = process.env.PORT || 1337;

// Path to SSL key and certificate files
const privatekey = fs.readFileSync(
  path.join(__dirname, 'SSL', 'privatekey.pem')
);
const certificate = fs.readFileSync(
  path.join(__dirname, 'SSL', 'certificate.pem')
);

const credentials = {
  key: privatekey,
  cert: certificate
};

// Start the HTTPS server
const httpsServer = https.createServer(credentials, app, (req, res) => {
  res.writeHead(200);
  res.setHeader('Content-Type', 'application/javascript');
});

httpsServer.listen(PORT, () => {
  console.log(`HTTPS Server running on port ${PORT}...`);
});
