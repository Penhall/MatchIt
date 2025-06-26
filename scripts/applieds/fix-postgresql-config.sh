# scripts/fix-postgresql-config.sh - Correção completa da configuração PostgreSQL
#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações do banco (do usuário)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
DB_PASSWORD="matchit123"
DATABASE_URL="postgresql://matchit:matchit123@localhost:5432/matchit_db"

print_header() {
    echo ""
    echo -e "${CYAN}=====================================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}=====================================================${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se PostgreSQL está rodando
check_postgresql() {
    print_header "🔍 VERIFICANDO POSTGRESQL"
    
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER &> /dev/null; then
            print_status "PostgreSQL está rodando e acessível"
        else
            print_error "PostgreSQL não está respondendo com as credenciais fornecidas"
            print_info "Verificando conectividade básica..."
            
            if pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
                print_warning "PostgreSQL está rodando, mas há problema com usuário/banco"
            else
                print_error "PostgreSQL não está rodando em $DB_HOST:$DB_PORT"
                exit 1
            fi
        fi
    else
        print_warning "pg_isready não encontrado, testando com psql..."
        
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
            print_status "PostgreSQL está rodando e acessível"
        else
            print_error "Não foi possível conectar ao PostgreSQL"
            print_info "Verifique se o PostgreSQL está rodando e as credenciais estão corretas"
            exit 1
        fi
    fi
}

# Testar conexão com banco
test_database_connection() {
    print_header "🔌 TESTANDO CONEXÃO COM BANCO DE DADOS"
    
    print_info "Testando conexão com:"
    print_info "  Host: $DB_HOST"
    print_info "  Port: $DB_PORT"
    print_info "  Database: $DB_NAME"
    print_info "  User: $DB_USER"
    
    # Teste simples de conexão
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" &> /dev/null; then
        print_status "Conexão bem-sucedida!"
        
        # Obter versão do PostgreSQL
        local pg_version
        pg_version=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT version();" 2>/dev/null | head -1 | sed 's/^ *//')
        print_info "Versão: $pg_version"
        
    else
        print_error "Falha na conexão com banco de dados"
        print_info "Verificando se banco e usuário existem..."
        
        # Tentar como superusuário se possível
        if command -v sudo &> /dev/null; then
            print_info "Tentando verificar como superusuário..."
            
            # Verificar se usuário existe
            local user_exists
            user_exists=$(sudo -u postgres psql -t -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" 2>/dev/null | tr -d ' \n')
            
            if [ "$user_exists" = "1" ]; then
                print_status "Usuário $DB_USER existe"
            else
                print_warning "Usuário $DB_USER não existe"
                print_info "Criando usuário..."
                sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
                sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
                print_status "Usuário $DB_USER criado"
            fi
            
            # Verificar se banco existe
            local db_exists
            db_exists=$(sudo -u postgres psql -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null | tr -d ' \n')
            
            if [ "$db_exists" = "1" ]; then
                print_status "Banco $DB_NAME existe"
            else
                print_warning "Banco $DB_NAME não existe"
                print_info "Criando banco..."
                sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
                print_status "Banco $DB_NAME criado"
            fi
            
            # Conceder permissões
            sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
            print_status "Permissões concedidas"
        else
            print_error "Não foi possível verificar/criar usuário e banco automaticamente"
            print_info "Execute manualmente como superusuário PostgreSQL:"
            print_info "  CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
            print_info "  CREATE DATABASE $DB_NAME OWNER $DB_USER;"
            print_info "  GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
            exit 1
        fi
    fi
}

# Verificar/criar variáveis de ambiente
setup_environment() {
    print_header "⚙️ CONFIGURANDO VARIÁVEIS DE AMBIENTE"
    
    # Verificar se arquivo .env existe
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado, criando..."
        touch .env
    fi
    
    # Função para atualizar ou adicionar variável
    update_env_var() {
        local var_name="$1"
        local var_value="$2"
        
        if grep -q "^$var_name=" .env; then
            # Atualizar variável existente
            sed -i "s|^$var_name=.*|$var_name=$var_value|" .env
            print_status "Atualizado: $var_name"
        else
            # Adicionar nova variável
            echo "$var_name=$var_value" >> .env
            print_status "Adicionado: $var_name"
        fi
    }
    
    # Configurar todas as variáveis necessárias
    update_env_var "DATABASE_URL" "$DATABASE_URL"
    update_env_var "DB_HOST" "$DB_HOST"
    update_env_var "DB_PORT" "$DB_PORT"
    update_env_var "DB_NAME" "$DB_NAME"
    update_env_var "DB_USER" "$DB_USER"
    update_env_var "DB_PASSWORD" "$DB_PASSWORD"
    
    # JWT Secret se não existir
    if ! grep -q "^JWT_SECRET=" .env; then
        local jwt_secret
        jwt_secret=$(openssl rand -base64 32 2>/dev/null || echo "super-secret-jwt-key-$(date +%s)")
        update_env_var "JWT_SECRET" "$jwt_secret"
    fi
    
    # Node Environment se não existir
    if ! grep -q "^NODE_ENV=" .env; then
        update_env_var "NODE_ENV" "development"
    fi
    
    print_status "Variáveis de ambiente configuradas"
}

# Criar arquivo de configuração de database corrigido
create_database_config() {
    print_header "📝 CRIANDO CONFIGURAÇÃO DE DATABASE"
    
    # Backup do arquivo existente se houver
    if [ -f "server/config/database.js" ]; then
        cp "server/config/database.js" "server/config/database.js.backup.$(date +%Y%m%d_%H%M%S)"
        print_info "Backup criado do arquivo de configuração existente"
    fi
    
    # Criar diretório se não existir
    mkdir -p server/config
    
    # Criar arquivo de configuração
    cat > server/config/database.js << 'EOF'
// server/config/database.js - Configuração do PostgreSQL corrigida
require('dotenv').config();
const { Pool } = require('pg');

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

console.log('🗄️ Configuração do banco:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: '***', // não mostrar senha nos logs
  ssl: dbConfig.ssl
});

// Criar pool de conexões
const pool = new Pool(dbConfig);

// Event listeners para o pool
pool.on('connect', (client) => {
  console.log('✅ Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro no pool de conexões PostgreSQL:', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  console.log('🔄 Conexão removida do pool');
});

// Função para testar conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    const currentTime = result.rows[0].now;
    const version = result.rows[0].version;
    client.release();
    
    console.log('✅ Conexão com banco de dados bem-sucedida');
    console.log('🕐 Hora do servidor:', currentTime);
    console.log('📊 Versão PostgreSQL:', version.split(' ').slice(0, 2).join(' '));
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return false;
  }
};

// Função para executar queries com log e retry
const query = async (text, params, retries = 3) => {
  const start = Date.now();
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Query executada:', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          params: params ? params.length : 0,
          rows: result.rows.length,
          duration: `${duration}ms`,
          attempt: attempt > 1 ? attempt : undefined
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Erro na query (tentativa ${attempt}/${retries}):`, {
        error: error.message,
        code: error.code,
        query: text.substring(0, 100)
      });
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError;
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
    throw error;
  } finally {
    client.release();
  }
};

// Testar conexão na inicialização
testConnection().catch(error => {
  console.error('💥 Falha crítica na conexão inicial com banco de dados');
  process.exit(1);
});

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
EOF

    print_status "Arquivo server/config/database.js criado"
}

# Verificar e criar tabelas necessárias
setup_database_tables() {
    print_header "📋 CONFIGURANDO TABELAS DO BANCO DE DADOS"
    
    # Criar arquivo SQL com todas as tabelas necessárias
    cat > setup_tables.sql << 'EOF'
-- Criar tabelas necessárias para o sistema MatchIt

-- Tabela de usuários (se não existir)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de preferências de estilo
CREATE TABLE IF NOT EXISTS style_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    location JSONB,
    photos JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    style_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_style_preferences_user_id ON style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_style_preferences_category ON style_preferences(category);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Inserir dados de teste se não existirem
DO $$
BEGIN
    -- Verificar se já existem dados de teste
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'teste@matchit.com') THEN
        -- Inserir usuário de teste
        INSERT INTO users (id, email, password_hash, name, date_of_birth) VALUES 
        ('test-user-123', 'teste@matchit.com', '$2b$10$example.hash', 'Usuário Teste', '1990-01-01');
        
        -- Inserir perfil de teste
        INSERT INTO user_profiles (user_id, bio, location) VALUES 
        ('test-user-123', 'Perfil de teste para desenvolvimento', '{"city": "São Paulo", "state": "SP"}');
        
        -- Inserir algumas preferências de teste
        INSERT INTO style_preferences (user_id, category, question_id, selected_option) VALUES 
        ('test-user-123', 'cores', 'color_preference', 'warm'),
        ('test-user-123', 'estilo', 'style_preference', 'casual');
        
        RAISE NOTICE 'Dados de teste inseridos com sucesso';
    ELSE
        RAISE NOTICE 'Dados de teste já existem';
    END IF;
END $$;

-- Verificar estrutura das tabelas
\dt
\di

-- Contar registros
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'style_preferences' as tabela, COUNT(*) as registros FROM style_preferences
UNION ALL
SELECT 'user_profiles' as tabela, COUNT(*) as registros FROM user_profiles;
EOF

    print_info "Executando setup das tabelas..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f setup_tables.sql; then
        print_status "Tabelas configuradas com sucesso"
    else
        print_error "Erro ao configurar tabelas"
        print_info "Execute manualmente: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f setup_tables.sql"
        return 1
    fi
    
    # Limpar arquivo temporário
    rm -f setup_tables.sql
}

# Corrigir rotas para usar configuração correta
fix_profile_routes() {
    print_header "🔧 CORRIGINDO ROTAS DE PERFIL"
    
    # Backup se existir
    if [ -f "server/routes/profile.js" ]; then
        cp "server/routes/profile.js" "server/routes/profile.js.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Criar diretório se não existir
    mkdir -p server/routes
    
    # Criar arquivo de rotas corrigido
    cat > server/routes/profile.js << 'EOF'
// server/routes/profile.js - Rotas de Perfil com PostgreSQL
const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Importar configuração de banco
let db;
try {
  const database = require('../config/database');
  db = database;
  console.log('✅ Configuração de banco carregada em profile routes');
} catch (error) {
  console.error('❌ Erro ao carregar configuração de banco:', error);
  process.exit(1);
}

// Importar middleware de autenticação
let authenticateToken;
try {
  const authMiddleware = require('../middleware/auth');
  authenticateToken = authMiddleware.authenticateToken;
  console.log('✅ Middleware de autenticação carregado');
} catch (error) {
  console.warn('⚠️ Middleware de autenticação não encontrado, usando fallback');
  authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }
    // Mock simples para desenvolvimento
    req.user = { 
      userId: 'test-user-123', 
      id: 'test-user-123',
      email: 'teste@matchit.com' 
    };
    next();
  };
}

/**
 * GET /api/profile
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    console.log('📥 GET /api/profile - userId:', userId);
    
    // Buscar perfil do usuário
    const result = await db.query(
      `SELECT u.id, u.name, u.email, up.bio, up.location, up.preferences
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences || {},
        profileCompletion: 75
      }
    });
    
  } catch (error) {
    console.error('❌ Erro em GET /api/profile:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/profile/style-preferences
 */
router.get('/style-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    console.log('📥 GET /api/profile/style-preferences - userId:', userId);
    
    const result = await db.query(
      `SELECT category, question_id, selected_option, created_at, updated_at 
       FROM style_preferences 
       WHERE user_id = $1 
       ORDER BY category, question_id`,
      [userId]
    );
    
    // Organizar por categoria
    const preferences = {};
    result.rows.forEach(row => {
      if (!preferences[row.category]) {
        preferences[row.category] = {};
      }
      preferences[row.category][row.question_id] = {
        selectedOption: row.selected_option,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    res.json({
      success: true,
      data: {
        userId,
        preferences,
        totalCategories: Object.keys(preferences).length,
        totalPreferences: result.rows.length,
        lastUpdated: result.rows.length > 0 ? Math.max(...result.rows.map(r => new Date(r.updated_at))) : null
      }
    });
    
  } catch (error) {
    console.error('❌ Erro em GET /api/profile/style-preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar preferências de estilo',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * PUT /api/profile/style-preferences
 */
router.put('/style-preferences', authenticateToken, [
  body('category').notEmpty().withMessage('Categoria é obrigatória'),
  body('questionId').notEmpty().withMessage('ID da questão é obrigatório'),
  body('selectedOption').notEmpty().withMessage('Opção selecionada é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }
    
    const userId = req.user?.userId || req.user?.id;
    const { category, questionId, selectedOption } = req.body;
    
    console.log('📥 PUT /api/profile/style-preferences:', {
      userId, category, questionId, selectedOption
    });
    
    const result = await db.query(
      `INSERT INTO style_preferences (user_id, category, question_id, selected_option, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, category, question_id)
       DO UPDATE SET 
         selected_option = EXCLUDED.selected_option,
         updated_at = NOW()
       RETURNING *`,
      [userId, category, questionId, selectedOption]
    );
    
    res.json({
      success: true,
      message: 'Preferência de estilo atualizada com sucesso',
      data: {
        id: result.rows[0].id,
        category,
        questionId,
        selectedOption,
        updatedAt: result.rows[0].updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Erro em PUT /api/profile/style-preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar preferência de estilo',
      code: 'UPDATE_ERROR',
      details: error.message
    });
  }
});

/**
 * PATCH /api/profile/style-preferences/:category
 */
router.patch('/style-preferences/:category', authenticateToken, [
  body('questionId').notEmpty().withMessage('ID da questão é obrigatório'),
  body('selectedOption').notEmpty().withMessage('Opção selecionada é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }
    
    const userId = req.user?.userId || req.user?.id;
    const { category } = req.params;
    const { questionId, selectedOption } = req.body;
    
    console.log('📥 PATCH /api/profile/style-preferences/:category:', {
      userId, category, questionId, selectedOption
    });
    
    const result = await db.query(
      `INSERT INTO style_preferences (user_id, category, question_id, selected_option, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, category, question_id)
       DO UPDATE SET 
         selected_option = EXCLUDED.selected_option,
         updated_at = NOW()
       RETURNING *`,
      [userId, category, questionId, selectedOption]
    );
    
    res.json({
      success: true,
      message: `Preferência da categoria ${category} atualizada com sucesso`,
      data: {
        id: result.rows[0].id,
        category,
        questionId,
        selectedOption,
        updatedAt: result.rows[0].updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Erro em PATCH /api/profile/style-preferences/:category:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar categoria de estilo',
      code: 'UPDATE_CATEGORY_ERROR',
      details: error.message
    });
  }
});

/**
 * DELETE /api/profile/style-preferences
 */
router.delete('/style-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    console.log('📥 DELETE /api/profile/style-preferences - userId:', userId);
    
    const result = await db.query(
      'DELETE FROM style_preferences WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Todas as preferências de estilo foram removidas',
      data: {
        deletedCount: result.rowCount || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erro em DELETE /api/profile/style-preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover preferências de estilo',
      code: 'DELETE_ERROR',
      details: error.message
    });
  }
});

module.exports = router;
EOF

    print_status "Rotas de perfil corrigidas"
}

# Testar configuração completa
test_complete_setup() {
    print_header "🧪 TESTANDO CONFIGURAÇÃO COMPLETA"
    
    # Verificar se servidor está rodando
    if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        print_warning "Servidor não está rodando"
        print_info "Inicie o servidor com: npm run dev"
        print_info "Então execute este teste novamente com: $0 test"
        return 1
    fi
    
    print_status "Servidor está rodando"
    
    # Testar endpoints básicos
    print_info "Testando endpoint de health..."
    if curl -s http://localhost:3001/api/health | grep -q "healthy"; then
        print_status "Health check - OK"
    else
        print_error "Health check - FALHOU"
    fi
    
    # Tentar registrar usuário
    print_info "Testando registro de usuário..."
    local test_email="test.$(date +%s)@matchit.test"
    local register_response
    
    register_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_email\",\"password\":\"Test123!\",\"name\":\"Test User\"}" \
        http://localhost:3001/api/auth/register 2>/dev/null)
    
    if echo "$register_response" | grep -q "token"; then
        print_status "Registro de usuário - OK"
        
        # Extrair token
        local token
        if command -v jq &> /dev/null; then
            token=$(echo "$register_response" | jq -r '.token' 2>/dev/null)
        else
            token=$(echo "$register_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
        fi
        
        if [ -n "$token" ] && [ "$token" != "null" ]; then
            print_status "Token obtido com sucesso"
            
            # Testar endpoints de perfil
            print_info "Testando endpoints de perfil..."
            
            if curl -s -H "Authorization: Bearer $token" \
                http://localhost:3001/api/profile | grep -q "success"; then
                print_status "GET /api/profile - OK"
            else
                print_error "GET /api/profile - FALHOU"
            fi
            
            if curl -s -H "Authorization: Bearer $token" \
                http://localhost:3001/api/profile/style-preferences | grep -q "success"; then
                print_status "GET /api/profile/style-preferences - OK"
            else
                print_error "GET /api/profile/style-preferences - FALHOU"
            fi
            
            if curl -s -X PUT \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d '{"category":"test","questionId":"test_q1","selectedOption":"test_option"}' \
                http://localhost:3001/api/profile/style-preferences | grep -q "success"; then
                print_status "PUT /api/profile/style-preferences - OK"
            else
                print_error "PUT /api/profile/style-preferences - FALHOU"
            fi
            
        else
            print_error "Falha ao extrair token"
        fi
    else
        print_error "Registro de usuário - FALHOU"
        print_info "Response: $register_response"
    fi
}

# Função principal
main() {
    print_header "🚀 CORREÇÃO COMPLETA DA CONFIGURAÇÃO POSTGRESQL"
    print_info "Configurando sistema para usar:"
    print_info "  Database: $DB_NAME"
    print_info "  User: $DB_USER"
    print_info "  Host: $DB_HOST:$DB_PORT"
    
    # Executar todas as correções
    check_postgresql
    test_database_connection
    setup_environment
    create_database_config
    setup_database_tables
    fix_profile_routes
    
    print_header "✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO"
    print_info "Próximos passos:"
    echo ""
    print_info "1. Reinicie o servidor:"
    print_info "   npm run dev"
    echo ""
    print_info "2. Execute o teste completo:"
    print_info "   $0 test"
    echo ""
    print_info "3. Ou execute o teste da Fase 0:"
    print_info "   ./scripts/test-phase0-integration.sh"
    echo ""
    
    if [ "$1" = "test" ]; then
        echo ""
        test_complete_setup
    fi
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Script de Correção Completa da Configuração PostgreSQL"
    echo ""
    echo "Uso: $0 [test]"
    echo ""
    echo "Este script configura completamente o sistema para usar PostgreSQL:"
    echo "  • Verifica conectividade com PostgreSQL"
    echo "  • Cria usuário e banco se necessário"
    echo "  • Configura variáveis de ambiente"
    echo "  • Cria arquivo de configuração de database"
    echo "  • Cria/verifica tabelas necessárias"
    echo "  • Corrige rotas de perfil"
    echo "  • Testa configuração completa"
    echo ""
    echo "Credenciais usadas:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    echo "Argumentos:"
    echo "  test    - Executa testes após configuração"
    echo ""
    exit 0
fi

# Executar função principal
main "$@"