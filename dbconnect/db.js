const mongoose = require('mongoose');

mongoose
  .connect(process.env.DB_CONNECTION)
  .then(() => console.log('Connected to database!'))
  .catch((error) => {
    console.error('Database connection error:', error.message);
    process.exit(1);
  });

// Connection object to communicate with database
const db = mongoose.connection;

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

module.exports = db;
