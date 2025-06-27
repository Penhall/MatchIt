// server/config/database.js - Configuração do banco PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

// Configuração do pool de conexões
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'matchit_db',
    user: process.env.DB_USER || 'matchit',
    password: process.env.DB_PASSWORD || 'matchit123',
    max: 20, // máximo de conexões
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.on('connect', () => {
    console.log('📊 Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro no pool PostgreSQL:', err);
});

// Função helper para queries
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`🔍 Query executada: ${duration}ms`);
        return res;
    } catch (error) {
        console.error('❌ Erro na query:', error);
        throw error;
    }
};

// Função para testar conectividade
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as timestamp, version() as version');
        console.log('✅ Banco conectado:', result.rows[0].timestamp);
        return true;
    } catch (error) {
        console.error('❌ Falha na conexão:', error.message);
        return false;
    }
};

export default pool;
