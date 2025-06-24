// server/middleware/logger.js
import { isDevelopment } from "../config/environment.js";

const requestLogger = (req, res, next) => {
  if (isDevelopment()) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
};

const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
      }
    });
    next();
  };
};

// Novo objeto logger com métodos info, warn e error
const logger = {
  info: (message, ...args) => {
    if (isDevelopment()) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (isDevelopment()) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }
};

export { requestLogger, timeoutMiddleware, logger };
