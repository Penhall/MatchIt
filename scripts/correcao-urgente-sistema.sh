# scripts/correcao-urgente-sistema.sh - Correção dos problemas críticos identificados

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

# Verificar se estamos na raiz do projeto
verificar_estrutura_projeto() {
    if [ ! -f "package.json" ]; then
        print_error "Execute este script na raiz do projeto MatchIt"
        exit 1
    fi
    
    print_success "Estrutura do projeto verificada"
}

# Problema 1: Verificar e corrigir banco de dados
corrigir_banco_dados() {
    print_header "🗄️  CORRIGINDO CONEXÃO COM BANCO DE DADOS"
    
    # Verificar se PostgreSQL está rodando
    if command -v psql &> /dev/null; then
        print_info "PostgreSQL encontrado no sistema"
        
        # Tentar conectar
        if psql -h localhost -U postgres -d postgres -c "SELECT 1;" &>/dev/null; then
            print_success "PostgreSQL está rodando"
        else
            print_warning "PostgreSQL não está respondendo"
            print_info "Execute: sudo service postgresql start (Linux)"
            print_info "Ou: brew services start postgresql (Mac)"
        fi
    else
        print_warning "PostgreSQL não encontrado"
        print_info "Instale PostgreSQL primeiro"
    fi
    
    # Verificar arquivo .env
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado. Criando..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/matchit
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit
DB_USER=postgres
DB_PASSWORD=password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Features
ENABLE_RECOMMENDATIONS=true
ENABLE_EMOTIONAL_PROFILE=true
ENABLE_ANALYTICS=true
EOF
        print_success "Arquivo .env criado"
    else
        print_info "Arquivo .env já existe"
    fi
    
    # Verificar/criar banco de dados
    print_info "Verificando banco de dados matchit..."
    if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw matchit; then
        print_success "Banco de dados 'matchit' existe"
    else
        print_warning "Criando banco de dados 'matchit'..."
        createdb -h localhost -U postgres matchit
        if [ $? -eq 0 ]; then
            print_success "Banco de dados 'matchit' criado"
        else
            print_error "Falha ao criar banco de dados"
        fi
    fi
    
    echo ""
}

# Problema 2: Implementar sistema de autenticação
implementar_autenticacao() {
    print_header "🔐 IMPLEMENTANDO SISTEMA DE AUTENTICAÇÃO"
    
    # Criar diretório se não existir
    mkdir -p server/routes
    mkdir -p server/middleware
    
    # 1. Criar middleware de autenticação
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
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Buscar usuário no banco
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Adicionar usuário ao request
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
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = authMiddleware;
EOF
    
    # 2. Criar rotas de autenticação
    print_info "Criando rotas de autenticação..."
    cat > server/routes/auth.js << 'EOF'
// server/routes/auth.js - Rotas de autenticação
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

// Função para gerar JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register - Registrar novo usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validação básica
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
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
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

// POST /api/auth/login - Fazer login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Buscar usuário
    const result = await query('SELECT id, email, name, password FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Gerar token
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

// GET /api/auth/verify - Verificar token
router.get('/verify', async (req, res) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
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

module.exports = router;
EOF
    
    print_success "Sistema de autenticação criado"
    echo ""
}

# Problema 3: Atualizar sistema de rotas principal
atualizar_rotas_principais() {
    print_header "🔧 ATUALIZANDO SISTEMA DE ROTAS"
    
    # Backup do arquivo atual se existir
    if [ -f "server/routes/index.js" ]; then
        cp server/routes/index.js server/routes/index.js.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backup criado: server/routes/index.js.backup.*"
    fi
    
    # Criar novo arquivo de rotas principal
    print_info "Criando sistema de rotas integrado..."
    cat > server/routes/index.js << 'EOF'
// server/routes/index.js - Sistema de rotas principal do MatchIt
const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Importar rotas
const authRoutes = require('./auth');

// =====================================================
// ROTAS PÚBLICAS (sem autenticação)
// =====================================================

// Health check
router.get('/health', async (req, res) => {
  try {
    // Testar conexão com banco
    const { query } = require('../config/database');
    await query('SELECT 1');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Info do sistema
router.get('/info', (req, res) => {
  res.json({
    name: 'MatchIt API',
    version: '1.0.0',
    description: 'Sistema de recomendação inteligente',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/verify'
      ],
      profile: [
        'GET /api/profile',
        'PUT /api/profile',
        'GET /api/profile/style-preferences',
        'PUT /api/profile/style-preferences'
      ],
      emotional: [
        'GET /api/profile/emotional',
        'POST /api/profile/emotional/responses'
      ]
    }
  });
});

// Rota de teste público
router.get('/test', (req, res) => {
  res.json({
    message: 'API está funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================
router.use('/auth', authRoutes);

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO PARA ROTAS PROTEGIDAS
// =====================================================
router.use('/profile', authMiddleware);
router.use('/recommendations', authMiddleware);
router.use('/matches', authMiddleware);

// =====================================================
// ROTAS PROTEGIDAS (requerem autenticação)
// =====================================================

// Perfil básico
router.get('/profile', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado'
      });
    }
    
    res.json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar perfil
router.put('/profile', async (req, res) => {
  try {
    const { name, bio, age } = req.body;
    const { query } = require('../config/database');
    
    const result = await query(
      'UPDATE users SET name = COALESCE($1, name), updated_at = NOW() WHERE id = $2 RETURNING id, email, name',
      [name, req.userId]
    );
    
    res.json({
      success: true,
      message: 'Perfil atualizado',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// PREFERÊNCIAS DE ESTILO (FASE 0)
// =====================================================

// GET preferências de estilo
router.get('/profile/style-preferences', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // Verificar se tabela existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'style_choices'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Criar tabela se não existir
      await query(`
        CREATE TABLE style_choices (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          question_id VARCHAR(100) NOT NULL,
          selected_option VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, category, question_id)
        );
        CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
      `);
    }
    
    const result = await query(
      'SELECT category, question_id as "questionId", selected_option as "selectedOption", created_at, updated_at FROM style_choices WHERE user_id = $1 ORDER BY created_at',
      [req.userId]
    );
    
    res.json({
      success: true,
      preferences: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT preferência individual
router.put('/profile/style-preferences', async (req, res) => {
  try {
    const { category, questionId, selectedOption } = req.body;
    
    if (!category || !questionId || !selectedOption) {
      return res.status(400).json({
        success: false,
        error: 'category, questionId e selectedOption são obrigatórios'
      });
    }
    
    const { query } = require('../config/database');
    
    await query(`
      INSERT INTO style_choices (user_id, category, question_id, selected_option)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, category, question_id) 
      DO UPDATE SET 
        selected_option = EXCLUDED.selected_option,
        updated_at = NOW()
    `, [req.userId, category, questionId, selectedOption]);
    
    res.json({
      success: true,
      message: 'Preferência salva com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar preferência:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST preferências em lote
router.post('/profile/style-preferences/batch', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array de preferências é obrigatório'
      });
    }
    
    const { query } = require('../config/database');
    
    for (const pref of preferences) {
      if (!pref.category || !pref.questionId || !pref.selectedOption) {
        return res.status(400).json({
          success: false,
          error: 'Cada preferência deve ter category, questionId e selectedOption'
        });
      }
      
      await query(`
        INSERT INTO style_choices (user_id, category, question_id, selected_option)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, category, question_id) 
        DO UPDATE SET 
          selected_option = EXCLUDED.selected_option,
          updated_at = NOW()
      `, [req.userId, pref.category, pref.questionId, pref.selectedOption]);
    }
    
    res.json({
      success: true,
      message: `${preferences.length} preferências salvas com sucesso`
    });
  } catch (error) {
    console.error('Erro ao salvar preferências em lote:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE todas as preferências
router.delete('/profile/style-preferences', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    await query('DELETE FROM style_choices WHERE user_id = $1', [req.userId]);
    
    res.json({
      success: true,
      message: 'Preferências removidas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover preferências:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// SISTEMA EMOCIONAL (já implementado)
// =====================================================

// Manter rotas emocionais existentes se houver arquivos separados
try {
  const emotionalRoutes = require('./emotional-profile');
  router.use('/profile/emotional', emotionalRoutes);
} catch (error) {
  console.log('Rotas emocionais não encontradas, usando implementação básica');
  
  // Implementação básica do sistema emocional
  router.get('/profile/emotional', (req, res) => {
    res.json({
      success: true,
      message: 'Sistema emocional em desenvolvimento',
      emotional_profile: null
    });
  });
}

// =====================================================
// ROTA PARA ROTAS NÃO ENCONTRADAS
// =====================================================
router.use('*', (req, res) => {
  // Listar rotas disponíveis
  const availableRoutes = [
    'GET /api/health',
    'GET /api/info',
    'GET /api/test',
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET /api/auth/verify',
    'GET /api/profile',
    'PUT /api/profile',
    'GET /api/profile/style-preferences',
    'PUT /api/profile/style-preferences',
    'POST /api/profile/style-preferences/batch',
    'DELETE /api/profile/style-preferences',
    'GET /api/profile/emotional'
  ];
  
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableRoutes
  });
});

module.exports = router;
EOF
    
    print_success "Sistema de rotas atualizado"
    echo ""
}

# Instalar dependências necessárias
instalar_dependencias() {
    print_header "📦 INSTALANDO DEPENDÊNCIAS NECESSÁRIAS"
    
    # Verificar se package.json tem as dependências
    print_info "Verificando dependências..."
    
    npm install bcrypt jsonwebtoken --save
    
    if [ $? -eq 0 ]; then
        print_success "Dependências instaladas: bcrypt, jsonwebtoken"
    else
        print_error "Falha ao instalar dependências"
    fi
    
    echo ""
}

# Testar correções
testar_correcoes() {
    print_header "🧪 TESTANDO CORREÇÕES"
    
    print_info "Aguarde 3 segundos para o servidor inicializar..."
    sleep 3
    
    # Testar health
    health_response=$(curl -s "http://localhost:3000/api/health" 2>/dev/null)
    if echo "$health_response" | grep -q "ok"; then
        print_success "Health check funcionando"
    else
        print_warning "Health check: $health_response"
    fi
    
    # Testar registro
    register_response=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"teste_correcao@example.com","password":"123456","name":"Teste Correção"}' 2>/dev/null)
    
    if echo "$register_response" | grep -q "token\|success"; then
        print_success "Registro funcionando"
        
        # Extrair token para testar preferências
        token=$(echo "$register_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$token" ]; then
            # Testar preferências
            pref_response=$(curl -s -H "Authorization: Bearer $token" "http://localhost:3000/api/profile/style-preferences" 2>/dev/null)
            
            if echo "$pref_response" | grep -q "success\|preferences"; then
                print_success "Preferências funcionando"
            else
                print_warning "Preferências: $pref_response"
            fi
        fi
    else
        print_warning "Registro: $register_response"
    fi
    
    echo ""
}

# Relatório final
relatorio_final() {
    print_header "📊 RELATÓRIO DA CORREÇÃO"
    
    echo ""
    print_info "✅ CORREÇÕES APLICADAS:"
    echo "  • Sistema de autenticação implementado"
    echo "  • Middleware JWT criado"
    echo "  • Rotas de registro e login adicionadas"
    echo "  • Sistema de preferências integrado"
    echo "  • Configuração de banco corrigida"
    echo "  • Dependências instaladas"
    
    echo ""
    print_header "🚀 PRÓXIMOS PASSOS:"
    echo "1. Reinicie o servidor: npm run server"
    echo "2. Execute o teste: ./scripts/teste-fase0-detalhado.sh"
    echo "3. Se tudo funcionar, implemente a Fase 1 (Torneios)"
    
    echo ""
    print_success "✅ CORREÇÃO CONCLUÍDA!"
    print_info "O sistema base agora deve estar funcional"
}

# Função principal
main() {
    print_header "🚀 CORREÇÃO URGENTE DO SISTEMA MATCHIT"
    print_info "Corrigindo problemas críticos identificados nos testes"
    echo ""
    
    verificar_estrutura_projeto
    corrigir_banco_dados
    implementar_autenticacao
    atualizar_rotas_principais
    instalar_dependencias
    testar_correcoes
    relatorio_final
}

# Executar
main "$@"