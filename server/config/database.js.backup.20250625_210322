// server/config/database.js - Configuração do PostgreSQL
import { Pool } from 'pg';

// Configuração do pool de conexões
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
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
