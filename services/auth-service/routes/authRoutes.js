const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/authController')
const authLimit = require('../middlewares/rateLimiter');
const inputValidate = require('../middlewares/validateInput')

router.post('/register', inputValidate, authLimit, register)
router.post('/login', inputValidate, authLimit, login)

module.exports = router;
