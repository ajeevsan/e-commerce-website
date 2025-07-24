// api-gateway/server.js
require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});

app.use(globalLimiter);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Health check for the gateway itself
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Service health check aggregator
app.get('/health/services', async (req, res) => {
    const axios = require('axios');
    const services = [
        { name: 'auth', url: 'http://localhost:3000/health' },
        { name: 'product', url: 'http://localhost:3001/health' },
        { name: 'cart', url: 'http://localhost:3002/health' },
        { name: 'profile', url: 'http://localhost:3003/health' }
    ];

    const healthChecks = await Promise.allSettled(
        services.map(async (service) => {
            try {
                const response = await axios.get(service.url, { timeout: 5000 });
                return {
                    service: service.name,
                    status: 'healthy',
                    responseTime: response.headers['x-response-time'] || 'N/A'
                };
            } catch (error) {
                return {
                    service: service.name,
                    status: 'unhealthy',
                    error: error.message
                };
            }
        })
    );

    const results = healthChecks.map(result => result.value || result.reason);
    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded';

    res.json({
        overall: overallStatus,
        services: results,
        timestamp: new Date().toISOString()
    });
});

// JWT verification middleware (optional - can be used for protected routes)
const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // You can verify the token here or forward it to the auth service
        // For now, we'll just pass it through
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// Proxy configuration for each service
const createServiceProxy = (target, pathRewrite = {}) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
        onError: (err, req, res) => {
            console.error(`Proxy error for ${req.path}:`, err.message);
            res.status(503).json({
                error: 'Service temporarily unavailable',
                message: 'The requested service is currently not responding'
            });
        },
        onProxyReq: (proxyReq, req, res) => {
            // Add gateway headers
            proxyReq.setHeader('X-Gateway-Request-ID', req.id || Date.now());
            proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
        },
        onProxyRes: (proxyRes, req, res) => {
            // Add response headers
            proxyRes.headers['X-Gateway'] = 'api-gateway-v1';
        }
    });
};

// Service routing - Fixed path rewriting
app.use('/api/auth', createServiceProxy('http://localhost:3000/api/auth'));

app.use('/api/products', createServiceProxy('http://localhost:3001/api/products'));

app.use('/api/cart', createServiceProxy('http://localhost:3002/api/cart'));

app.use('/api/profile', createServiceProxy('http://localhost:3003/api/profile'));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        error: 'Internal gateway error',
        message: 'Something went wrong in the API gateway'
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down API Gateway gracefully...`);
    
    server.close(() => {
        console.log('API Gateway shut down complete');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.log('Force closing API Gateway');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const PORT = process.env.GATEWAY_PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Services status: http://localhost:${PORT}/health/services`);
});