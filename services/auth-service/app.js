require('dotenv').config();
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

// Middleware
app.use(cors({
    origin: ['http://192.168.126.1:5173'],
    credentials: true
}))
app.use(express.json())

//! Your Routes
const authRoutes = require('./routes/authRoutes')
app.use('/api/auth', authRoutes)

//Start Server
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || localhost
connectDB().then(() => {
    app.listen(PORT, HOST, () => {
        console.log('Auth Service running on port ', PORT)
    })
})
