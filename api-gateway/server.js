// api-gateway/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const kafkaClient = require('./kafka/kafkaClient');
const redisClient = require('./redis/redisClient');
const logger = require('./utils/logger');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Initialize Kafka
kafkaClient.init();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Common proxy options
const createProxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  pathRewrite: { [`^/api/${serviceName}`]: '' }, // Adjust based on your service structure
  timeout: 10000,
  proxyTimeout: 10000,
  onError: (err, req, res) => {
    logger.error(`Proxy error for ${serviceName}:`, err.message);
    res.status(502).json({
      error: 'Service temporarily unavailable',
      service: serviceName,
      message: 'The requested service is not responding'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`${serviceName} request: ${req.method} ${req.originalUrl}`);
    
    // Send event to Kafka
    kafkaClient.sendEvent(`${serviceName}-requests`, {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userId: req.user?.id
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`${serviceName} response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
  }
});

// Auth routes - no authentication needed for login/register
app.use('/api/auth', createProxyMiddleware({
  ...createProxyOptions('http://auth-service:3000', 'auth'),
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Auth request: ${req.method} ${req.originalUrl}`);
    
    // Send event to Kafka
    kafkaClient.sendEvent('auth-requests', {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
  }
}));

// Protected routes - require authentication
app.use('/api/products', authMiddleware, createProxyMiddleware({
  ...createProxyOptions('http://product-service:3001', 'products'),
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Product request: ${req.method} ${req.originalUrl}`);
    
    kafkaClient.sendEvent('product-requests', {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    // Add user context to request headers
    proxyReq.setHeader('X-User-Id', req.user?.id);
    proxyReq.setHeader('X-User-Role', req.user?.role);
  }
}));

app.use('/api/cart', authMiddleware, createProxyMiddleware({
  ...createProxyOptions('http://cart-service:3002', 'cart'),
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Cart request: ${req.method} ${req.originalUrl}`);
    
    kafkaClient.sendEvent('cart-requests', {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    // Add user context to request headers
    proxyReq.setHeader('X-User-Id', req.user?.id);
  }
}));

app.use('/api/profile', authMiddleware, createProxyMiddleware({
  ...createProxyOptions('http://profile-service:3003', 'profile'),
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Profile request: ${req.method} ${req.originalUrl}`);
    
    kafkaClient.sendEvent('profile-requests', {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    proxyReq.setHeader('X-User-Id', req.user?.id);
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await kafkaClient.disconnect();
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await kafkaClient.disconnect();
  await redisClient.disconnect();
  process.exit(0);
});