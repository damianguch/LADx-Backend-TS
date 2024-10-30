// redisClient.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://red-csh5vv5umphs7386efkg:6379'
  //   socket: {
  //     host: 'localhost',
  //     port: 6379
  //   }
});

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (error) =>
  console.error('Redis connection error:', error.message)
);

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;
