// server/config/environment.js - Environment configuration
import dotenv from 'dotenv';
import { logger } from '../utils/helpers.js';

// Load environment variables
dotenv.config();

// Main configuration object
const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  database: {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'matchit',
    password: process.env.DB_PASSWORD || 'matchit123',
    name: process.env.DB_NAME || 'matchit_db'
  },
  jwtSecret: process.env.JWT_SECRET || 'matchit_secret_key_development',
  features: {
    enableRecommendations: process.env.ENABLE_RECOMMENDATIONS === 'true' || false,
    enableChat: process.env.ENABLE_CHAT === 'true' || true,
    enableStats: process.env.ENABLE_STATS === 'true' || true
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

// Validate required configuration
const validateConfig = () => {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Check if in development mode
const isDevelopment = () => config.nodeEnv === 'development';

// Log configuration on startup
logger.info('✅ Environment configuration loaded');
logger.debug('Environment config:', config);

export { config, validateConfig, isDevelopment };
