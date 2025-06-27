#!/bin/bash
# fix-database.sh - Correção rápida da configuração do banco de dados

echo "🔧 CORRIGINDO CONFIGURAÇÃO DO BANCO DE DADOS"
echo "=============================================="

# Criar diretórios necessários
mkdir -p server/config

# Criar arquivo de configuração do banco
echo "📁 Criando server/config/database.js..."

cat > server/config/database.js << 'EOF'
// server/config/database.js - Configuração PostgreSQL com ES Modules
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('🗄️ Carregando configuração do banco de dados...');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'matchit_db',
    user: process.env.DB_USER || 'matchit',
    password: process.env.DB_PASSWORD || 'matchit123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🔧 Configuração do banco:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: '***'
});

export const pool = new Pool(dbConfig);

pool.on('connect', () => {
    console.log('✅ Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
    console.error('❌ Erro no pool PostgreSQL:', err.message);
});

export const testConnection = async () => {
    try {
        console.log('🔍 Testando conexão...');
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        console.log('✅ Banco conectado:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        return false;
    }
};

export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (duration > 100) {
            console.log(`🔍 Query: ${duration}ms`);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
        throw error;
    }
};

testConnection();

export default pool;
EOF

echo "✅ database.js criado!"

# Verificar se as dependências estão instaladas
echo "📦 Verificando dependências..."

# Função para verificar se pacote está instalado
check_package() {
    if npm list "$1" &> /dev/null; then
        echo "✅ $1 está instalado"
        return 0
    else
        echo "❌ $1 NÃO está instalado"
        return 1
    fi
}

# Lista de dependências necessárias
DEPS_MISSING=0

if ! check_package "pg"; then
    DEPS_MISSING=1
fi

if ! check_package "dotenv"; then
    DEPS_MISSING=1
fi

if ! check_package "express"; then
    DEPS_MISSING=1
fi

if ! check_package "cors"; then
    DEPS_MISSING=1
fi

# Instalar dependências faltantes
if [ $DEPS_MISSING -eq 1 ]; then
    echo ""
    echo "📦 Instalando dependências faltantes..."
    npm install pg dotenv express cors
    echo "✅ Dependências instaladas!"
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "📄 Criando arquivo .env..."
    cat > .env << 'EOF'
# Configurações do banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Configurações do servidor
NODE_ENV=development
PORT=3000
EOF
    echo "✅ .env criado!"
fi

# Teste rápido
echo ""
echo "🧪 Testando configuração..."

node -e "
import('./server/config/database.js')
  .then(db => {
    console.log('✅ Import do database funcionando!');
    console.log('✅ Pool exportado:', typeof db.pool);
    console.log('✅ Configuração correta!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro no teste:', err.message);
    process.exit(1);
  });
" && echo "🎉 Configuração do banco OK!" || echo "⚠️ Ainda há problemas na configuração"

echo ""
echo "=============================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "🚀 Agora tente novamente:"
echo "   npm run server"
echo ""
echo "📡 Se funcionar, teste:"
echo "   curl http://localhost:3000/api/health"
echo "=============================================="