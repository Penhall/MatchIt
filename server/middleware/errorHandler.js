// server/middleware/errorHandler.js - Error handling middleware
import { logger } from '../utils/helpers.js';
import { isDevelopment } from '../middleware/configure.js'; // Imported from configure.js

// 404 Not Found handler
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  logger.error(err.message, {
    status: statusCode,
    stack: isDevelopment() ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(statusCode).json({
    message: err.message,
    stack: isDevelopment() ? err.stack : undefined
  });
};
