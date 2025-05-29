require('dotenv').config();
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const authRoutes = require('./routes/authRoutes')

const app = express()

// Middleware
app.use(cors({
    origin: ['http://192.168.0.109:5173'],
    credentials: true
}))
app.use(express.json())

//Routes
app.use('/api/auth', authRoutes)

//Start Server
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || localhost
connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('Auth Service running on port ', PORT)
    })
})
