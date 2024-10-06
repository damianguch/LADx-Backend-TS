const mongoose = require('mongoose');

const CONNECTION_STRING = process.env.DB_CONNECT;
const MONGO_URL = `${CONNECTION_STRING}`;

mongoose
  .connect(MONGO_URL)
  .then(() => console.log('Connected to database!'))
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

// Connection object to communicate with mongodb
// Provides methods and events to monitor and control the database
const db = mongoose.connection;

module.exports = db;
