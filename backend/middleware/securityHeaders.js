const helmet = require('helmet');

const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'cdnjs.cloudflare.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: 'same-origin' },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true
});

module.exports = securityHeaders;
