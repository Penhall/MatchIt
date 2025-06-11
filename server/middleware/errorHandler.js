// server/middleware/errorHandler.js
import { isDevelopment } from "../config/environment.js";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(err.message, {
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
