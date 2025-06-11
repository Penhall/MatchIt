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

export { requestLogger, timeoutMiddleware };
