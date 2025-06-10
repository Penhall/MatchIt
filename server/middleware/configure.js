// server/middleware/configure.js - Main middleware configuration
import express from 'express';
import { configureCors } from '../config/cors.js';
import { requestLogger, timeoutMiddleware } from './logger.js';
import { isDevelopment } from '../config/environment.js';

export { isDevelopment };

const configureMiddleware = (app) => {
  // Basic middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS
  app.use(configureCors());
  
  // Timeout
  app.use(timeoutMiddleware(30000));
  
  // Logging (development only)
  if (isDevelopment()) {
    app.use(requestLogger);
  }
  
  console.log('✅ Middleware configured');
};

export default configureMiddleware;
