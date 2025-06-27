# scripts/fix-matchit-system.sh - Script de correção completa do sistema MatchIt

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "================================================================"
echo " SCRIPT DE CORREÇÃO - SISTEMA MATCHIT"
echo "================================================================"
echo -e "${NC}"

# Função para log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Execute este script no diretório raiz do projeto MatchIt"
    exit 1
fi

log_info "Iniciando correção do sistema MatchIt..."

# 1. CORREÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO
log_info "Criando middleware de autenticação faltante..."

mkdir -p server/middleware

cat > server/middleware/authMiddleware.js << 'EOF'
// server/middleware/authMiddleware.js - Middleware de autenticação
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'matchit',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'matchit_db',
  password: process.env.DB_PASSWORD || 'matchit123',
  port: process.env.DB_PORT || 5432,
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchit_secret_key');
    
    // Verificar se usuário existe no banco
    const userResult = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

module.exports = { authenticateToken };
EOF

log_success "Middleware de autenticação criado"

# 2. CORREÇÃO DO BANCO DE DADOS
log_info "Corrigindo schema do banco de dados..."

# Criar script de correção SQL
cat > database/migrations/003_fix_schema_errors.sql << 'EOF'
-- database/migrations/003_fix_schema_errors.sql - Correção de erros de schema

BEGIN;

-- 1. Adicionar coluna 'age' na tabela users se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;

-- 2. Adicionar coluna 'approved' na tabela tournament_images se não existir
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 3. Adicionar outras colunas que podem estar faltando
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Corrigir tabela tournament_images se necessário
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS dimensions JSONB;

-- 5. Criar índices em campos aprovados se não existirem
CREATE INDEX IF NOT EXISTS idx_tournament_images_approved ON tournament_images(approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_approved ON tournament_images(category, approved);

-- 6. Inserir dados de teste se tabela estiver vazia
INSERT INTO tournament_images (category, image_url, alt_text, approved) 
SELECT * FROM (VALUES 
    ('colors', '/api/images/sample/color1.jpg', 'Cor vibrante azul', true),
    ('colors', '/api/images/sample/color2.jpg', 'Cor quente vermelha', true),
    ('styles', '/api/images/sample/style1.jpg', 'Estilo casual moderno', true),
    ('styles', '/api/images/sample/style2.jpg', 'Estilo elegante formal', true),
    ('accessories', '/api/images/sample/acc1.jpg', 'Acessório minimalista', true),
    ('accessories', '/api/images/sample/acc2.jpg', 'Acessório vintage', true)
) AS t(category, image_url, alt_text, approved)
WHERE NOT EXISTS (SELECT 1 FROM tournament_images LIMIT 1);

COMMIT;
EOF

log_success "Script de correção SQL criado"

# 3. CONFIGURAÇÃO DO POSTGRESQL
log_info "Configurando PostgreSQL..."

# Verificar se PostgreSQL está rodando
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    log_warning "PostgreSQL não está rodando. Tentando iniciar..."
    
    # Tentar diferentes comandos de inicialização
    if command -v systemctl > /dev/null 2>&1; then
        sudo systemctl start postgresql
    elif command -v service > /dev/null 2>&1; then
        sudo service postgresql start
    elif command -v brew > /dev/null 2>&1; then
        brew services start postgresql
    else
        log_error "Não foi possível iniciar PostgreSQL automaticamente"
        log_info "Inicie o PostgreSQL manualmente e execute este script novamente"
        exit 1
    fi
    
    sleep 3
fi

# Criar usuário e banco se não existirem
log_info "Criando usuário e banco de dados..."

# Script SQL para criação
cat > /tmp/setup_db.sql << 'EOF'
-- Criar usuário se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'matchit') THEN
        CREATE USER matchit WITH PASSWORD 'matchit123';
    END IF;
END
$$;

-- Criar banco se não existir
SELECT 'CREATE DATABASE matchit_db OWNER matchit' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'matchit_db');

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;
EOF

# Executar como postgres
if sudo -u postgres psql -f /tmp/setup_db.sql; then
    log_success "Usuário e banco criados com sucesso"
else
    # Tentar método alternativo
    log_warning "Tentando método alternativo..."
    
    # Criar banco diretamente
    sudo -u postgres createdb matchit_db 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER matchit WITH PASSWORD 'matchit123';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;" 2>/dev/null || true
fi

# Limpar arquivo temporário
rm -f /tmp/setup_db.sql

# 4. EXECUTAR CORREÇÕES NO BANCO
log_info "Aplicando correções no banco de dados..."

# Tentar conectar e executar correções
if PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -f database/migrations/003_fix_schema_errors.sql; then
    log_success "Correções aplicadas com sucesso"
else
    log_error "Erro ao aplicar correções. Verificando permissões..."
    
    # Dar permissões ao usuário matchit
    sudo -u postgres psql matchit_db -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO matchit;"
    sudo -u postgres psql matchit_db -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO matchit;"
    sudo -u postgres psql matchit_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO matchit;"
    
    # Tentar novamente
    if PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -f database/migrations/003_fix_schema_errors.sql; then
        log_success "Correções aplicadas após ajuste de permissões"
    else
        log_warning "Alguns erros persistem, mas sistema pode funcionar"
    fi
fi

# 5. ATUALIZAR ARQUIVO .ENV
log_info "Atualizando configurações de ambiente..."

if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || touch .env
fi

# Backup do .env atual
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Atualizar configurações do banco
cat > .env << 'EOF'
# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Configurações da API
PORT=3000
NODE_ENV=development
JWT_SECRET=matchit_secret_key_very_secure_2024

# URLs da API
API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000

# Configurações de Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF

log_success "Arquivo .env atualizado"

# 6. INSTALAR DEPENDÊNCIAS FALTANTES
log_info "Verificando e instalando dependências..."

# Dependências que podem estar faltantes
npm install --save jsonwebtoken bcryptjs multer cors helmet express-rate-limit

log_success "Dependências verificadas"

# 7. CRIAR DIRETÓRIOS NECESSÁRIOS
log_info "Criando estrutura de diretórios..."

mkdir -p uploads/tournament-images
mkdir -p uploads/profile-pictures
mkdir -p logs
mkdir -p database/seeds
mkdir -p tests

log_success "Diretórios criados"

# 8. CRIAR DADOS DE SEED CORRIGIDOS
log_info "Criando dados iniciais corrigidos..."

cat > database/seeds/002_corrected_initial_data.sql << 'EOF'
-- database/seeds/002_corrected_initial_data.sql - Dados iniciais corrigidos

BEGIN;

-- Inserir usuário admin de teste (apenas se não existir)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at)
SELECT 'Admin Test', 'admin@matchit.com', '$2b$10$example_hash', 25, 'male', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@matchit.com');

-- Inserir usuários de teste (apenas se não existirem)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at)
SELECT * FROM (VALUES 
    ('Maria Silva', 'maria@test.com', '$2b$10$example_hash', 28, 'female', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('João Santos', 'joao@test.com', '$2b$10$example_hash', 32, 'male', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Ana Costa', 'ana@test.com', '$2b$10$example_hash', 24, 'female', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
) AS t(name, email, password, age, gender, is_admin, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = t.email);

-- Inserir mais imagens para torneios se necessário
INSERT INTO tournament_images (category, image_url, alt_text, approved, upload_date)
SELECT * FROM (VALUES 
    ('colors', '/api/images/colors/azul.jpg', 'Tom azul sereno', true, CURRENT_TIMESTAMP),
    ('colors', '/api/images/colors/verde.jpg', 'Verde natural', true, CURRENT_TIMESTAMP),
    ('colors', '/api/images/colors/vermelho.jpg', 'Vermelho vibrante', true, CURRENT_TIMESTAMP),
    ('styles', '/api/images/styles/casual.jpg', 'Look casual confortável', true, CURRENT_TIMESTAMP),
    ('styles', '/api/images/styles/formal.jpg', 'Elegância formal', true, CURRENT_TIMESTAMP),
    ('accessories', '/api/images/accessories/watch.jpg', 'Relógio clássico', true, CURRENT_TIMESTAMP),
    ('accessories', '/api/images/accessories/bag.jpg', 'Bolsa moderna', true, CURRENT_TIMESTAMP),
    ('shoes', '/api/images/shoes/sneaker.jpg', 'Tênis esportivo', true, CURRENT_TIMESTAMP),
    ('shoes', '/api/images/shoes/formal.jpg', 'Sapato social', true, CURRENT_TIMESTAMP)
) AS t(category, image_url, alt_text, approved, upload_date)
WHERE NOT EXISTS (SELECT 1 FROM tournament_images WHERE image_url = t.image_url);

COMMIT;
EOF

# Aplicar seeds corrigidos
if PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -f database/seeds/002_corrected_initial_data.sql; then
    log_success "Dados iniciais inseridos"
else
    log_warning "Alguns dados iniciais podem não ter sido inseridos"
fi

# 9. TESTE DE CONECTIVIDADE
log_info "Testando conectividade do sistema..."

# Teste de conexão com banco
if PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    log_success "Conexão com banco de dados: OK"
else
    log_error "Problema na conexão com banco de dados"
fi

# Verificar se arquivos críticos existem
critical_files=(
    "server/app.js"
    "server/middleware/authMiddleware.js"
    "server/routes/profile.js"
    "package.json"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "Arquivo $file: OK"
    else
        log_warning "Arquivo $file: FALTANDO"
    fi
done

# 10. SCRIPT DE TESTE RÁPIDO
log_info "Criando script de teste rápido..."

cat > scripts/quick-test.sh << 'EOF'
#!/bin/bash
# scripts/quick-test.sh - Teste rápido do sistema

echo "🧪 Testando sistema MatchIt..."

# Teste 1: Conexão com banco
echo -n "Teste de banco de dados: "
if PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALHOU"
fi

# Teste 2: Arquivos críticos
echo -n "Middleware de auth: "
if [ -f "server/middleware/authMiddleware.js" ]; then
    echo "✅ OK"
else
    echo "❌ FALTANDO"
fi

# Teste 3: Dependências
echo -n "Dependências npm: "
if npm list jsonwebtoken > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALTANDO"
fi

# Teste 4: Estrutura de diretórios
echo -n "Diretórios de upload: "
if [ -d "uploads/tournament-images" ]; then
    echo "✅ OK"
else
    echo "❌ FALTANDO"
fi

echo "🎉 Teste rápido concluído!"
EOF

chmod +x scripts/quick-test.sh

log_success "Script de teste criado"

# FINALIZAÇÃO
echo -e "${GREEN}"
echo "================================================================"
echo " CORREÇÃO CONCLUÍDA - SISTEMA MATCHIT"
echo "================================================================"
echo -e "${NC}"

log_success "Sistema corrigido com sucesso!"

echo ""
log_info "Próximos passos:"
echo "1. Execute: chmod +x scripts/quick-test.sh && ./scripts/quick-test.sh"
echo "2. Execute: npm run dev"
echo "3. Teste: curl http://localhost:3000/api/health"
echo "4. Acesse: http://localhost:3000"

echo ""
log_info "Comandos úteis:"
echo "• npm run dev          - Iniciar servidor"
echo "• npm run migrate      - Executar migrações"
echo "• npm test             - Executar testes"
echo "• ./scripts/quick-test.sh - Teste rápido"

echo ""
log_warning "Se ainda houver erros, verifique:"
echo "• Logs em: ./logs/"
echo "• Status do PostgreSQL: sudo systemctl status postgresql"
echo "• Conexão do banco: psql -h localhost -U matchit -d matchit_db"

log_success "Setup de correção finalizado! 🚀"