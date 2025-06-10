// server/config/cors.js - CORS configuration
import cors from 'cors';
import { config } from './environment.js';

const configureCors = () => {
  const corsOptions = {
    origin: config.cors.allowedOrigins,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: true,
    maxAge: 86400
  };

  return cors(corsOptions);
};

export { configureCors };
