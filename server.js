require('dotenv').config();
const express = require('express');
const db = require('./dbconnect/db');
const https = require('https');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();

// Use Helmet for various security headers
app.use(helmet());

// Enforce HTTPS using Helmet HSTS middleware
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true, // Apply to all subdomains
    preload: true
  })
);

app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limit to all requests
app.use('/api/v1', limiter);

// CORS middleware(to handle cross-origin requests.)
const corsOptions = {
  origin: '',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Authorization', 'Content-Type']
};
app.use(cors(corsOptions));

// Middleware for CSRF protection
// const csrfProtection = csrf({ cookie: { httpOnly: true, secure: true } });
// app.use(csrfProtection);
// app.use(function (req, res, next) {
//   var token = req.csrfToken();
//   res.cookie('XSRF-TOKEN', token);
//   res.locals.csrfToken = token;
//   next();
// });

// Log App activities on console
app.use(morgan('common'));

const servicesRoutes = require('./routes/servicesRoutes');

// Middleware to parse the request body (JSON and URL-encoded)
// The request body is parsed before the routes access it
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes Declarations
app.use('/api/v1', servicesRoutes);

const PORT = process.env.PORT || 5000;

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
  res.setHeader('Content-Type', 'application/json');
});

httpsServer.listen(PORT, () => {
  console.log(`HTTPS Server running on port ${PORT}...`);
});
