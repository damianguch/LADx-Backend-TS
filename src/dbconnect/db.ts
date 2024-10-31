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
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  });

// Connection object to communicate with database
const db = mongoose.connection;

export default db;
