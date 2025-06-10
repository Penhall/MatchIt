// server/utils/helpers.js - Utility functions and helpers
import winston from 'winston';

// Configure logger (config will be set later via initLogger)
let logger = winston.createLogger({
  level: 'info', // Default level, will be updated in initLogger
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Force shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Utility to parse JSON safely
const parseJSON = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    logger.error('Failed to parse JSON', { error: err.message });
    return null;
  }
};

// Initialize logger with config
const initLogger = (config) => {
  logger.level = config.nodeEnv === 'development' ? 'debug' : 'info';
};

export { logger, gracefulShutdown, parseJSON, initLogger };
