// /service/routes/authRoutes.js

const express = require('express')
const router = express.Router()
const { register, login, sendOtp, verifyOtp } = require('../controllers/authController')
const authLimit = require('../middlewares/rateLimiter');
const inputValidate = require('../middlewares/validateInput')

router.post('/register', inputValidate, authLimit, register)
router.post('/login', inputValidate, authLimit, login)
router.post('/send-otp', inputValidate, sendOtp)
router.post('/verify-otp', inputValidate, authLimit, verifyOtp)

module.exports = router;
