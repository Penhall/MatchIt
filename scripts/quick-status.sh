#!/bin/bash
# scripts/quick-status.sh - Verificação rápida do status atual do projeto

# =====================================================
# CORES
# =====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}"
    echo "=========================================================================="
    echo "🔍 MatchIt - Status Atual do Projeto"
    echo "📋 Verificação Rápida da Fase 2"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
}

check_item() {
    local item="$1"
    local path="$2"
    local type="$3"  # file, dir, db
    
    case "$type" in
        "file")
            if [ -f "$path" ]; then
                echo -e "${GREEN}   ✅ $item${NC}"
                return 0
            else
                echo -e "${RED}   ❌ $item${NC}"
                return 1
            fi
            ;;
        "dir")
            if [ -d "$path" ]; then
                echo -e "${GREEN}   ✅ $item${NC}"
                return 0
            else
                echo -e "${RED}   ❌ $item${NC}"
                return 1
            fi
            ;;
        "cmd")
            if command -v "$path" &> /dev/null; then
                echo -e "${GREEN}   ✅ $item${NC}"
                return 0
            else
                echo -e "${RED}   ❌ $item${NC}"
                return 1
            fi
            ;;
    esac
}

print_section() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_info() {
    echo -e "${CYAN}   ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}   ⚠️  $1${NC}"
}

# =====================================================
# VERIFICAÇÕES
# =====================================================

check_dependencies() {
    print_section "DEPENDÊNCIAS DO SISTEMA"
    
    local score=0
    local total=4
    
    if check_item "Node.js" "node" "cmd"; then score=$((score + 1)); fi
    if check_item "npm" "npm" "cmd"; then score=$((score + 1)); fi
    if check_item "PostgreSQL" "psql" "cmd"; then score=$((score + 1)); fi
    if check_item "Git" "git" "cmd"; then score=$((score + 1)); fi
    
    echo -e "${CYAN}   📊 Score: $score/$total${NC}"
    echo ""
}

check_project_structure() {
    print_section "ESTRUTURA DO PROJETO"
    
    local score=0
    local total=8
    
    if check_item "package.json" "package.json" "file"; then score=$((score + 1)); fi
    if check_item "Arquivo .env" ".env" "file"; then score=$((score + 1)); fi
    if check_item "Diretório server/" "server" "dir"; then score=$((score + 1)); fi
    if check_item "Diretório screens/" "screens" "dir"; then score=$((score + 1)); fi
    if check_item "Diretório database/" "database" "dir"; then score=$((score + 1)); fi
    if check_item "Diretório hooks/" "hooks" "dir"; then score=$((score + 1)); fi
    if check_item "Diretório navigation/" "navigation" "dir"; then score=$((score + 1)); fi
    if check_item "Diretório scripts/" "scripts" "dir"; then score=$((score + 1)); fi
    
    echo -e "${CYAN}   📊 Score: $score/$total${NC}"
    echo ""
}

check_phase2_files() {
    print_section "ARQUIVOS DA FASE 2"
    
    local score=0
    local total=7
    
    # Backend files
    if check_item "TournamentEngine.js" "server/services/TournamentEngine.js" "file"; then score=$((score + 1)); fi
    if check_item "tournament routes" "server/routes/tournament.js" "file"; then score=$((score + 1)); fi
    
    # Frontend files
    if check_item "TournamentScreen.tsx" "screens/TournamentScreen.tsx" "file"; then score=$((score + 1)); fi
    if check_item "AdminTournamentPanel.tsx" "screens/AdminTournamentPanel.tsx" "file"; then score=$((score + 1)); fi
    if check_item "TournamentMenuScreen.tsx" "screens/TournamentMenuScreen.tsx" "file"; then score=$((score + 1)); fi
    
    # Hooks and navigation
    if check_item "useTournament.ts" "hooks/useTournament.ts" "file"; then score=$((score + 1)); fi
    if check_item "AppNavigator.tsx" "navigation/AppNavigator.tsx" "file"; then score=$((score + 1)); fi
    
    echo -e "${CYAN}   📊 Score: $score/$total${NC}"
    echo ""
}

check_migrations() {
    print_section "MIGRAÇÕES DO BANCO"
    
    local score=0
    local migration_count=0
    
    if [ -d "database/migrations" ]; then
        migration_count=$(find database/migrations -name "*.sql" | wc -l)
        echo -e "${GREEN}   ✅ Diretório migrations/ existe${NC}"
        score=$((score + 1))
    else
        echo -e "${RED}   ❌ Diretório migrations/ não encontrado${NC}"
    fi
    
    if [ $migration_count -gt 0 ]; then
        echo -e "${GREEN}   ✅ $migration_count arquivo(s) de migração encontrado(s)${NC}"
        score=$((score + 1))
        
        # List migration files
        print_info "Migrações encontradas:"
        find database/migrations -name "*.sql" | while read -r file; do
            local size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
            echo -e "${CYAN}     📄 $(basename "$file") (${size} bytes)${NC}"
        done
    else
        echo -e "${RED}   ❌ Nenhuma migração encontrada${NC}"
    fi
    
    echo -e "${CYAN}   📊 Score: $score/2${NC}"
    echo ""
}

check_database_connection() {
    print_section "CONEXÃO COM BANCO DE DADOS"
    
    # Load .env if exists
    if [ -f ".env" ]; then
        set -a
        source .env 2>/dev/null
        set +a
        echo -e "${GREEN}   ✅ Arquivo .env carregado${NC}"
        print_info "DB_NAME: ${DB_NAME:-não definido}"
        print_info "DB_USER: ${DB_USER:-não definido}"
        print_info "DB_HOST: ${DB_HOST:-não definido}"
    else
        echo -e "${RED}   ❌ Arquivo .env não encontrado${NC}"
        echo ""
        return
    fi
    
    # Test database connection
    local db_name="${DB_NAME:-matchit_tournaments}"
    
    if psql -d "$db_name" -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Conexão com banco '$db_name' estabelecida${NC}"
        
        # Check tables
        local table_count=$(psql -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        if [ "$table_count" -gt 0 ]; then
            echo -e "${GREEN}   ✅ $table_count tabela(s) encontrada(s)${NC}"
            
            # Check tournament tables specifically
            local tournament_tables=$(psql -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'tournament_%';" 2>/dev/null | xargs)
            if [ "$tournament_tables" -gt 0 ]; then
                echo -e "${GREEN}   ✅ $tournament_tables tabela(s) de torneio encontrada(s)${NC}"
            else
                echo -e "${YELLOW}   ⚠️ Nenhuma tabela de torneio encontrada${NC}"
            fi
        else
            echo -e "${YELLOW}   ⚠️ Banco existe mas está vazio${NC}"
        fi
    else
        echo -e "${RED}   ❌ Não foi possível conectar ao banco '$db_name'${NC}"
        print_warning "Verifique se o PostgreSQL está rodando"
        print_warning "Verifique as credenciais no arquivo .env"
    fi
    
    echo ""
}

check_scripts() {
    print_section "SCRIPTS DE SINCRONIZAÇÃO"
    
    local score=0
    local total=4
    
    if check_item "Script de análise" "scripts/analyze-migrations.sh" "file"; then score=$((score + 1)); fi
    if check_item "Script de sincronização" "scripts/sync-database-phase2.sh" "file"; then score=$((score + 1)); fi
    if check_item "Script master" "scripts/master-sync-phase2.sh" "file"; then score=$((score + 1)); fi
    if check_item "Script de finalização" "scripts/finalize-phase2-tournaments.sh" "file"; then score=$((score + 1)); fi
    
    echo -e "${CYAN}   📊 Score: $score/$total${NC}"
    echo ""
}

calculate_overall_score() {
    print_section "RESUMO GERAL"
    
    # Count all files that should exist for Phase 2
    local critical_files=(
        "package.json"
        ".env"
        "server/services/TournamentEngine.js"
        "server/routes/tournament.js"
        "screens/TournamentScreen.tsx"
        "screens/AdminTournamentPanel.tsx"
        "screens/TournamentMenuScreen.tsx"
        "hooks/useTournament.ts"
        "navigation/AppNavigator.tsx"
        "scripts/sync-database-phase2.sh"
        "scripts/master-sync-phase2.sh"
    )
    
    local existing_count=0
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            existing_count=$((existing_count + 1))
        fi
    done
    
    local total_files=${#critical_files[@]}
    local percentage=$((existing_count * 100 / total_files))
    
    echo -e "${CYAN}   📊 Arquivos críticos: $existing_count/$total_files ($percentage%)${NC}"
    
    # Determine status
    if [ $percentage -ge 90 ]; then
        echo -e "${GREEN}   🎉 Status: PRONTO PARA TESTE${NC}"
        print_info "Recomendação: Execute ./scripts/test-phase2-system.sh"
    elif [ $percentage -ge 70 ]; then
        echo -e "${YELLOW}   🚧 Status: QUASE PRONTO${NC}"
        print_info "Recomendação: Execute ./scripts/master-sync-phase2.sh"
    elif [ $percentage -ge 50 ]; then
        echo -e "${YELLOW}   ⚠️ Status: PARCIALMENTE IMPLEMENTADO${NC}"
        print_info "Recomendação: Execute ./scripts/sync-database-phase2.sh"
    else
        echo -e "${RED}   ❌ Status: IMPLEMENTAÇÃO INCOMPLETA${NC}"
        print_info "Recomendação: Verifique se está no diretório correto"
        print_info "              Execute novamente a implementação da Fase 2"
    fi
    
    echo ""
}

provide_recommendations() {
    print_section "PRÓXIMOS PASSOS RECOMENDADOS"
    
    # Check current state and provide specific recommendations
    if [ -f "scripts/master-sync-phase2.sh" ]; then
        echo -e "${GREEN}   1. Sincronização completa:${NC}"
        echo -e "${CYAN}      ./scripts/master-sync-phase2.sh${NC}"
        echo ""
    fi
    
    if [ -f "scripts/analyze-migrations.sh" ]; then
        echo -e "${GREEN}   2. Análise de migrações:${NC}"
        echo -e "${CYAN}      ./scripts/analyze-migrations.sh${NC}"
        echo ""
    fi
    
    if [ -f "scripts/sync-database-phase2.sh" ]; then
        echo -e "${GREEN}   3. Sincronização do banco:${NC}"
        echo -e "${CYAN}      ./scripts/sync-database-phase2.sh${NC}"
        echo ""
    fi
    
    echo -e "${GREEN}   4. Após sincronização:${NC}"
    echo -e "${CYAN}      npm install${NC}"
    echo -e "${CYAN}      npm run dev${NC}"
    echo ""
    
    echo -e "${GREEN}   5. Teste final:${NC}"
    echo -e "${CYAN}      ./scripts/test-phase2-system.sh${NC}"
    echo ""
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    # Run all checks
    check_dependencies
    check_project_structure
    check_phase2_files
    check_migrations
    check_database_connection
    check_scripts
    calculate_overall_score
    provide_recommendations
    
    echo -e "${PURPLE}"
    echo "=========================================================================="
    echo "✅ Verificação de status concluída"
    echo "📋 Use as recomendações acima para próximos passos"
    echo "=========================================================================="
    echo -e "${NC}"
}

# =====================================================
# EXECUÇÃO
# =====================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi