// server/config/database.js - Configuração PostgreSQL para Fase 0 (ES Modules)
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuração do pool de conexões
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

// Criar pool de conexões
const pool = new Pool(dbConfig);

// Log de conexão
pool.on('connect', (client) => {
    console.log('🐘 Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err, client) => {
    console.error('❌ Erro no pool PostgreSQL:', err);
});

// Função para executar queries com log e tratamento de erro
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log apenas para queries lentas (> 100ms) ou em desenvolvimento
        if (duration > 100 || process.env.NODE_ENV === 'development') {
            console.log('🗄️  Database query:', {
                sql: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: res.rowCount || 0
            });
        }
        
        return res;
    } catch (error) {
        console.error('❌ Database query error:', {
            sql: text,
            params,
            error: error.message
        });
        throw error;
    }
};

// Função para obter um cliente específico (para transações)
export const getClient = async () => {
    try {
        const client = await pool.connect();
        return client;
    } catch (error) {
        console.error('❌ Erro ao obter cliente do pool:', error);
        throw error;
    }
};

// Função para testar conexão
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as now, version() as version');
        console.log('✅ Database connection successful:', {
            timestamp: result.rows[0].now,
            version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
        });
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Função para verificar se tabelas necessárias existem
export const checkRequiredTables = async () => {
    const requiredTables = [
        'users',
        'user_style_preferences', 
        'style_choices',
        'user_settings'
    ];
    
    try {
        const result = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY($1)
        `, [requiredTables]);
        
        const existingTables = result.rows.map(row => row.table_name);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            console.warn('⚠️  Tabelas em falta:', missingTables);
            return false;
        }
        
        console.log('✅ Todas as tabelas necessárias existem');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error);
        return false;
    }
};

// Função para executar transação
export const transaction = async (callback) => {
    const client = await getClient();
    
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

// Função para obter estatísticas do banco
export const getDatabaseStats = async () => {
    try {
        const queries = [
            // Contagem de usuários
            "SELECT COUNT(*) as users_count FROM users",
            // Contagem de preferências
            "SELECT COUNT(*) as preferences_count FROM user_style_preferences",
            // Contagem de escolhas
            "SELECT COUNT(*) as choices_count FROM style_choices",
            // Tamanho do banco
            "SELECT pg_size_pretty(pg_database_size(current_database())) as db_size",
            // Conexões ativas
            "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'"
        ];
        
        const results = await Promise.all(queries.map(q => query(q)));
        
        return {
            users: parseInt(results[0].rows[0].users_count),
            preferences: parseInt(results[1].rows[0].preferences_count),
            choices: parseInt(results[2].rows[0].choices_count),
            databaseSize: results[3].rows[0].db_size,
            activeConnections: parseInt(results[4].rows[0].active_connections),
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        return null;
    }
};

// Função para limpeza periódica (para manutenção)
export const cleanup = async () => {
    try {
        // Limpar escolhas antigas (> 6 meses)
        await query(`
            DELETE FROM style_choices 
            WHERE created_at < NOW() - INTERVAL '6 months'
        `);
        
        // Vacuum para otimizar performance
        await query('VACUUM ANALYZE');
        
        console.log('✅ Limpeza do banco concluída');
        
    } catch (error) {
        console.error('❌ Erro na limpeza do banco:', error);
    }
};

// Inicialização
(async () => {
    try {
        // Testar conexão na inicialização
        await testConnection();
        
        // Verificar tabelas necessárias
        await checkRequiredTables();
        
        console.log('🚀 Database module initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize database module:', error);
        process.exit(1);
    }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Encerrando pool de conexões...');
    await pool.end();
    console.log('✅ Pool de conexões encerrado');
    process.exit(0);
});

export default pool;