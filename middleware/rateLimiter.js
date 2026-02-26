const rateLimit = require('express-rate-limit');

// Function to get client IP address from request
const getClientIp = (req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);
    return ip;

};

// Create an IP rate limiter
const apiLimiter = rateLimit({
    windowMs: 60*1000*15, // 15 minutes
    max:100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    keyGenerator: (req) => getClientIp(req) // Use IP address to identify the client
});

module.exports = apiLimiter;
