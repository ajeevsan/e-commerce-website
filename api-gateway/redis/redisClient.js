const redis = require('redis');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });
    
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });
  }

  async connect() {
    await this.client.connect();
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, expireIn = 3600) {
    try {
      await this.client.setEx(key, expireIn, value);
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  }

  async disconnect() {
    await this.client.disconnect();
    logger.info('Redis client disconnected');
  }
}

module.exports = new RedisClient();