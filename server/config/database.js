// server/config/database.js - Configuração do PostgreSQL (ESM)
import pg from 'pg';
const { Pool } = pg;

// Configurações do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'matchit_db',
  user: process.env.DB_USER || 'matchit',
  password: process.env.DB_PASSWORD || 'matchit123',
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões ociosas
  connectionTimeoutMillis: 2000, // tempo limite para conectar
};

console.log('🗄️ Configuração do banco:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: '***' // não mostrar senha nos logs
});

// Criar pool de conexões
export const pool = new Pool(dbConfig); // Exportar pool diretamente

// Event listeners para o pool
pool.on('connect', () => {
  console.log('✅ Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexões PostgreSQL:', err);
});

pool.on('remove', () => {
  console.log('🔄 Conexão removida do pool');
});

// Função para testar conexão
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    const currentTime = result.rows[0].now;
    client.release();
    
    console.log('✅ Conexão com banco de dados bem-sucedida');
    console.log('🕐 Hora do servidor:', currentTime);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error.message);
    return false;
  }
};

// Função para executar queries com log
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query executada:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rows.length
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro na query:', {
      text: text.substring(0, 100),
      error: error.message,
      duration: `${Date.now() - start}ms`
    });
    throw error;
  }
};

// Função para executar transações
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Função para verificar se tabelas existem
export const checkTables = async () => {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log('📋 Tabelas encontradas:', tables);
    
    // Verificar tabelas essenciais
    const requiredTables = ['users'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('⚠️ Tabelas obrigatórias faltando:', missingTables);
      console.log('💡 Execute as migrações para criar as tabelas');
    } else {
      console.log('✅ Todas as tabelas essenciais encontradas');
    }
    
    return tables;
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
    return [];
  }
};

// Função para criar tabela de usuários básica se não existir
export const ensureUsersTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Criar índice no email se não existir
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    
    console.log('✅ Tabela users verificada/criada');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabela users:', error.message);
    return false;
  }
};

// Inicialização automática
export const init = async () => {
  console.log('🔄 Inicializando conexão com banco de dados...');
  
  const connected = await testConnection();
  if (connected) {
    await checkTables();
    await ensureUsersTable();
  }
  
  return connected;
};

// Exportar funcionalidades (remover pool da exportação padrão)
export default {
  query,
  transaction,
  testConnection,
  checkTables,
  ensureUsersTable,
  init
};
