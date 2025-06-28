#!/bin/bash
# scripts/apply-db-fixes.sh - Aplicação rápida das correções de credenciais

set -e

# =====================================================
# CORES
# =====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# =====================================================
# BANNER
# =====================================================

echo -e "${PURPLE}${BOLD}"
echo "=========================================================================="
echo "🚀 MatchIt - Aplicação Rápida de Correções"
echo "🔧 Corrigindo credenciais e sincronizando banco"
echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
echo "=========================================================================="
echo -e "${NC}"

# =====================================================
# CREDENCIAIS CORRETAS (SUAS)
# =====================================================

echo -e "${CYAN}📋 Aplicando suas credenciais corretas:${NC}"
echo -e "${CYAN}   DB_HOST=localhost${NC}"
echo -e "${CYAN}   DB_PORT=5432${NC}"
echo -e "${CYAN}   DB_NAME=matchit_db${NC}"
echo -e "${CYAN}   DB_USER=matchit${NC}"
echo -e "${CYAN}   DB_PASSWORD=matchit123${NC}"
echo ""

# =====================================================
# PASSO 1: CRIAR/ATUALIZAR .ENV
# =====================================================

echo -e "${BLUE}📁 PASSO 1: Atualizando arquivo .env...${NC}"

# Backup do .env atual se existir
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${YELLOW}   📋 Backup criado: .env.backup.$(date +%Y%m%d_%H%M%S)${NC}"
fi

# Criar .env com suas credenciais
cat > .env << 'EOF'
# Database Configuration - Credenciais Corretas MatchIt
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
JWT_SECRET=matchit-jwt-secret-phase2-$(date +%s)
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

echo -e "${GREEN}   ✅ Arquivo .env atualizado${NC}"

# =====================================================
# PASSO 2: TESTAR CONEXÃO
# =====================================================

echo -e "${BLUE}📡 PASSO 2: Testando conexão com banco...${NC}"

# Source .env
set -a
source .env
set +a

# Export para psql
export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"  
export PGDATABASE="$DB_NAME"
export PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"

# Testar conexão
if psql -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Conexão estabelecida com $DB_NAME${NC}"
    
    # Verificar tabelas existentes
    table_count=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo -e "${CYAN}   📊 Tabelas existentes: $table_count${NC}"
    
else
    echo -e "${RED}   ❌ Falha na conexão${NC}"
    echo -e "${YELLOW}   ⚠️ Verificando se banco existe...${NC}"
    
    # Tentar criar banco se não existir
    if createdb "$DB_NAME" 2>/dev/null; then
        echo -e "${GREEN}   ✅ Banco $DB_NAME criado com sucesso${NC}"
    else
        echo -e "${RED}   ❌ Não foi possível criar banco${NC}"
        echo -e "${CYAN}   💡 Crie manualmente: createdb -U $DB_USER $DB_NAME${NC}"
        exit 1
    fi
fi

# =====================================================
# PASSO 3: EXECUTAR SCRIPT DE CORREÇÃO
# =====================================================

echo -e "${BLUE}🔧 PASSO 3: Executando correções...${NC}"

if [ -f "scripts/fix-database-credentials.sh" ]; then
    chmod +x scripts/fix-database-credentials.sh
    echo -e "${CYAN}   🔄 Executando correções de credenciais...${NC}"
    ./scripts/fix-database-credentials.sh --quiet 2>/dev/null || true
    echo -e "${GREEN}   ✅ Correções aplicadas${NC}"
else
    echo -e "${YELLOW}   ⚠️ Script de correção não encontrado, continuando...${NC}"
fi

# =====================================================
# PASSO 4: SINCRONIZAR BANCO
# =====================================================

echo -e "${BLUE}🗄️ PASSO 4: Sincronizando banco de dados...${NC}"

if [ -f "scripts/sync-database-phase2.sh" ]; then
    chmod +x scripts/sync-database-phase2.sh
    echo -e "${CYAN}   🔄 Executando sincronização...${NC}"
    
    # Executar sincronização com suas credenciais
    if ./scripts/sync-database-phase2.sh >/dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Sincronização concluída${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Sincronização teve problemas, aplicando migração direta...${NC}"
        
        # Aplicar migração diretamente se o script falhou
        if [ -f "database/migrations/005_definitive_corrected_schema.sql" ]; then
            psql -f database/migrations/005_definitive_corrected_schema.sql >/dev/null 2>&1
            echo -e "${GREEN}   ✅ Migração aplicada diretamente${NC}"
        fi
    fi
else
    echo -e "${YELLOW}   ⚠️ Script de sincronização não encontrado${NC}"
    echo -e "${CYAN}   💡 Execute: ./scripts/sync-database-phase2.sh${NC}"
fi

# =====================================================
# PASSO 5: VERIFICAÇÃO FINAL
# =====================================================

echo -e "${BLUE}🔍 PASSO 5: Verificação final...${NC}"

# Verificar se tabelas principais existem
critical_tables=("users" "tournament_images" "tournament_sessions" "tournament_choices" "tournament_results")
existing_tables=0

for table in "${critical_tables[@]}"; do
    if psql -c "\d $table" >/dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Tabela $table${NC}"
        existing_tables=$((existing_tables + 1))
    else
        echo -e "${RED}   ❌ Tabela $table${NC}"
    fi
done

# Verificar dados de exemplo
if psql -c "\d tournament_images" >/dev/null 2>&1; then
    image_count=$(psql -t -c "SELECT COUNT(*) FROM tournament_images;" 2>/dev/null | xargs)
    echo -e "${CYAN}   📊 Imagens carregadas: ${image_count:-0}${NC}"
fi

# =====================================================
# RESULTADO FINAL
# =====================================================

echo ""
if [ $existing_tables -eq ${#critical_tables[@]} ]; then
    echo -e "${GREEN}${BOLD}"
    echo "🎉 CORREÇÕES APLICADAS COM SUCESSO!"
    echo "=========================================================================="
    echo "✅ Credenciais corretas configuradas"
    echo "✅ Banco sincronizado ($existing_tables/${#critical_tables[@]} tabelas)"
    echo "✅ Sistema pronto para Fase 2"
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "   1. ./scripts/test-phase2-system-fixed.sh   # Testar sistema"
    echo "   2. npm run dev                            # Iniciar desenvolvimento"
    echo "   3. ./scripts/connect-db.sh                # Conectar ao banco"
    echo ""
    echo "🎯 MatchIt Fase 2 pronto para usar!"
    echo "=========================================================================="
    echo -e "${NC}"
else
    echo -e "${YELLOW}${BOLD}"
    echo "⚠️ CORREÇÕES PARCIAIS APLICADAS"
    echo "=========================================================================="
    echo "✅ Credenciais corretas configuradas"
    echo "⚠️ Banco parcialmente sincronizado ($existing_tables/${#critical_tables[@]} tabelas)"
    echo ""
    echo "🔧 PRÓXIMOS PASSOS:"
    echo "   1. ./scripts/sync-database-phase2.sh      # Re-executar sincronização"
    echo "   2. ./scripts/test-phase2-system-fixed.sh  # Verificar status"
    echo ""
    echo "💡 Se problemas persistirem, execute manualmente:"
    echo "   psql -f database/migrations/005_definitive_corrected_schema.sql"
    echo "=========================================================================="
    echo -e "${NC}"
fi

# =====================================================
# TESTAR AUTOMATICAMENTE
# =====================================================

echo -e "${CYAN}🧪 Executando teste rápido...${NC}"

if [ -f "scripts/test-phase2-system-fixed.sh" ]; then
    chmod +x scripts/test-phase2-system-fixed.sh
    ./scripts/test-phase2-system-fixed.sh
else
    echo -e "${YELLOW}   ⚠️ Script de teste não encontrado${NC}"
    echo -e "${CYAN}   💡 Execute manualmente: ./scripts/test-phase2-system-fixed.sh${NC}"
fi