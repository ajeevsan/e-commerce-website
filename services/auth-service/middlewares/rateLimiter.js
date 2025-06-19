const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 30,                  
    message: 'Too many requests. Please try again after some time.'
});

module.exports = authLimiter;
