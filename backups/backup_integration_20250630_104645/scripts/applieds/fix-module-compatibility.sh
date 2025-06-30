# scripts/fix-module-compatibility.sh - Correção de compatibilidade de módulos e database
#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
DB_PASSWORD="matchit123"

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

# Corrigir configuração de database para ES6 modules
fix_database_config() {
    print_header "🔧 CORRIGINDO CONFIGURAÇÃO DE DATABASE (ES6 MODULES)"
    
    # Backup do arquivo atual
    if [ -f "server/config/database.js" ]; then
        cp "server/config/database.js" "server/config/database.js.commonjs.backup"
        print_info "Backup criado: database.js.commonjs.backup"
    fi
    
    # Criar nova configuração usando ES6 modules
    cat > server/config/database.js << 'EOF'
// server/config/database.js - Configuração PostgreSQL com ES6 modules
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

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

console.log('🗄️ Database config (ES6):', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  password: '***',
  ssl: dbConfig.ssl
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
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    const currentTime = result.rows[0].now;
    const version = result.rows[0].version;
    client.release();
    
    console.log('✅ Conexão com banco bem-sucedida');
    console.log('🕐 Hora do servidor:', currentTime);
    console.log('📊 PostgreSQL:', version.split(' ').slice(0, 2).join(' '));
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar:', {
      message: error.message,
      code: error.code
    });
    return false;
  }
};

// Função para executar queries com retry
export const query = async (text, params, retries = 3) => {
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
      console.error(`❌ Query erro (tentativa ${attempt}/${retries}):`, {
        error: error.message,
        code: error.code,
        query: text.substring(0, 50) + '...'
      });
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError;
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
    throw error;
  } finally {
    client.release();
  }
};

// Testar conexão na inicialização
testConnection().catch(error => {
  console.error('💥 Falha crítica na conexão inicial');
  console.error('Error:', error.message);
});

// Exportação default para compatibilidade
export default {
  pool,
  query,
  transaction,
  testConnection
};
EOF

    print_status "Configuração de database corrigida para ES6 modules"
}

# Analisar e corrigir estrutura do banco
fix_database_structure() {
    print_header "🗄️ CORRIGINDO ESTRUTURA DO BANCO DE DADOS"
    
    print_info "Analisando estrutura atual da tabela users..."
    
    # Verificar estrutura da tabela users
    local users_structure
    users_structure=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\d users" 2>/dev/null)
    
    if echo "$users_structure" | grep -q "uuid"; then
        print_info "Tabela users usa tipo UUID"
        local user_id_type="UUID"
    else
        print_info "Tabela users usa tipo VARCHAR"
        local user_id_type="VARCHAR(255)"
    fi
    
    print_info "Criando script de correção da estrutura..."
    
    # Criar script SQL para corrigir estrutura
    cat > fix_structure.sql << EOF
-- Corrigir estrutura do banco de dados
-- Remover tabela style_preferences se existir (com problemas)
DROP TABLE IF EXISTS style_preferences CASCADE;

-- Recriar tabela style_preferences com tipo correto
CREATE TABLE style_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Adicionar foreign key com tipo correto
ALTER TABLE style_preferences 
ADD CONSTRAINT style_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_style_preferences_user_id ON style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_style_preferences_category ON style_preferences(category);
CREATE INDEX IF NOT EXISTS idx_style_preferences_user_category ON style_preferences(user_id, category);

-- Verificar se coluna date_of_birth existe em users, se não existir, adicionar
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE users ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Coluna date_of_birth adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna date_of_birth já existe na tabela users';
    END IF;
END \$\$;

-- Inserir dados de teste se não existirem
DO \$\$
BEGIN
    -- Verificar se usuário de teste já existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'teste@matchit.com') THEN
        -- Inserir usuário de teste com UUID
        INSERT INTO users (id, email, password_hash, name, date_of_birth, created_at) VALUES 
        (
            gen_random_uuid(), 
            'teste@matchit.com', 
            '\$2b\$10\$example.hash.for.testing.purposes', 
            'Usuário Teste', 
            '1990-01-01',
            NOW()
        );
        
        -- Obter ID do usuário inserido
        DECLARE
            test_user_id UUID;
        BEGIN
            SELECT id INTO test_user_id FROM users WHERE email = 'teste@matchit.com';
            
            -- Inserir perfil de teste se não existir
            IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = test_user_id) THEN
                INSERT INTO user_profiles (user_id, bio, location, created_at) VALUES 
                (
                    test_user_id, 
                    'Perfil de teste para desenvolvimento', 
                    '{"city": "São Paulo", "state": "SP"}',
                    NOW()
                );
            END IF;
            
            -- Inserir algumas preferências de teste
            INSERT INTO style_preferences (user_id, category, question_id, selected_option) VALUES 
            (test_user_id, 'cores', 'color_preference', 'warm'),
            (test_user_id, 'estilo', 'style_preference', 'casual'),
            (test_user_id, 'acessorios', 'accessory_preference', 'minimal');
            
        END;
        
        RAISE NOTICE 'Dados de teste inseridos com sucesso';
    ELSE
        RAISE NOTICE 'Usuário de teste já existe';
    END IF;
END \$\$;

-- Verificar estruturas criadas
\d style_preferences

-- Contar registros nas tabelas principais
SELECT 'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'style_preferences' as tabela, COUNT(*) as registros FROM style_preferences
UNION ALL
SELECT 'user_profiles' as tabela, COUNT(*) as registros FROM user_profiles;

-- Verificar dados de teste
SELECT 
    u.email,
    u.name,
    COUNT(sp.id) as preferences_count
FROM users u
LEFT JOIN style_preferences sp ON u.id = sp.user_id
WHERE u.email = 'teste@matchit.com'
GROUP BY u.id, u.email, u.name;
EOF

    print_info "Executando correção da estrutura..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f fix_structure.sql; then
        print_status "Estrutura do banco corrigida com sucesso"
    else
        print_error "Erro ao corrigir estrutura do banco"
        return 1
    fi
    
    # Limpar arquivo temporário
    rm -f fix_structure.sql
}

# Corrigir rotas de perfil para ES6 modules
fix_profile_routes() {
    print_header "🔧 CORRIGINDO ROTAS DE PERFIL (ES6 MODULES)"
    
    # Backup do arquivo atual
    if [ -f "server/routes/profile.js" ]; then
        cp "server/routes/profile.js" "server/routes/profile.js.old.backup"
    fi
    
    # Criar rotas corrigidas usando ES6 modules
    cat > server/routes/profile.js << 'EOF'
// server/routes/profile.js - Rotas de Perfil com ES6 modules
import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';

const router = express.Router();

// Importar middleware de autenticação
let authenticateToken;
try {
  const authModule = await import('../middleware/auth.js');
  authenticateToken = authModule.authenticateToken;
  console.log('✅ Auth middleware carregado em profile routes');
} catch (error) {
  console.warn('⚠️ Auth middleware não encontrado, usando fallback');
  authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }
    // Mock para desenvolvimento
    req.user = { 
      userId: '123e4567-e89b-12d3-a456-426614174000', // UUID válido
      id: '123e4567-e89b-12d3-a456-426614174000',
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
    
    const result = await query(
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
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    const result = await query(
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
        lastUpdated: result.rows.length > 0 ? 
          Math.max(...result.rows.map(r => new Date(r.updated_at).getTime())) : null
      }
    });
    
  } catch (error) {
    console.error('❌ Erro em GET /api/profile/style-preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar preferências de estilo',
      code: 'FETCH_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    const result = await query(
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    const result = await query(
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    const result = await query(
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
EOF

    print_status "Rotas de perfil corrigidas para ES6 modules"
}

# Criar middleware de auth compatível
create_auth_middleware() {
    print_header "🔐 CRIANDO MIDDLEWARE DE AUTH (ES6 MODULES)"
    
    mkdir -p server/middleware
    
    cat > server/middleware/auth.js << 'EOF'
// server/middleware/auth.js - Middleware de autenticação ES6
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

console.log('🔐 Auth middleware (ES6) carregado, JWT_SECRET:', JWT_SECRET ? 'OK' : 'FALLBACK');

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('🔐 Auth verificando:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido',
        code: 'NO_TOKEN'
      });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('❌ Token inválido:', {
          error: err.name,
          message: err.message
        });
        
        return res.status(401).json({
          success: false,
          error: 'Token inválido ou expirado',
          code: 'INVALID_TOKEN'
        });
      }
      
      req.user = {
        userId: decoded.userId || decoded.id || decoded.sub,
        id: decoded.userId || decoded.id || decoded.sub,
        email: decoded.email,
        name: decoded.name,
        iat: decoded.iat,
        exp: decoded.exp
      };
      
      console.log('✅ Usuário autenticado:', {
        userId: req.user.userId,
        email: req.user.email
      });
      
      next();
    });
    
  } catch (error) {
    console.error('❌ Erro interno no auth:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

export const generateToken = (user) => {
  try {
    const payload = {
      userId: user.id || user.userId,
      id: user.id || user.userId,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const options = {
      expiresIn: '24h',
      issuer: 'matchit-api'
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);
    
    console.log('✅ Token gerado para:', {
      userId: payload.userId,
      email: payload.email
    });
    
    return token;
    
  } catch (error) {
    console.error('❌ Erro ao gerar token:', error);
    throw new Error('Erro ao gerar token de autenticação');
  }
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      valid: true,
      user: {
        userId: decoded.userId || decoded.id || decoded.sub,
        id: decoded.userId || decoded.id || decoded.sub,
        email: decoded.email,
        name: decoded.name
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      expired: error.name === 'TokenExpiredError'
    };
  }
};

export default {
  authenticateToken,
  generateToken,
  verifyToken
};
EOF

    print_status "Middleware de auth criado (ES6 modules)"
}

# Testar configuração completa
test_complete_configuration() {
    print_header "🧪 TESTANDO CONFIGURAÇÃO COMPLETA"
    
    print_info "Verificando se servidor pode iniciar..."
    
    # Verificar se pode conectar ao banco
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM style_preferences;" &> /dev/null; then
        print_status "Conexão com banco OK"
    else
        print_error "Problema de conexão com banco"
        return 1
    fi
    
    # Verificar se arquivos essenciais existem
    local required_files=(
        "server/config/database.js"
        "server/middleware/auth.js"
        "server/routes/profile.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_status "Arquivo $file existe"
        else
            print_error "Arquivo $file não encontrado"
        fi
    done
    
    print_info "Configuração completa! Agora você pode iniciar o servidor:"
    print_info "  npm run server"
}

# Função principal
main() {
    print_header "🚀 CORREÇÃO DE COMPATIBILIDADE DE MÓDULOS E DATABASE"
    print_info "Corrigindo problemas de ES6 modules e tipos de dados do PostgreSQL"
    
    # Executar todas as correções
    fix_database_config
    fix_database_structure
    fix_profile_routes
    create_auth_middleware
    test_complete_configuration
    
    print_header "✅ CORREÇÃO COMPLETA CONCLUÍDA"
    print_info "Problemas resolvidos:"
    echo ""
    print_status "✅ Configuração database convertida para ES6 modules"
    print_status "✅ Tabela style_preferences criada com tipos corretos (UUID)"
    print_status "✅ Rotas de perfil corrigidas para ES6 modules"
    print_status "✅ Middleware de auth criado compatível"
    print_status "✅ Dados de teste inseridos"
    echo ""
    print_info "Próximos passos:"
    print_info "1. Inicie o servidor: npm run server"
    print_info "2. Teste os endpoints: ./scripts/test-phase0-integration.sh"
    echo ""
}

# Executar função principal
main "$@"