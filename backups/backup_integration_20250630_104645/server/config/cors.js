// server/config/cors.js - Configuração do CORS
import cors from 'cors';

const getCorsOptions = () => {
  const origins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : process.env.NODE_ENV === 'production' 
      ? ['http://localhost', 'http://localhost:80', 'http://frontend'] 
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];

  return {
    origin: origins,
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