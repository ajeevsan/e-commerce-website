require('dotenv').config();
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

// Middleware
app.use(cors({
    origin: ['http://localhost:5173',
        'http://172.20.10.2:5173'],
    credentials: true
}))
// app.use(cors())
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
