import { createClient } from 'redis';
import logger from '../logger/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('connect', () =>
  logger.info(`Connected to redis`, {
    timestamp: new Date().toISOString()
  })
);
redisClient.on('error', (error) =>
  logger.error(`Redis connection error, ${error.message}`, {
    timestamp: new Date().toISOString()
  })
);

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;
