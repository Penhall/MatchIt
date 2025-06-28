#!/bin/bash
# scripts/analyze-migrations.sh - Analisador inteligente das migrações existentes

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

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "${PURPLE}"
    echo "=========================================================================="
    echo "🔍 MatchIt - Análise de Migrações"
    echo "📋 Identificando diferenças e versão definitiva"
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

# =====================================================
# ANÁLISE DE MIGRAÇÕES
# =====================================================

analyze_migration_files() {
    print_step "Analisando arquivos de migração existentes..."
    
    local migration_dir="database/migrations"
    local migrations_found=()
    
    if [ -d "$migration_dir" ]; then
        while IFS= read -r -d '' file; do
            migrations_found+=("$file")
        done < <(find "$migration_dir" -name "*.sql" -print0 2>/dev/null)
    fi
    
    if [ ${#migrations_found[@]} -eq 0 ]; then
        print_warning "Nenhuma migração encontrada em $migration_dir"
        return 1
    fi
    
    echo -e "${CYAN}"
    echo "📁 Migrações encontradas:"
    for migration in "${migrations_found[@]}"; do
        local file_size=$(stat -f%z "$migration" 2>/dev/null || stat -c%s "$migration" 2>/dev/null || echo "unknown")
        local mod_time=$(stat -f%Sm -t%Y-%m-%d\ %H:%M "$migration" 2>/dev/null || stat -c%y "$migration" 2>/dev/null | cut -d' ' -f1-2)
        echo "   📄 $(basename "$migration") (${file_size} bytes, modified: $mod_time)"
    done
    echo -e "${NC}"
    
    return 0
}

extract_tables_from_migration() {
    local migration_file="$1"
    local temp_file="/tmp/tables_$(basename "$migration_file").txt"
    
    # Extract CREATE TABLE statements
    grep -i "CREATE TABLE" "$migration_file" 2>/dev/null | \
    sed 's/.*CREATE TABLE[^A-Za-z_]*\([A-Za-z_][A-Za-z0-9_]*\).*/\1/' | \
    sort | uniq > "$temp_file"
    
    echo "$temp_file"
}

extract_enums_from_migration() {
    local migration_file="$1"
    local temp_file="/tmp/enums_$(basename "$migration_file").txt"
    
    # Extract CREATE TYPE statements for enums
    grep -i "CREATE TYPE.*AS ENUM" "$migration_file" 2>/dev/null | \
    sed 's/.*CREATE TYPE[^A-Za-z_]*\([A-Za-z_][A-Za-z0-9_]*\).*/\1/' | \
    sort | uniq > "$temp_file"
    
    echo "$temp_file"
}

compare_migrations() {
    print_step "Comparando estruturas das migrações..."
    
    local migration_dir="database/migrations"
    
    # Find all SQL migration files
    local migrations=($(find "$migration_dir" -name "*.sql" 2>/dev/null | sort))
    
    if [ ${#migrations[@]} -lt 2 ]; then
        print_warning "Menos de 2 migrações encontradas. Comparação não necessária."
        return 0
    fi
    
    echo -e "${YELLOW}"
    echo "🔄 Comparando estruturas:"
    echo -e "${NC}"
    
    # Compare tables
    local table_files=()
    local enum_files=()
    
    for migration in "${migrations[@]}"; do
        local migration_name=$(basename "$migration" .sql)
        echo -e "${CYAN}📄 Analisando: $migration_name${NC}"
        
        # Extract tables and enums
        local table_file=$(extract_tables_from_migration "$migration")
        local enum_file=$(extract_enums_from_migration "$migration")
        
        table_files+=("$table_file")
        enum_files+=("$enum_file")
        
        # Show content
        if [ -s "$table_file" ]; then
            echo "   📊 Tabelas: $(cat "$table_file" | tr '\n' ' ')"
        else
            echo "   📊 Tabelas: nenhuma encontrada"
        fi
        
        if [ -s "$enum_file" ]; then
            echo "   🏷️  Enums: $(cat "$enum_file" | tr '\n' ' ')"
        else
            echo "   🏷️  Enums: nenhum encontrado"
        fi
        echo ""
    done
    
    # Find differences
    print_info "Identificando diferenças..."
    
    if [ ${#table_files[@]} -ge 2 ]; then
        local base_tables="${table_files[0]}"
        for ((i=1; i<${#table_files[@]}; i++)); do
            local current_tables="${table_files[$i]}"
            local migration_name=$(basename "${migrations[$i]}" .sql)
            
            # Tables only in base
            local only_in_base=$(comm -23 "$base_tables" "$current_tables" 2>/dev/null)
            # Tables only in current
            local only_in_current=$(comm -13 "$base_tables" "$current_tables" 2>/dev/null)
            # Common tables
            local common_tables=$(comm -12 "$base_tables" "$current_tables" 2>/dev/null)
            
            if [ -n "$only_in_base" ]; then
                print_warning "Tabelas apenas em $(basename "${migrations[0]}"): $only_in_base"
            fi
            
            if [ -n "$only_in_current" ]; then
                print_warning "Tabelas apenas em $migration_name: $only_in_current"
            fi
            
            if [ -n "$common_tables" ]; then
                print_success "Tabelas comuns: $(echo "$common_tables" | tr '\n' ' ')"
            fi
        done
    fi
    
    # Cleanup
    for file in "${table_files[@]}" "${enum_files[@]}"; do
        rm -f "$file"
    done
}

identify_definitive_version() {
    print_step "Identificando versão definitiva..."
    
    local migration_dir="database/migrations"
    local migrations=($(find "$migration_dir" -name "*.sql" 2>/dev/null | sort))
    
    local best_migration=""
    local best_score=0
    
    for migration in "${migrations[@]}"; do
        local score=0
        local migration_name=$(basename "$migration")
        
        print_info "Avaliando: $migration_name"
        
        # Check for key indicators of completeness
        
        # Has users table
        if grep -q "CREATE TABLE.*users" "$migration" 2>/dev/null; then
            score=$((score + 10))
            echo "   ✅ Tabela users: +10"
        fi
        
        # Has tournament tables
        local tournament_tables=(
            "tournament_images"
            "tournament_sessions" 
            "tournament_choices"
            "tournament_results"
        )
        
        for table in "${tournament_tables[@]}"; do
            if grep -q "CREATE TABLE.*$table" "$migration" 2>/dev/null; then
                score=$((score + 15))
                echo "   ✅ Tabela $table: +15"
            fi
        done
        
        # Has enums
        if grep -q "tournament_category_enum" "$migration" 2>/dev/null; then
            score=$((score + 10))
            echo "   ✅ Enum categorias: +10"
        fi
        
        if grep -q "tournament_status_enum" "$migration" 2>/dev/null; then
            score=$((score + 10))
            echo "   ✅ Enum status: +10"
        fi
        
        # Has indexes
        if grep -q "CREATE INDEX" "$migration" 2>/dev/null; then
            local index_count=$(grep -c "CREATE INDEX" "$migration" 2>/dev/null)
            score=$((score + index_count))
            echo "   ✅ Índices ($index_count): +$index_count"
        fi
        
        # Has triggers
        if grep -q "CREATE TRIGGER\|CREATE.*FUNCTION" "$migration" 2>/dev/null; then
            score=$((score + 5))
            echo "   ✅ Triggers/Funções: +5"
        fi
        
        # File size bonus (larger files tend to be more complete)
        local file_size=$(stat -f%z "$migration" 2>/dev/null || stat -c%s "$migration" 2>/dev/null || echo "0")
        if [ "$file_size" -gt 10000 ]; then
            score=$((score + 5))
            echo "   ✅ Arquivo grande (${file_size} bytes): +5"
        fi
        
        # Recent modification bonus
        if [ "$migration_name" == "002_complete_style_and_tournament_schema.sql" ]; then
            score=$((score + 20))
            echo "   ✅ Schema completo (nome): +20"
        fi
        
        echo "   📊 Score total: $score"
        echo ""
        
        if [ $score -gt $best_score ]; then
            best_score=$score
            best_migration="$migration"
        fi
    done
    
    if [ -n "$best_migration" ]; then
        echo -e "${GREEN}"
        echo "🏆 VERSÃO DEFINITIVA IDENTIFICADA:"
        echo "   📄 Arquivo: $(basename "$best_migration")"
        echo "   📊 Score: $best_score pontos"
        echo "   📍 Caminho: $best_migration"
        echo -e "${NC}"
        
        # Save the result
        echo "$best_migration" > /tmp/definitive_migration
        return 0
    else
        print_error "Não foi possível identificar uma versão definitiva"
        return 1
    fi
}

check_database_current_state() {
    print_step "Verificando estado atual do banco de dados..."
    
    DB_NAME="${DB_NAME:-matchit_tournaments}"
    
    # Test connection
    if ! psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        print_warning "Não foi possível conectar ao banco $DB_NAME"
        print_info "O banco será criado durante a sincronização"
        return 1
    fi
    
    # Check existing tables
    local existing_tables=$(psql -d "$DB_NAME" -t -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    " 2>/dev/null | xargs)
    
    if [ -n "$existing_tables" ]; then
        print_success "Banco conectado. Tabelas existentes:"
        echo "   📊 $existing_tables"
    else
        print_warning "Banco conectado mas sem tabelas"
    fi
    
    # Check for tournament-specific tables
    local tournament_tables_exist=$(psql -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'tournament_%';
    " 2>/dev/null | xargs)
    
    if [ "$tournament_tables_exist" -gt 0 ]; then
        print_success "Tabelas de torneio encontradas: $tournament_tables_exist"
    else
        print_warning "Nenhuma tabela de torneio encontrada"
    fi
    
    return 0
}

create_migration_report() {
    print_step "Criando relatório de migração..."
    
    local report_file="docs/migration-analysis-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p docs
    
    cat > "$report_file" << EOF
# Relatório de Análise de Migrações - MatchIt

**Data:** $(date '+%d/%m/%Y %H:%M:%S')
**Fase:** 2 - Sistema de Torneios

## 📋 Resumo Executivo

Este relatório documenta o estado das migrações do banco de dados antes da sincronização para a Fase 2.

## 🔍 Migrações Encontradas

$(ls -la database/migrations/*.sql 2>/dev/null | awk '{print "- " $9 " (" $5 " bytes, " $6 " " $7 " " $8 ")"}' || echo "Nenhuma migração encontrada")

## 🎯 Versão Definitiva Recomendada

$(if [ -f /tmp/definitive_migration ]; then
    echo "**Arquivo:** \`$(basename "$(cat /tmp/definitive_migration)")\`"
    echo ""
    echo "Esta versão foi identificada como a mais completa baseada em:"
    echo "- Presença de todas as tabelas críticas"
    echo "- Enums e índices implementados" 
    echo "- Triggers e funções configurados"
    echo "- Tamanho e completude do arquivo"
else
    echo "Não foi possível identificar automaticamente."
fi)

## 🚀 Próximos Passos

1. **Executar sincronização:** \`./scripts/sync-database-phase2.sh\`
2. **Verificar resultado:** \`./scripts/verify-database.sh\` 
3. **Aplicar dados de exemplo:** Incluído na sincronização
4. **Testar sistema:** \`npm run tournament:test\`

## 📊 Estado Atual do Banco

$(if check_database_current_state >/dev/null 2>&1; then
    echo "✅ Banco de dados acessível"
else
    echo "⚠️ Banco de dados não acessível ou inexistente"
fi)

## 🔧 Configurações Recomendadas

\`\`\`env
DB_NAME=matchit_tournaments
DB_USER=matchit_user
DB_HOST=localhost
DB_PORT=5432
\`\`\`

---

*Relatório gerado automaticamente pelo analisador de migrações MatchIt*
EOF

    print_success "Relatório criado: $report_file"
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    # Analysis steps
    if analyze_migration_files; then
        compare_migrations
        
        if identify_definitive_version; then
            check_database_current_state
            create_migration_report
            
            echo -e "${GREEN}"
            echo "=========================================================================="
            echo "📋 ANÁLISE DE MIGRAÇÕES CONCLUÍDA"
            echo "=========================================================================="
            echo ""
            echo "🎯 Resumo:"
            if [ -f /tmp/definitive_migration ]; then
                echo "   ✅ Versão definitiva: $(basename "$(cat /tmp/definitive_migration)")"
            fi
            echo "   📄 Relatório: docs/migration-analysis-*.md"
            echo ""
            echo "🚀 Recomendação:"
            echo "   Execute: ./scripts/sync-database-phase2.sh"
            echo ""
            echo "=========================================================================="
            echo -e "${NC}"
        else
            print_error "Falha na identificação da versão definitiva"
            exit 1
        fi
    else
        print_error "Nenhuma migração encontrada para análise"
        print_info "Execute primeiro a implementação dos arquivos da Fase 2"
        exit 1
    fi
}

# =====================================================
# EXECUÇÃO
# =====================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi