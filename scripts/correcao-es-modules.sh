# scripts/correcao-es-modules.sh - Corrigir conflito ES Modules vs CommonJS

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

# Verificar estrutura do projeto
verificar_estrutura() {
    if [ ! -f "package.json" ]; then
        print_error "Execute este script na raiz do projeto MatchIt"
        exit 1
    fi
    print_success "Estrutura do projeto verificada"
    
    # Verificar se é ES module
    if grep -q '"type": "module"' package.json; then
        print_warning "Projeto configurado como ES module"
        print_info "Vamos converter tudo para ES modules (import/export)"
    else
        print_info "Projeto configurado como CommonJS"
    fi
}

# Criar configuração do banco de dados em ES modules
criar_config_banco_es() {
    print_header "🗄️  CRIANDO CONFIGURAÇÃO DO BANCO (ES MODULES)"
    
    mkdir -p server/config
    
    # Backup se existir
    if [ -f "server/config/database.js" ]; then
        cp server/config/database.js server/config/database.js.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backup criado"
    fi
    
    print_info "Criando server/config/database.js (ES modules)..."
    cat > server/config/database.js << 'EOF'
// server/config/database.js - Configuração do banco (ES Modules)
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configurações do pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'matchit_db',
  user: process.env.DB_USER || 'matchit',
  password: process.env.DB_PASSWORD || 'matchit123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners
pool.on('connect', () => {
  console.log('🔗 Nova conexão com banco estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro no cliente do banco:', err);
  process.exit(-1);
});

// Função para testar conexão
export const testConnection = async () => {
  try {
    const start = Date.now();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    const duration = Date.now() - start;
    
    console.log('✅ Conexão com banco bem-sucedida:', {
      database: process.env.DB_NAME || 'matchit_db',
      user: process.env.DB_USER || 'matchit',
      host: process.env.DB_HOST || 'localhost',
      duration: `${duration}ms`,
      server_time: result.rows[0].current_time
    });
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão:', {
      error: error.message,
      code: error.code,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'matchit_db',
      user: process.env.DB_USER || 'matchit'
    });
    return false;
  }
};

// Função para executar queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development' || duration > 100) {
      console.log('🔍 Query executada:', {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        duration: `${duration}ms`,
        rows: result.rows.length
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Erro na query:', {
      error: error.message,
      text: text.substring(0, 100),
      duration: `${duration}ms`
    });
    throw error;
  }
};

// Função para transações
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na transação:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Função para criar tabelas essenciais
export const ensureRequiredTables = async () => {
  try {
    // Tabela users
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
    
    // Tabela style_choices
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
    
    // Índices
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
    `);
    
    console.log('✅ Tabelas essenciais verificadas/criadas');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    return false;
  }
};

// Inicialização
export const init = async () => {
  console.log('🔄 Inicializando conexão com banco...');
  console.log('📋 Configurações:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'matchit_db',
    user: process.env.DB_USER || 'matchit'
  });
  
  const connected = await testConnection();
  if (connected) {
    await ensureRequiredTables();
    console.log('🚀 Sistema de banco pronto!');
  }
  
  return connected;
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Encerrando pool de conexões...');
  pool.end(() => {
    console.log('✅ Pool encerrado');
    process.exit(0);
  });
});

export { pool };
export default { pool, query, transaction, testConnection, ensureRequiredTables, init };
EOF
    
    print_success "Configuração do banco criada (ES modules)"
    echo ""
}

# Criar middleware de autenticação em ES modules
criar_middleware_auth_es() {
    print_header "🔐 CRIANDO MIDDLEWARE DE AUTENTICAÇÃO (ES MODULES)"
    
    mkdir -p server/middleware
    
    print_info "Criando server/middleware/auth.js (ES modules)..."
    cat > server/middleware/auth.js << 'EOF'
// server/middleware/auth.js - Middleware de autenticação (ES Modules)
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

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

export default authMiddleware;
EOF
    
    print_success "Middleware de autenticação criado (ES modules)"
    echo ""
}

# Criar rotas de autenticação em ES modules
criar_rotas_auth_es() {
    print_header "📋 CRIANDO ROTAS DE AUTENTICAÇÃO (ES MODULES)"
    
    mkdir -p server/routes
    
    print_info "Criando server/routes/auth.js (ES modules)..."
    cat > server/routes/auth.js << 'EOF'
// server/routes/auth.js - Rotas de autenticação (ES Modules)
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

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

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token necessário',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchit-default-secret');
    
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
});

export default router;
EOF
    
    print_success "Rotas de autenticação criadas (ES modules)"
    echo ""
}

# Modificar server/app.js para importar as rotas reais
modificar_app_js() {
    print_header "🔧 MODIFICANDO SERVER/APP.JS PARA USAR ROTAS REAIS"
    
    # Backup
    cp server/app.js server/app.js.backup.$(date +%Y%m%d_%H%M%S)
    print_info "Backup criado: server/app.js.backup.*"
    
    # Verificar se já tem as importações
    if grep -q "import.*auth.*from.*./routes/auth.js" server/app.js; then
        print_warning "Importações já existem, corrigindo..."
    fi
    
    # Criar versão corrigida do app.js
    print_info "Adicionando importações corretas ao server/app.js..."
    
    # Vamos adicionar as importações no início do arquivo, depois das importações existentes
    sed -i '/^import.*express/a\
\
// =====================================================\
// IMPORTAÇÕES REAIS (não mocks)\
// =====================================================\
import authRoutes from '\''./routes/auth.js'\'';\
import authMiddleware from '\''./middleware/auth.js'\'';\
import database from '\''./config/database.js'\'';' server/app.js
    
    # Adicionar as rotas reais logo após a configuração do middleware básico
    sed -i '/✅ Middleware básico configurado/a\
\
// =====================================================\
// ROTAS DE AUTENTICAÇÃO REAIS\
// =====================================================\
app.use('\''/api/auth'\'', authRoutes);\
console.log(logger.info('\''✅ Rotas de autenticação carregadas'\''));\
\
// Middleware de autenticação para rotas protegidas\
app.use('\''/api/profile'\'', authMiddleware);\
console.log(logger.info('\''✅ Middleware de autenticação aplicado'\''));' server/app.js
    
    # Inicializar banco de dados
    sed -i '/🚀 Iniciando processo de startup/a\
\
// Inicializar banco de dados\
try {\
  await database.init();\
  console.log(logger.info('\''✅ Banco de dados inicializado'\''));\
} catch (error) {\
  console.log(logger.error(`❌ Erro ao inicializar banco: ${error.message}`));\
}' server/app.js
    
    print_success "server/app.js modificado para usar rotas reais"
    echo ""
}

# Testar sintaxe dos arquivos ES modules
testar_sintaxe() {
    print_header "🧪 TESTANDO SINTAXE DOS ARQUIVOS ES MODULES"
    
    files=(
        "server/config/database.js"
        "server/middleware/auth.js"
        "server/routes/auth.js"
        "server/app.js"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_info "Testando sintaxe: $file"
            if node --check "$file" 2>/dev/null; then
                print_success "✅ $file - sintaxe OK"
            else
                print_error "❌ $file - erro de sintaxe"
                echo "Detalhes do erro:"
                node --check "$file"
                exit 1
            fi
        else
            print_warning "⚠️ $file não encontrado"
        fi
    done
    
    echo ""
}

# Verificar se .env está correto
verificar_env() {
    print_header "🔧 VERIFICANDO ARQUIVO .ENV"
    
    if [ -f ".env" ]; then
        if grep -q "DB_NAME=matchit_db" .env && grep -q "DB_USER=matchit" .env; then
            print_success "Configurações do banco corretas no .env"
        else
            print_warning "Corrigindo .env..."
            sed -i 's/DB_NAME=.*/DB_NAME=matchit_db/' .env
            sed -i 's/DB_USER=.*/DB_USER=matchit/' .env
            sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=matchit123/' .env
            print_success ".env corrigido"
        fi
    else
        print_warning "Criando arquivo .env..."
        cat > .env << 'EOF'
# Database Configuration
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
JWT_SECRET=matchit-super-secret-jwt-key-2025
JWT_EXPIRES_IN=7d
EOF
        print_success ".env criado"
    fi
    
    echo ""
}

# Relatório final
relatorio_final() {
    print_header "📊 RELATÓRIO DA CORREÇÃO ES MODULES"
    
    echo ""
    print_info "✅ CONVERSÃO PARA ES MODULES CONCLUÍDA:"
    echo "  • server/config/database.js (ES modules)"
    echo "  • server/middleware/auth.js (ES modules)"
    echo "  • server/routes/auth.js (ES modules)"
    echo "  • server/app.js modificado para usar rotas reais"
    echo "  • Arquivo .env verificado/corrigido"
    echo "  • Sintaxe de todos os arquivos validada"
    
    echo ""
    print_header "🚀 PRÓXIMOS PASSOS:"
    echo "1. 🔄 REINICIE O SERVIDOR: npm run server"
    echo "2. 🔍 Verifique se os logs mostram:"
    echo "   ✅ 'Banco de dados inicializado'"
    echo "   ✅ 'Rotas de autenticação carregadas'"
    echo "   ❌ Sem mensagens de 'Mock criado'"
    echo "3. 🧪 Execute o teste: ./scripts/teste-fase0-detalhado.sh"
    echo "4. ✅ Registrar usuário deve funcionar!"
    
    echo ""
    print_success "✅ CORREÇÃO ES MODULES CONCLUÍDA!"
    print_info "Sistema agora deve usar banco e autenticação reais (não mocks)"
}

# Função principal
main() {
    print_header "🚀 CORREÇÃO ES MODULES - SISTEMA REAL"
    print_info "Convertendo para ES modules e removendo mocks"
    echo ""
    
    verificar_estrutura
    verificar_env
    criar_config_banco_es
    criar_middleware_auth_es
    criar_rotas_auth_es
    modificar_app_js
    testar_sintaxe
    relatorio_final
}

# Executar
main "$@"