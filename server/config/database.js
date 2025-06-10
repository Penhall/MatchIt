// server/config/database.js - Configuração do PostgreSQL
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do pool de conexões
const pool = new Pool({
  user: process.env.DB_USER || 'matchit',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'matchit_db',
  password: process.env.DB_PASSWORD || 'matchit123',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false,
});

// Eventos do pool
pool.on('connect', () => {
  console.log('✅ Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na conexão PostgreSQL:', err);
});

// Função de conexão com retry
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Conectado ao PostgreSQL com sucesso');
      console.log(`📊 Host: ${process.env.DB_HOST || 'localhost'}`);
      console.log(`🔌 Port: ${process.env.DB_PORT || 5432}`);
      client.release();
      return;
    } catch (err) {
      console.error(`❌ Tentativa ${i + 1} de conexão falhou:`, err.message);
      if (i === retries - 1) {
        console.error('💀 Não foi possível conectar ao banco após várias tentativas');
        throw err;
      }
      console.log(`⏳ Aguardando ${delay/1000}s antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Função de inicialização do banco
const initializeDatabase = async () => {
  try {
    await connectWithRetry();
    console.log('🗄️ Database inicializado com sucesso');
  } catch (error) {
    console.error('❌ Falha ao inicializar database:', error);
    throw error;
  }
};

export { pool, initializeDatabase };

// =====================================================

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
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  };
};

const configureCors = () => {
  return cors(getCorsOptions());
};

export { configureCors, getCorsOptions };

// =====================================================

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
    secret: process.env.JWT_SECRET || 'secret',
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
    enableChatMessages: process.env.ENABLE_CHAT !== 'false'
  }
};

// Validar configurações essenciais
const validateConfig = () => {
  const required = [
    'database.host',
    'database.user', 
    'database.password',
    'database.name'
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
