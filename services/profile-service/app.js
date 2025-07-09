const express = require('express')
const cors = require('cors')


const app = express()

app.use(cors())

app.use(express.json)

//! Start Server
const profileService = require('./routes/profileRoutes')
app.use('/api/profile', profileService)

const PORT = process.env.PORT || 3002
const HOST = process.env.HOST || localhost

connectDB.then(() => {
    app.listen(PORT, HOST, () => {
        console.log('Profile Service running on port ', PORT)
    })
})