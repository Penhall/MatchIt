// server/middleware/index.js - Exportações centralizadas de middleware
export { authenticateToken, optionalAuth } from './auth.js';
export { requestLogger, timeoutMiddleware } from './logger.js';
export { notFoundHandler, errorHandler } from './errorHandler.js';
export { 
  validateRequired, 
  validateRegistration, 
  validateLogin,
  validateEmail,
  validatePassword 
} from './validation.js';
export { default as configureMiddleware } from './configure.js';

// Re-export para compatibilidade
export { default as configure } from './configure.js';