import { Pool } from 'pg';

const poolConfig = {
  user: 'matchit',
  host: 'localhost',
  database: 'matchit_db',
  password: 'matchit123',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Teste de conexão básica
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conexão com o PostgreSQL estabelecida'))
  .catch(err => console.error('❌ Erro ao conectar ao PostgreSQL:', err));