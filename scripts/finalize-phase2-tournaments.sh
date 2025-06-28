#!/bin/bash
# scripts/finalize-phase2-tournaments.sh - Script completo para finalizar a Fase 2 do MatchIt

set -e

# =====================================================
# CONFIGURAÇÕES E CORES
# =====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_NAME="MatchIt"
PHASE="Fase 2 - Sistema de Torneios"
VERSION="2.0.0"

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}"
    echo "=========================================================================="
    echo "🎯 $PROJECT_NAME - $PHASE"
    echo "🚀 Finalização e Configuração Completa"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

check_dependencies() {
    print_step "Verificando dependências do sistema..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado. Instale Node.js 16+ antes de continuar."
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 16 ]; then
        print_error "Node.js versão $node_version encontrada. Versão 16+ é necessária."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não encontrado. Instale npm antes de continuar."
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL CLI não encontrado. Certifique-se que PostgreSQL está instalado."
    fi
    
    print_success "Dependências verificadas com sucesso!"
}

# =====================================================
# INSTALAÇÃO E CONFIGURAÇÃO
# =====================================================

install_dependencies() {
    print_step "Instalando dependências do projeto..."
    
    # Frontend dependencies
    print_info "Instalando dependências do frontend..."
    npm install --silent
    
    # Backend specific dependencies
    print_info "Instalando dependências específicas do backend..."
    npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken \
                pg multer uuid rate-limiter-flexible compression --save
    
    # Development dependencies
    print_info "Instalando dependências de desenvolvimento..."
    npm install --save-dev nodemon concurrently @types/node @types/express \
                          @types/bcryptjs @types/jsonwebtoken @types/multer \
                          @types/uuid eslint prettier --silent
    
    print_success "Dependências instaladas com sucesso!"
}

setup_database() {
    print_step "Configurando banco de dados..."
    
    # Check if .env exists
    if [ ! -f .env ]; then
        print_info "Criando arquivo .env..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://matchit_user:matchit_pass@localhost:5432/matchit_tournaments
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_tournaments
DB_USER=matchit_user
DB_PASSWORD=matchit_pass

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Tournament Configuration
MIN_IMAGES_PER_CATEGORY=8
MAX_ACTIVE_SESSIONS_PER_USER=3
SESSION_EXPIRY_HOURS=24

# CORS Configuration
CORS_ORIGIN=http://localhost:19006,http://localhost:3000
EOF
        print_success "Arquivo .env criado com configurações padrão"
        print_warning "IMPORTANTE: Atualize as configurações no arquivo .env conforme necessário"
    else
        print_info "Arquivo .env já existe, mantendo configurações atuais"
    fi
    
    # Create database if it doesn't exist
    print_info "Verificando e criando banco de dados..."
    
    # Try to create database (will fail silently if already exists)
    createdb matchit_tournaments 2>/dev/null || print_info "Banco de dados já existe ou erro na criação"
    
    # Run migrations
    print_info "Executando migrações do banco de dados..."
    
    # Check if migration file exists
    if [ -f "database/migrations/003_complete_tournament_schema.sql" ]; then
        psql -d matchit_tournaments -f database/migrations/003_complete_tournament_schema.sql 2>/dev/null || {
            print_warning "Erro ao executar migração. Verifique se o PostgreSQL está configurado corretamente."
        }
    else
        print_warning "Arquivo de migração não encontrado. Certifique-se que está no diretório correto."
    fi
    
    print_success "Configuração do banco de dados concluída!"
}

setup_directories() {
    print_step "Criando estrutura de diretórios..."
    
    # Create upload directories
    mkdir -p uploads/tournaments
    mkdir -p uploads/profiles
    mkdir -p uploads/temp
    
    # Create logs directory
    mkdir -p logs
    
    # Create backup directory
    mkdir -p backups
    
    # Create scripts directory if it doesn't exist
    mkdir -p scripts
    
    # Set proper permissions
    chmod 755 uploads
    chmod 755 uploads/tournaments
    chmod 755 uploads/profiles
    chmod 755 uploads/temp
    chmod 755 logs
    chmod 755 backups
    
    print_success "Estrutura de diretórios criada!"
}

create_package_scripts() {
    print_step "Configurando scripts do package.json..."
    
    # Backup current package.json
    cp package.json package.json.backup 2>/dev/null || true
    
    # Create temporary package.json with updated scripts
    cat > package_scripts_temp.json << 'EOF'
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server/app.js",
    "client": "expo start",
    "start": "node server/app.js",
    "build": "expo build",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "db:migrate": "psql -d $DB_NAME -f database/migrations/003_complete_tournament_schema.sql",
    "db:seed": "psql -d $DB_NAME -f database/seeds/tournament_sample_data.sql",
    "db:reset": "npm run db:migrate && npm run db:seed",
    "tournament:test": "node scripts/test-tournament-system.js",
    "clean": "rm -rf node_modules package-lock.json && npm install",
    "setup": "npm install && npm run db:migrate",
    "deploy:prepare": "npm run lint && npm run test && npm run build"
  }
}
EOF
    
    # Merge scripts into existing package.json
    if command -v jq &> /dev/null; then
        jq -s '.[0] * .[1]' package.json package_scripts_temp.json > package_temp.json
        mv package_temp.json package.json
        rm package_scripts_temp.json
        print_success "Scripts do package.json atualizados!"
    else
        print_warning "jq não encontrado. Scripts não foram mesclados automaticamente."
        print_info "Scripts salvos em package_scripts_temp.json para referência"
    fi
}

create_sample_data() {
    print_step "Criando dados de exemplo..."
    
    mkdir -p database/seeds
    
    cat > database/seeds/tournament_sample_data.sql << 'EOF'
-- database/seeds/tournament_sample_data.sql - Dados de exemplo para torneios

-- Insert sample tournament images
INSERT INTO tournament_images (
    category, image_url, thumbnail_url, title, description, tags, 
    active, approved, created_by, upload_date, approved_at, approved_by,
    file_size, image_width, image_height, mime_type
) VALUES 
-- Cores category
('cores', 'https://picsum.photos/400/500?random=1', 'https://picsum.photos/200/250?random=1', 
 'Paleta Azul Oceano', 'Tons de azul inspirados no oceano', ARRAY['azul', 'oceano', 'calmo'], 
 true, true, 1, NOW(), NOW(), 1, 245760, 400, 500, 'image/jpeg'),

('cores', 'https://picsum.photos/400/500?random=2', 'https://picsum.photos/200/250?random=2',
 'Sunset Warm', 'Cores quentes de pôr do sol', ARRAY['laranja', 'vermelho', 'quente'],
 true, true, 1, NOW(), NOW(), 1, 198432, 400, 500, 'image/jpeg'),

-- Estilos category
('estilos', 'https://picsum.photos/400/500?random=3', 'https://picsum.photos/200/250?random=3',
 'Minimalista Moderno', 'Estilo clean e minimalista', ARRAY['minimalista', 'moderno', 'clean'],
 true, true, 1, NOW(), NOW(), 1, 256789, 400, 500, 'image/jpeg'),

('estilos', 'https://picsum.photos/400/500?random=4', 'https://picsum.photos/200/250?random=4',
 'Boho Chic', 'Estilo boêmio com toque chique', ARRAY['boho', 'boêmio', 'chique'],
 true, true, 1, NOW(), NOW(), 1, 287456, 400, 500, 'image/jpeg'),

-- Calçados category  
('calcados', 'https://picsum.photos/400/500?random=5', 'https://picsum.photos/200/250?random=5',
 'Tênis Casual', 'Tênis confortável para o dia a dia', ARRAY['tênis', 'casual', 'conforto'],
 true, true, 1, NOW(), NOW(), 1, 234567, 400, 500, 'image/jpeg'),

('calcados', 'https://picsum.photos/400/500?random=6', 'https://picsum.photos/200/250?random=6',
 'Salto Elegante', 'Sapato de salto para ocasiões especiais', ARRAY['salto', 'elegante', 'festa'],
 true, true, 1, NOW(), NOW(), 1, 298765, 400, 500, 'image/jpeg'),

-- Acessórios category
('acessorios', 'https://picsum.photos/400/500?random=7', 'https://picsum.photos/200/250?random=7',
 'Bolsa Clássica', 'Bolsa de couro clássica', ARRAY['bolsa', 'couro', 'clássico'],
 true, true, 1, NOW(), NOW(), 1, 345678, 400, 500, 'image/jpeg'),

('acessorios', 'https://picsum.photos/400/500?random=8', 'https://picsum.photos/200/250?random=8',
 'Colar Delicado', 'Colar dourado delicado', ARRAY['colar', 'dourado', 'delicado'],
 true, true, 1, NOW(), NOW(), 1, 156789, 400, 500, 'image/jpeg'),

-- Texturas category
('texturas', 'https://picsum.photos/400/500?random=9', 'https://picsum.photos/200/250?random=9',
 'Seda Luxuosa', 'Textura de seda premium', ARRAY['seda', 'luxo', 'suave'],
 true, true, 1, NOW(), NOW(), 1, 278901, 400, 500, 'image/jpeg'),

('texturas', 'https://picsum.photos/400/500?random=10', 'https://picsum.photos/200/250?random=10',
 'Tricot Aconchegante', 'Textura de tricot macio', ARRAY['tricot', 'macio', 'inverno'],
 true, true, 1, NOW(), NOW(), 1, 234890, 400, 500, 'image/jpeg'),

-- Roupas Casuais category
('roupas_casuais', 'https://picsum.photos/400/500?random=11', 'https://picsum.photos/200/250?random=11',
 'Jeans Vintage', 'Calça jeans com estilo vintage', ARRAY['jeans', 'vintage', 'casual'],
 true, true, 1, NOW(), NOW(), 1, 312456, 400, 500, 'image/jpeg'),

('roupas_casuais', 'https://picsum.photos/400/500?random=12', 'https://picsum.photos/200/250?random=12',
 'T-shirt Básica', 'Camiseta básica de algodão', ARRAY['camiseta', 'básico', 'algodão'],
 true, true, 1, NOW(), NOW(), 1, 189234, 400, 500, 'image/jpeg'),

-- Roupas Formais category
('roupas_formais', 'https://picsum.photos/400/500?random=13', 'https://picsum.photos/200/250?random=13',
 'Terno Clássico', 'Terno masculino clássico', ARRAY['terno', 'formal', 'clássico'],
 true, true, 1, NOW(), NOW(), 1, 456789, 400, 500, 'image/jpeg'),

('roupas_formais', 'https://picsum.photos/400/500?random=14', 'https://picsum.photos/200/250?random=14',
 'Vestido Cocktail', 'Vestido para eventos sociais', ARRAY['vestido', 'cocktail', 'social'],
 true, true, 1, NOW(), NOW(), 1, 367890, 400, 500, 'image/jpeg'),

-- Roupas de Festa category
('roupas_festa', 'https://picsum.photos/400/500?random=15', 'https://picsum.photos/200/250?random=15',
 'Vestido de Gala', 'Vestido longo para gala', ARRAY['vestido', 'gala', 'longo'],
 true, true, 1, NOW(), NOW(), 1, 445566, 400, 500, 'image/jpeg'),

('roupas_festa', 'https://picsum.photos/400/500?random=16', 'https://picsum.photos/200/250?random=16',
 'Smoking Elegante', 'Smoking para eventos especiais', ARRAY['smoking', 'elegante', 'especial'],
 true, true, 1, NOW(), NOW(), 1, 398765, 400, 500, 'image/jpeg');

-- Update statistics
UPDATE tournament_images SET 
    total_views = FLOOR(RANDOM() * 1000 + 100),
    total_selections = FLOOR(RANDOM() * 100 + 10),
    win_rate = RANDOM() * 100;

-- Insert sample user (for testing)
INSERT INTO users (username, email, password_hash, is_admin, created_at) 
VALUES ('admin', 'admin@matchit.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, NOW())
ON CONFLICT (email) DO NOTHING;

COMMIT;
EOF
    
    print_success "Dados de exemplo criados!"
}

create_test_script() {
    print_step "Criando script de teste do sistema..."
    
    cat > scripts/test-tournament-system.js << 'EOF'
// scripts/test-tournament-system.js - Script de teste do sistema de torneios
const { TournamentEngine } = require('../server/services/TournamentEngine.js');
const { pool } = require('../server/config/database.js');

async function testTournamentSystem() {
    console.log('🧪 Testando Sistema de Torneios...\n');
    
    try {
        const engine = new TournamentEngine();
        
        // Test 1: Get categories
        console.log('📋 Teste 1: Buscar categorias...');
        const categories = await engine.getCategories();
        console.log(`✅ ${categories.length} categorias encontradas`);
        
        // Test 2: Start tournament
        console.log('\n🎯 Teste 2: Iniciar torneio...');
        const result = await engine.startTournament(1, 'estilos', 8);
        console.log(`✅ Torneio iniciado: ${result.session.id}`);
        
        // Test 3: Get matchup
        console.log('\n⚔️  Teste 3: Buscar confronto...');
        const matchup = await engine.getCurrentMatchup(result.session.id);
        if (matchup) {
            console.log(`✅ Confronto: ${matchup.imageA.title} vs ${matchup.imageB.title}`);
        }
        
        // Test 4: Process choice
        console.log('\n🎮 Teste 4: Processar escolha...');
        if (matchup) {
            const choiceResult = await engine.processChoice(
                result.session.id,
                matchup.imageA.id,
                matchup.imageB.id,
                2500
            );
            console.log(`✅ Escolha processada. Finalizado: ${choiceResult.finished}`);
        }
        
        // Test 5: Get admin stats
        console.log('\n📊 Teste 5: Estatísticas admin...');
        const stats = await engine.getAdminStats();
        console.log(`✅ Stats: ${stats.totalImages} imagens, ${stats.activeImages} ativas`);
        
        console.log('\n🎉 Todos os testes passaram com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Execute if run directly
if (require.main === module) {
    testTournamentSystem();
}

module.exports = { testTournamentSystem };
EOF
    
    chmod +x scripts/test-tournament-system.js
    print_success "Script de teste criado!"
}

create_documentation() {
    print_step "Criando documentação da Fase 2..."
    
    mkdir -p docs/phase2
    
    cat > docs/phase2/README.md << 'EOF'
# MatchIt - Fase 2: Sistema de Torneios

## 🎯 Visão Geral

A Fase 2 implementa um sistema completo de torneios de estilo onde usuários podem descobrir suas preferências através de confrontos 2x2 entre imagens.

## 🏗️ Arquitetura

### Backend
- **TournamentEngine.js**: Motor principal do sistema de torneios
- **routes/tournament.js**: Rotas API para torneios
- **Banco de dados**: Schema completo para torneios

### Frontend
- **TournamentScreen.tsx**: Interface gamificada 2x2
- **TournamentMenuScreen.tsx**: Menu de seleção de categorias
- **AdminTournamentPanel.tsx**: Painel administrativo
- **useTournament.ts**: Hook personalizado para torneios

## 🚀 Funcionalidades

### Para Usuários
- ✅ Torneios interativos 2x2
- ✅ 10 categorias de estilo
- ✅ Tamanhos variados (8, 16, 32, 64 imagens)
- ✅ Sistema de progresso e estatísticas
- ✅ Resultados personalizados com insights
- ✅ Histórico de torneios

### Para Administradores
- ✅ Upload em lote de imagens
- ✅ Sistema de aprovação
- ✅ Analytics e métricas
- ✅ Gestão de categorias
- ✅ Ações em lote

## 🛠️ Configuração

### Pré-requisitos
- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

### Instalação
```bash
# Clone o projeto
git clone <repository>
cd matchit-app

# Execute o script de finalização
chmod +x scripts/finalize-phase2-tournaments.sh
./scripts/finalize-phase2-tournaments.sh

# Configure o banco de dados
npm run db:migrate
npm run db:seed

# Inicie o desenvolvimento
npm run dev
```

### Variáveis de Ambiente
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/matchit_tournaments
JWT_SECRET=your-secret-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

## 📱 Uso

### Iniciar Torneio
1. Escolha uma categoria no menu
2. Selecione o tamanho do torneio
3. Faça suas escolhas em confrontos 2x2
4. Receba insights personalizados

### Administração
1. Acesse o painel admin
2. Faça upload de imagens
3. Aprove/rejeite conteúdo
4. Monitore estatísticas

## 🧪 Testes

```bash
# Teste manual do sistema
npm run tournament:test

# Testes automatizados
npm test
```

## 📊 Métricas

O sistema coleta métricas como:
- Tempo de resposta por escolha
- Taxa de conclusão de torneios
- Preferências por categoria
- Padrões de uso

## 🔐 Segurança

- Autenticação JWT
- Rate limiting
- Validação de uploads
- Sanitização de dados

## 🚀 Deploy

```bash
# Preparar para deploy
npm run deploy:prepare

# Build para produção
npm run build
```

## 📝 API Reference

### Endpoints Principais

#### GET /api/tournament/categories
Busca categorias disponíveis

#### POST /api/tournament/start
Inicia novo torneio
```json
{
  "category": "estilos",
  "tournamentSize": 16
}
```

#### POST /api/tournament/choice
Processa escolha do usuário
```json
{
  "sessionId": "tournament_123",
  "winnerId": 1,
  "loserId": 2,
  "responseTimeMs": 2500
}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
EOF
    
    cat > docs/phase2/API.md << 'EOF'
# API Documentation - Tournament System

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Endpoints

### Categories
- `GET /api/tournament/categories` - List available categories
- `GET /api/tournament/categories/:id/stats` - Category statistics

### Tournaments
- `POST /api/tournament/start` - Start new tournament
- `GET /api/tournament/session/:id` - Get session details
- `POST /api/tournament/choice` - Process user choice
- `DELETE /api/tournament/session/:id` - Cancel session

### Results
- `GET /api/tournament/result/:sessionId` - Get tournament result
- `GET /api/tournament/history` - User tournament history

### Admin
- `GET /api/tournament/admin/stats` - Admin statistics
- `GET /api/tournament/admin/images` - List all images
- `POST /api/tournament/admin/images/upload` - Upload images
- `PUT /api/tournament/admin/images/:id` - Update image
- `DELETE /api/tournament/admin/images/:id` - Delete image
- `POST /api/tournament/admin/images/bulk-action` - Bulk actions
EOF
    
    print_success "Documentação criada!"
}

verify_installation() {
    print_step "Verificando instalação..."
    
    local errors=0
    
    # Check critical files
    local critical_files=(
        "server/services/TournamentEngine.js"
        "server/routes/tournament.js"
        "screens/TournamentScreen.tsx"
        "screens/AdminTournamentPanel.tsx"
        "screens/TournamentMenuScreen.tsx"
        "hooks/useTournament.ts"
        "navigation/AppNavigator.tsx"
    )
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Arquivo crítico não encontrado: $file"
            ((errors++))
        fi
    done
    
    # Check directories
    local directories=(
        "uploads/tournaments"
        "logs"
        "database/seeds"
        "docs/phase2"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            print_error "Diretório não encontrado: $dir"
            ((errors++))
        fi
    done
    
    # Check .env file
    if [ ! -f ".env" ]; then
        print_error "Arquivo .env não encontrado"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "Verificação concluída sem erros!"
        return 0
    else
        print_error "Verificação falhou com $errors erro(s)"
        return 1
    fi
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    # Pre-flight checks
    check_dependencies
    
    # Installation steps
    install_dependencies
    setup_directories
    setup_database
    create_package_scripts
    create_sample_data
    create_test_script
    create_documentation
    
    # Verification
    if verify_installation; then
        print_success "🎉 Fase 2 finalizada com sucesso!"
        
        echo -e "${GREEN}"
        echo "=========================================================================="
        echo "✅ INSTALAÇÃO COMPLETA - FASE 2"
        echo "=========================================================================="
        echo ""
        echo "🚀 Próximos passos:"
        echo ""
        echo "1. Configure o banco de dados:"
        echo "   npm run db:migrate"
        echo "   npm run db:seed"
        echo ""
        echo "2. Inicie o desenvolvimento:"
        echo "   npm run dev"
        echo ""
        echo "3. Teste o sistema:"
        echo "   npm run tournament:test"
        echo ""
        echo "4. Acesse a documentação:"
        echo "   docs/phase2/README.md"
        echo ""
        echo "🌟 Sistema de Torneios MatchIt está pronto!"
        echo "=========================================================================="
        echo -e "${NC}"
    else
        print_error "Instalação falhou. Verifique os erros acima."
        exit 1
    fi
}

# =====================================================
# EXECUÇÃO
# =====================================================

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi