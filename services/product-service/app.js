require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const connectDB = require('./config/db')

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

const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || 'localhost'

connectDB().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`Product Service is running on ${HOST}:${PORT}`)
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
})
//! graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully')
    process.exit(0)
})