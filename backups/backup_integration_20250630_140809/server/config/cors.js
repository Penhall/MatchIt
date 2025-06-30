// server/config/cors.js - CORS permissivo para desenvolvimento
import cors from 'cors';

const getCorsOptions = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Em desenvolvimento, ser bem permissivo
    return {
      origin: true, // Permite qualquer origem
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Authorization'],
      maxAge: 86400
    };
  }
  
  // Em produção, usar lista específica
  const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
  
  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400
  };
};

const configureCors = () => {
  return cors(getCorsOptions());
};

export { configureCors, getCorsOptions };
