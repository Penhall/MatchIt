// server/config/database.js - Configuração PostgreSQL com ES Modules
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🗄️ Carregando configuração do banco de dados...');

// Configurações do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'matchit_db',
    user: process.env.DB_USER || 'matchit',
    password: process.env.DB_PASSWORD || 'matchit123',
    max: 20, // máximo de conexões no pool
    idleTimeoutMillis: 30000, // tempo limite para conexões ociosas
    connectionTimeoutMillis: 5000, // tempo limite para conectar
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Log da configuração (sem senha)
console.log('🔧 Configuração do banco:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: '***',
    max: dbConfig.max
});

// Criar pool de conexões
export const pool = new Pool(dbConfig);

// Event listeners para o pool
pool.on('connect', (client) => {
    console.log('✅ Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err, client) => {
    console.error('❌ Erro no pool PostgreSQL:', err.message);
});

pool.on('remove', (client) => {
    console.log('🔄 Conexão removida do pool');
});

// Função para testar conexão
export const testConnection = async () => {
    try {
        console.log('🔍 Testando conexão com o banco...');
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        const currentTime = result.rows[0].current_time;
        const version = result.rows[0].pg_version;
        client.release();
        
        console.log('✅ Conexão com banco bem-sucedida!');
        console.log('🕐 Hora do servidor:', currentTime);
        console.log('📊 PostgreSQL:', version.split(' ').slice(0, 2).join(' '));
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco:', {
            message: error.message,
            code: error.code,
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            user: dbConfig.user
        });
        return false;
    }
};

// Função para executar queries com logs
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log apenas para queries lentas (> 100ms) ou em desenvolvimento
        if (duration > 100 || process.env.NODE_ENV === 'development') {
            console.log('🔍 Query executada:', {
                text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
                params: params ? params.length : 0,
                rows: result.rows.length,
                duration: `${duration}ms`
            });
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erro na query:', {
            message: error.message,
            code: error.code,
            query: text.substring(0, 100)
        });
        throw error;
    }
};

// Função para finalizar conexões (útil para testes)
export const closePool = async () => {
    try {
        await pool.end();
        console.log('🔒 Pool de conexões fechado');
    } catch (error) {
        console.error('❌ Erro ao fechar pool:', error);
    }
};

// Verificar conexão na inicialização
testConnection().then(connected => {
    if (connected) {
        console.log('🎯 Banco de dados pronto para uso!');
    } else {
        console.error('🚨 Falha na conexão inicial com banco de dados');
    }
});

// Export default para compatibilidade
export default pool;