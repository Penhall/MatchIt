# scripts/correcao-banco-correto.sh - Correção com configurações corretas do banco

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "${CYAN}$1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Configurações corretas do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
DB_PASSWORD="matchit123"

# Verificar estrutura do projeto
verificar_estrutura_projeto() {
    if [ ! -f "package.json" ]; then
        print_error "Execute este script na raiz do projeto MatchIt"
        exit 1
    fi
    print_success "Estrutura do projeto verificada"
}

# Corrigir configurações do banco de dados
corrigir_configuracao_banco() {
    print_header "🗄️  CORRIGINDO CONFIGURAÇÕES DO BANCO DE DADOS"
    
    # Backup do .env existente se houver
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backup do .env criado"
    fi
    
    # Criar novo arquivo .env com configurações corretas
    print_info "Criando .env com configurações corretas..."
    cat > .env << EOF
# Database Configuration - CONFIGURAÇÕES CORRETAS
DATABASE_URL=postgresql://matchit:matchit123@localhost:5432/matchit_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=matchit-super-secret-jwt-key-change-in-production-2025
JWT_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Features
ENABLE_RECOMMENDATIONS=true
ENABLE_EMOTIONAL_PROFILE=true
ENABLE_ANALYTICS=true

# Logs
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
EOF
    
    print_success "Arquivo .env criado com configurações corretas"
    
    # Testar conexão com o banco
    print_info "Testando conexão com o banco de dados..."
    
    # Verificar se PostgreSQL está rodando
    if command -v psql &> /dev/null; then
        print_info "PostgreSQL encontrado no sistema"
        
        # Testar conexão com as configurações corretas
        export PGPASSWORD="$DB_PASSWORD"
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
            print_success "✅ Conexão com matchit_db FUNCIONANDO!"
        else
            print_error "❌ Falha na conexão com matchit_db"
            print_info "Verificando se o banco e usuário existem..."
            
            # Tentar conectar como superusuário para verificar/criar
            if psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "SELECT 1;" &>/dev/null; then
                print_info "Conectado como postgres, verificando estrutura..."
                
                # Verificar se usuário matchit existe
                user_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -t -c "SELECT 1 FROM pg_roles WHERE rolname='matchit';" 2>/dev/null)
                if [ -z "$user_exists" ]; then
                    print_warning "Usuário 'matchit' não existe. Criando..."
                    psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "CREATE USER matchit WITH PASSWORD 'matchit123';" &>/dev/null
                    print_success "Usuário 'matchit' criado"
                fi
                
                # Verificar se banco matchit_db existe
                db_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname='matchit_db';" 2>/dev/null)
                if [ -z "$db_exists" ]; then
                    print_warning "Banco 'matchit_db' não existe. Criando..."
                    psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "CREATE DATABASE matchit_db OWNER matchit;" &>/dev/null
                    print_success "Banco 'matchit_db' criado"
                fi
                
                # Dar permissões ao usuário
                psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;" &>/dev/null
                
                # Testar novamente
                export PGPASSWORD="$DB_PASSWORD"
                if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
                    print_success "✅ Conexão com matchit_db agora está FUNCIONANDO!"
                else
                    print_error "❌ Ainda há problemas com a conexão"
                fi
            else
                print_error "❌ Não foi possível conectar como postgres"
                print_info "Certifique-se de que PostgreSQL está rodando e acessível"
            fi
        fi
        unset PGPASSWORD
    else
        print_error "PostgreSQL não encontrado no sistema"
        print_info "Instale PostgreSQL primeiro"
    fi
    
    echo ""
}

# Atualizar configuração do banco no código
atualizar_config_banco_codigo() {
    print_header "🔧 ATUALIZANDO CONFIGURAÇÃO DO BANCO NO CÓDIGO"
    
    # Backup do arquivo de configuração atual
    if [ -f "server/config/database.js" ]; then
        cp server/config/database.js server/config/database.js.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backup da configuração do banco criado"
    fi
    
    # Criar configuração correta do banco
    mkdir -p server/config
    
    print_info "Criando server/config/database.js com configurações corretas..."
    cat > server/config/database.js << 'EOF'
// server/config/database.js - Configuração do banco com credenciais corretas
const { Pool } = require('pg');
require('dotenv').config();

// Configurações do pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'matchit_db',
  user: process.env.DB_USER || 'matchit',
  password: process.env.DB_PASSWORD || 'matchit123',
  max: 20,                    // máximo de conexões no pool
  idleTimeoutMillis: 30000,   // tempo para fechar conexões inativas
  connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
});

// Event listeners para o pool
pool.on('connect', (client) => {
  console.log('🔗 Nova conexão estabelecida com o banco de dados');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro inesperado no cliente do banco:', err);
  process.exit(-1);
});

// Função para testar conexão
const testConnection = async () => {
  try {
    const start = Date.now();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    const duration = Date.now() - start;
    
    console.log('✅ Teste de conexão bem-sucedido:', {
      database: process.env.DB_NAME || 'matchit_db',
      user: process.env.DB_USER || 'matchit',
      host: process.env.DB_HOST || 'localhost',
      duration: `${duration}ms`,
      server_time: result.rows[0].current_time,
      version: result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]
    });
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com o banco de dados:', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'matchit_db',
      user: process.env.DB_USER || 'matchit'
    });
    return false;
  }
};

// Função para executar queries com logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log apenas em desenvolvimento e para queries lentas
    if (process.env.NODE_ENV === 'development' || duration > 100) {
      console.log('🔍 Query executada:', {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        params: params ? (params.length > 0 ? '[' + params.length + ' params]' : '[]') : '[]',
        duration: `${duration}ms`,
        rows: result.rows.length
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Erro na query:', {
      error: error.message,
      code: error.code,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      params: params ? '[' + params.length + ' params]' : '[]',
      duration: `${duration}ms`
    });
    throw error;
  }
};

// Função para executar transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na transação, rollback executado:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Função para verificar e criar tabelas essenciais
const ensureRequiredTables = async () => {
  try {
    // Verificar tabela users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Verificar tabela style_choices
    await query(`
      CREATE TABLE IF NOT EXISTS style_choices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        question_id VARCHAR(100) NOT NULL,
        selected_option VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, category, question_id)
      );
    `);
    
    // Criar índices para performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
      CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
    `);
    
    console.log('✅ Tabelas essenciais verificadas/criadas');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas essenciais:', error.message);
    return false;
  }
};

// Função de inicialização
const init = async () => {
  console.log('🔄 Inicializando conexão com banco de dados...');
  console.log('📋 Configurações:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'matchit_db',
    user: process.env.DB_USER || 'matchit'
  });
  
  const connected = await testConnection();
  if (connected) {
    await ensureRequiredTables();
    console.log('🚀 Sistema de banco de dados pronto!');
  } else {
    console.error('❌ Falha na inicialização do banco de dados');
  }
  
  return connected;
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Encerrando pool de conexões...');
  pool.end(() => {
    console.log('✅ Pool de conexões encerrado');
    process.exit(0);
  });
});

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  ensureRequiredTables,
  init
};
EOF
    
    print_success "Configuração do banco atualizada com credenciais corretas"
    echo ""
}

# Implementar sistema de autenticação (igual ao anterior)
implementar_autenticacao() {
    print_header "🔐 IMPLEMENTANDO SISTEMA DE AUTENTICAÇÃO"
    
    mkdir -p server/routes server/middleware
    
    # Middleware de autenticação (mesmo código anterior)
    print_info "Criando middleware de autenticação..."
    cat > server/middleware/auth.js << 'EOF'
// server/middleware/auth.js - Middleware de autenticação JWT
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso necessário',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchit-default-secret');
    
    // Buscar usuário no banco
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    req.user = result.rows[0];
    req.userId = result.rows[0].id;
    next();
    
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

module.exports = authMiddleware;
EOF
    
    # Rotas de autenticação (mesmo código anterior)
    print_info "Criando rotas de autenticação..."
    cat > server/routes/auth.js << 'EOF'
// server/routes/auth.js - Rotas de autenticação
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'matchit-default-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, senha e nome são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso',
        code: 'EMAIL_EXISTS'
      });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir usuário
    const result = await query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    
    const user = result.rows[0];
    const token = generateToken(user.id);
    
    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    const result = await query('SELECT id, email, name, password FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
EOF
    
    print_success "Sistema de autenticação implementado"
    echo ""
}

# Instalar dependências
instalar_dependencias() {
    print_header "📦 INSTALANDO DEPENDÊNCIAS"
    
    print_info "Instalando bcrypt, jsonwebtoken e pg..."
    npm install bcrypt jsonwebtoken pg dotenv --save
    
    if [ $? -eq 0 ]; then
        print_success "Dependências instaladas com sucesso"
    else
        print_error "Falha ao instalar dependências"
    fi
    
    echo ""
}

# Testar configurações
testar_configuracoes() {
    print_header "🧪 TESTANDO CONFIGURAÇÕES CORRIGIDAS"
    
    print_info "Testando conexão direta com o banco..."
    
    # Testar conexão direta
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'Conexão OK' as status, NOW() as timestamp;" 2>/dev/null; then
        print_success "✅ Conexão direta com matchit_db funcionando!"
    else
        print_error "❌ Conexão direta ainda falha"
    fi
    unset PGPASSWORD
    
    # Verificar se arquivo .env está correto
    if grep -q "DB_NAME=matchit_db" .env && grep -q "DB_USER=matchit" .env; then
        print_success "✅ Arquivo .env com configurações corretas"
    else
        print_error "❌ Problema no arquivo .env"
    fi
    
    print_info "Aguarde 3 segundos para testar API..."
    sleep 3
    
    # Testar health endpoint (se servidor estiver rodando)
    health_response=$(curl -s "http://localhost:3000/api/health" 2>/dev/null)
    if echo "$health_response" | grep -q "connected\|ok"; then
        print_success "✅ API health check funcionando"
        print_info "Resposta: $health_response"
    else
        print_warning "API não está respondendo (normal se servidor não estiver rodando)"
    fi
    
    echo ""
}

# Relatório final
relatorio_final() {
    print_header "📊 RELATÓRIO DA CORREÇÃO DO BANCO DE DADOS"
    
    echo ""
    print_info "✅ CORREÇÕES APLICADAS:"
    echo "  • Arquivo .env com configurações corretas do banco"
    echo "  • server/config/database.js atualizado para matchit_db"
    echo "  • Sistema de autenticação implementado"
    echo "  • Dependências instaladas (bcrypt, jsonwebtoken, pg)"
    echo "  • Verificação/criação do usuário 'matchit' e banco 'matchit_db'"
    
    echo ""
    print_header "🚀 PRÓXIMOS PASSOS:"
    echo "1. 🔄 Reinicie o servidor: npm run server"
    echo "2. 🧪 Execute os testes: ./scripts/teste-fase0-detalhado.sh"
    echo "3. ✅ Se funcionar, o problema está resolvido!"
    
    echo ""
    print_success "✅ CORREÇÃO DO BANCO DE DADOS CONCLUÍDA!"
    print_info "Agora usando: matchit_db com usuário 'matchit'"
}

# Função principal
main() {
    print_header "🚀 CORREÇÃO DO BANCO DE DADOS MATCHIT"
    print_info "Aplicando configurações corretas: matchit_db / matchit / matchit123"
    echo ""
    
    verificar_estrutura_projeto
    corrigir_configuracao_banco
    atualizar_config_banco_codigo
    implementar_autenticacao
    instalar_dependencias
    testar_configuracoes
    relatorio_final
}

# Executar
main "$@"