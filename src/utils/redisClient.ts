import { createClient } from 'redis';
import logger from '../logger/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Redis retry attempts exhausted');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis Connection Error:', error);
    process.exit(1);
  }
};

export default redisClient;
