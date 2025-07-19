const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient({
    url: `redis://default:${process.env.REDIS_KEY}@redis-17708.c245.us-east-1-3.ec2.redns.redis-cloud.com:17708`
});

// Set up error handling before connecting
redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis Cloud');
});

redisClient.on('disconnect', () => {
    console.log('Redis disconnected');
});

redisClient.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

const connectRedis = async () => {
    try {
        // Connect to Redis
        await redisClient.connect();
        console.log('Redis connection established successfully');
        
    } catch (error) {
        console.error('Failed to connect to Redis:', error.message);
        throw error; // Re-throw to be handled by the calling function
    }
};

module.exports = { redisClient, connectRedis };