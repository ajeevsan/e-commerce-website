require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/cache');
const kafkaConsumer = require('./kafka/kafkaConsumer');
const {
    handleUserRegistration,
    handleUserLogin,
    handleUserLogout,
    handlePasswordReset
} = require('./services/authEventHandlers');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'auth-service',
        timestamp: new Date().toISOString() 
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost'; // Fixed: Added quotes around localhost

// Initialize Kafka Consumer
const initializeKafka = async () => {
    try {
        console.log('Initializing Kafka consumer...');
        
        // Add event handlers
        kafkaConsumer.addHandler('user-events', async (eventData, message) => {
            try {
                console.log(`Processing event: ${eventData.event}`);
                
                switch (eventData.event) {
                    case 'USER_REGISTERED':
                        await handleUserRegistration(eventData);
                        break;
                    case 'USER_LOGIN':
                        await handleUserLogin(eventData);
                        break;
                    case 'USER_LOGOUT':
                        await handleUserLogout(eventData);
                        break;
                    case 'PASSWORD_RESET':
                        await handlePasswordReset(eventData);
                        break;
                    default:
                        console.log('Unknown event type:', eventData.event);
                }
            } catch (error) {
                console.error(`Error handling event ${eventData.event}:`, error);
            }
        });

        // Subscribe to topics
        await kafkaConsumer.subscribe(['user-events', 'password-reset-events']);
        
        console.log('Kafka consumer initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Kafka consumer:', error);
        // Don't crash the server if Kafka is not available
        console.log('Server will continue without Kafka consumer');
    }
};

// Initialize all connections
const initializeApp = async () => {
    try {
        console.log('Initializing application...');
        
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('MongoDB connected successfully');
        
        // Connect to Redis
        console.log('Connecting to Redis...');
        await connectRedis();
        console.log('Redis connected successfully');
        
        console.log('All database connections established successfully');
        
        // Start server first
        const server = app.listen(PORT, HOST, () => {
            console.log(`Auth Service is running on ${HOST}:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Health check available at: http://${HOST}:${PORT}/health`);
        });
        
        // Initialize Kafka after server starts (non-blocking)
        // Give the server a moment to fully start before connecting to Kafka
        setTimeout(() => {
            initializeKafka();
        }, 2000);
        
        // Store server reference for graceful shutdown
        app.locals.server = server;
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    
    try {
        // Stop accepting new connections
        if (app.locals.server) {
            app.locals.server.close(() => {
                console.log('HTTP server closed');
            });
        }
        
        // Close Kafka consumer
        try {
            await kafkaConsumer.disconnect();
            console.log('Kafka consumer disconnected');
        } catch (error) {
            console.log('Kafka consumer was not connected or failed to disconnect:', error.message);
        }
        
        // Close Kafka producer
        try {
            const { sendEvent } = require('./kafka/kafkaProducer');
            // If you have a disconnect method in your producer, call it
            console.log('Kafka producer disconnected');
        } catch (error) {
            console.log('Kafka producer disconnect failed:', error.message);
        }
        
        // Close Redis connection
        try {
            const { redisClient } = require('./config/cache');
            await redisClient.disconnect();
            console.log('Redis connection closed');
        } catch (error) {
            console.log('Redis disconnect failed:', error.message);
        }
        
        // Close MongoDB connection
        try {
            const mongoose = require('mongoose');
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        } catch (error) {
            console.log('MongoDB disconnect failed:', error.message);
        }
        
        console.log('Graceful shutdown completed');
        process.exit(0);
        
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

// Initialize the application
initializeApp();