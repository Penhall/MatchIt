#!/bin/bash
# scripts/check-database-ready.sh - Verificação rápida se banco está pronto para Fase 0

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações do banco
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
DB_PASSWORD="matchit123"

print_success() {
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

# Contador de problemas
ISSUES=0

# Função para verificar item
check_item() {
    local description="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        print_success "$description"
        return 0
    else
        print_error "$description"
        ((ISSUES++))
        return 1
    fi
}

echo ""
echo -e "${BLUE}🔍 VERIFICAÇÃO RÁPIDA - BANCO PRONTO PARA FASE 0?${NC}"
echo "=================================================="
echo ""

# 1. PostgreSQL rodando?
check_item "PostgreSQL está rodando" "pg_isready -h $DB_HOST -p $DB_PORT"

# 2. Conexão com banco funciona?
check_item "Conexão com banco funciona" "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c 'SELECT 1'"

# 3. Tabela users existe?
check_item "Tabela 'users' existe" "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc \"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')\" | grep -q 't'"

# 4. Tabela user_style_preferences existe?
check_item "Tabela 'user_style_preferences' existe" "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc \"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_style_preferences')\" | grep -q 't'"

# 5. Tabela style_choices existe?
check_item "Tabela 'style_choices' existe" "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc \"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'style_choices')\" | grep -q 't'"

# 6. Tabela schema_migrations existe?
check_item "Tabela 'schema_migrations' existe" "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc \"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schema_migrations')\" | grep -q 't'"

# 7. Usuário de teste existe?
check_item "Usuário de teste existe" "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc \"SELECT EXISTS (SELECT FROM users WHERE email = 'teste@matchit.com')\" | grep -q 't'"

# 8. Índices essenciais existem?
check_item "Índice em users.email existe" "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc \"SELECT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%email%')\" | grep -q 't'"

echo ""
echo "=================================================="

if [ $ISSUES -eq 0 ]; then
    print_success "🎉 BANCO PRONTO PARA FASE 0!"
    echo ""
    print_info "Próximo passo: Execute ./scripts/finalize-phase0.sh"
    echo ""
    exit 0
else
    print_error "❌ $ISSUES problema(s) encontrado(s)"
    echo ""
    print_warning "Soluções:"
    echo "   1. Execute: ./scripts/setup-database-phase0.sh"
    echo "   2. Ou verifique se PostgreSQL está configurado corretamente"
    echo "   3. Ou execute: ./scripts/manage-database.sh para diagnosticar"
    echo ""
    exit 1
fi