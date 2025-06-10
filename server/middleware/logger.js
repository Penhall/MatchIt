// server/middleware/logger.js - Request logging middleware
import { isDevelopment } from '../config/environment.js';

const requestLogger = (req, res, next) => {
  if (isDevelopment()) {
    const start = Date.now();
    
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
      console.log('Body:', sanitizedBody);
    }
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
  }
  next();
};

const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ 
          error: 'Request timeout',
          code: 'TIMEOUT'
        });
      }
    });
    next();
  };
};

export { requestLogger, timeoutMiddleware };
