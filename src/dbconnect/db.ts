import mongoose from 'mongoose';
import logger from '../logger/logger';

mongoose
  .connect(process.env.DB_CONNECTION!)
  .then(() =>
    logger.success(`Connected to database!`, {
      timestamp: new Date().toISOString()
    })
  )
  .catch((error) => {
    logger.error(`Database connection error: ${error.message}`, {
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  });

// Connection object to communicate with database
const db = mongoose.connection;

export default db;
