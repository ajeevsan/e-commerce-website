try {
    require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const connectDB = require('./config/db')
const { connectRedis } = require('./config/cache')


const app = express()

app.use(cors())
app.use(express.json());
app.use(helmet())
app.use(compression())

//! body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))


//! routes
const productRoutes = require('./routes/productRoutes')
app.use('/api/products/', productRoutes)

//! request logging middleware
app.use((req, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
})

//! health checks 
app.get('/health', (res) => {
    res.status(200).json({
        success: true,
        message: 'Product service is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

//! Error handling middleware
app.use((err, res) => {
    console.error('Unhandled error ', err)
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        data: null,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})


const PORT = process.env.PORT || 3003
const HOST = process.env.HOST || 'localhost'

// Initialize all connections
const initializeApp = async () => {
    try {
        // Connect to MongoDB
        await connectDB()
        
        // Connect to Redis
        await connectRedis()
        
        console.log('All database connections established successfully')
        
        // Start server after all connections are ready
        app.listen(PORT, HOST, () => {
            console.log(`Cart Service is running on ${HOST}:${PORT}`)
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
        })
        
    } catch (error) {
        console.error('Failed to initialize application:', error)
        process.exit(1)
    }
}

//! Initialize the application
initializeApp()

//! graceful shutdown
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...')
    
    try {
        // Close Redis connection
        const { redisClient } = require('./config/cache')
        await redisClient.disconnect()
        console.log('Redis connection closed')
        
        // Close MongoDB connection
        const mongoose = require('mongoose')
        await mongoose.connection.close()
        console.log('MongoDB connection closed')
        
        process.exit(0)
    } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
    }
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
} catch (error) {
    console.error('product-service-error___', error)
}