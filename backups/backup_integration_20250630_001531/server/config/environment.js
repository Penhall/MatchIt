// server/config/environment.js - Configuração de ambiente
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const config = {
  // Servidor
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'matchit',
    password: process.env.DB_PASSWORD || 'matchit123',
    name: process.env.DB_NAME || 'matchit_db'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET, // Removido o valor padrão para forçar o uso do .env
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  
  // Logs
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Features
  features: {
    enableRecommendations: process.env.ENABLE_RECOMMENDATIONS !== 'false',
    enableVipSubscription: process.env.ENABLE_VIP !== 'false',
    enableChatMessages: process.env.ENABLE_CHAT !== 'false',
    enableStats: process.env.ENABLE_STATS !== 'false'
  },
  
  // CORS
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }
};

// Validar configurações essenciais
const validateConfig = () => {
  const required = [
    'database.host',
    'database.user', 
    'database.password',
    'database.name',
    'jwt.secret' // Agora é obrigatório vir do ambiente
  ];
  
  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value;
  });
  
  if (missing.length > 0) {
    throw new Error(`Configurações obrigatórias não encontradas: ${missing.join(', ')}`);
  }
  
  console.log('✅ Configurações validadas com sucesso');
};

// Função para obter configuração
const getConfig = () => config;

// Função para verificar se está em produção
const isProduction = () => config.nodeEnv === 'production';

// Função para verificar se está em desenvolvimento
const isDevelopment = () => config.nodeEnv === 'development';

export { 
  config, 
  getConfig, 
  validateConfig, 
  isProduction, 
  isDevelopment 
};
