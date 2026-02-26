const winston = require('winston');

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Create logger
const logger = winston.createLogger({
    level: 'debug', // Set the minimum level of messages to log
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        logFormat
    ),
    transports: [
        new winston.transports.Console(), // Log to the console
        new winston.transports.File({ filename: 'combined.log' }), // Log to a file
        new winston.transports.File({ filename: 'error.log', level: 'error' }) // Log errors to a separate file
    ],
});

module.exports = { logger };
