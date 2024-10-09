const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();
const db = require('./dbconnect/db');
const app = express();

// Use helmet to set secure HTTP headers
app.use(helmet());

const servicesRoutes = require('./routes/servicesRoutes');

// Middleware to parse the request body (JSON and URL-encoded)
// The request body is parsed before the routes access it
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware(to handle cross-origin requests.)
app.use(cors());

// Routes Declarations
app.use('/api/v1', servicesRoutes);

const PORT = process.env.PORT || 5000;

process.on('SIGINT', async () => {
  try {
    await db.close();
    console.log('Connection to Mongodb closed due to application termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
