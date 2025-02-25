const rateLimit = require('express-rate-limit');

// General rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'Please try again after 15 minutes'
    }
});

// Authentication rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again after 15 minutes'
    }
});

module.exports = { apiLimiter, authLimiter };
