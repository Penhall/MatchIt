#!/bin/bash
# scripts/manage-database.sh - Utilitários para gerenciar o banco de dados

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

print_header() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Função para executar SQL
execute_sql() {
    local sql="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$sql"
}

# Função para executar SQL e capturar resultado
execute_sql_quiet() {
    local sql="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "$sql"
}

# Verificar status do banco
check_status() {
    print_header "🔍 STATUS DO BANCO DE DADOS"
    
    # Verificar conexão
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Conexão com banco OK"
    else
        print_error "Não foi possível conectar ao banco"
        return 1
    fi
    
    # Verificar versão do PostgreSQL
    local version=$(execute_sql_quiet "SELECT version();")
    print_info "PostgreSQL: $(echo $version | cut -d' ' -f1-2)"
    
    # Verificar tabelas existentes
    print_info "Verificando tabelas..."
    local tables=$(execute_sql_quiet "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    
    if [ -z "$tables" ]; then
        print_warning "Nenhuma tabela encontrada"
    else
        echo "$tables" | while read table; do
            if [ ! -z "$table" ]; then
                local count=$(execute_sql_quiet "SELECT COUNT(*) FROM $table;")
                print_success "Tabela $table: $count registros"
            fi
        done
    fi
    
    # Verificar migrações executadas
    if execute_sql_quiet "SELECT 1 FROM schema_migrations LIMIT 1;" > /dev/null 2>&1; then
        local migrations_count=$(execute_sql_quiet "SELECT COUNT(*) FROM schema_migrations;")
        print_info "Migrações executadas: $migrations_count"
        
        print_info "Últimas migrações:"
        execute_sql "SELECT version, filename, executed_at FROM schema_migrations ORDER BY executed_at DESC LIMIT 5;"
    else
        print_warning "Tabela de migrações não encontrada"
    fi
    
    # Estatísticas gerais
    print_info "Estatísticas:"
    if execute_sql_quiet "SELECT 1 FROM users LIMIT 1;" > /dev/null 2>&1; then
        local users_count=$(execute_sql_quiet "SELECT COUNT(*) FROM users;")
        print_info "  👥 Usuários: $users_count"
    fi
    
    if execute_sql_quiet "SELECT 1 FROM user_style_preferences LIMIT 1;" > /dev/null 2>&1; then
        local prefs_count=$(execute_sql_quiet "SELECT COUNT(*) FROM user_style_preferences;")
        print_info "  🎨 Preferências: $prefs_count"
    fi
    
    if execute_sql_quiet "SELECT 1 FROM style_choices LIMIT 1;" > /dev/null 2>&1; then
        local choices_count=$(execute_sql_quiet "SELECT COUNT(*) FROM style_choices;")
        print_info "  ⚡ Escolhas: $choices_count"
    fi
}

# Limpar banco de dados
clean_database() {
    print_header "🧹 LIMPANDO BANCO DE DADOS"
    
    print_warning "ATENÇÃO: Esta ação irá remover TODOS os dados!"
    read -p "Tem certeza? Digite 'sim' para confirmar: " confirm
    
    if [ "$confirm" != "sim" ]; then
        print_info "Operação cancelada"
        return 0
    fi
    
    print_info "Removendo todas as tabelas..."
    
    # Listar todas as tabelas
    local tables=$(execute_sql_quiet "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    
    if [ ! -z "$tables" ]; then
        # Desabilitar constraints temporariamente
        execute_sql "SET session_replication_role = replica;" > /dev/null 2>&1
        
        echo "$tables" | while read table; do
            if [ ! -z "$table" ]; then
                print_info "Removendo tabela: $table"
                execute_sql "DROP TABLE IF EXISTS $table CASCADE;" > /dev/null 2>&1
            fi
        done
        
        # Reabilitar constraints
        execute_sql "SET session_replication_role = DEFAULT;" > /dev/null 2>&1
    fi
    
    # Remover tipos customizados
    print_info "Removendo tipos customizados..."
    execute_sql "DROP TYPE IF EXISTS tournament_category_enum CASCADE;" > /dev/null 2>&1
    execute_sql "DROP TYPE IF EXISTS tournament_status_enum CASCADE;" > /dev/null 2>&1
    
    # Remover funções
    print_info "Removendo funções..."
    execute_sql "DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;" > /dev/null 2>&1
    
    print_success "Banco limpo com sucesso!"
    print_info "Execute './scripts/setup-database-phase0.sh' para recriar"
}

# Resetar dados de teste
reset_test_data() {
    print_header "🔄 RESETANDO DADOS DE TESTE"
    
    print_info "Removendo dados de teste..."
    
    # Remover escolhas de teste
    execute_sql "DELETE FROM style_choices WHERE user_id IN (SELECT id FROM users WHERE email = 'teste@matchit.com');" > /dev/null 2>&1
    
    # Remover preferências de teste
    execute_sql "DELETE FROM user_style_preferences WHERE user_id IN (SELECT id FROM users WHERE email = 'teste@matchit.com');" > /dev/null 2>&1
    
    # Remover configurações de teste
    execute_sql "DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = 'teste@matchit.com');" > /dev/null 2>&1
    
    # Remover usuário de teste
    execute_sql "DELETE FROM users WHERE email = 'teste@matchit.com';" > /dev/null 2>&1
    
    print_info "Recriando dados de teste..."
    
    # Recriar usuário de teste
    execute_sql "INSERT INTO users (name, email, age, gender, is_active) VALUES ('Usuário Teste', 'teste@matchit.com', 25, 'other', true);" > /dev/null 2>&1
    
    # Buscar ID do usuário
    local user_id=$(execute_sql_quiet "SELECT id FROM users WHERE email = 'teste@matchit.com';")
    
    if [ ! -z "$user_id" ]; then
        # Recriar configurações
        execute_sql "INSERT INTO user_settings (user_id, theme, notifications_enabled, auto_save_enabled) VALUES ($user_id, 'light', true, true);" > /dev/null 2>&1
        
        # Recriar preferências
        execute_sql "INSERT INTO user_style_preferences (user_id, category, preference_data, confidence_score) VALUES 
            ($user_id, 'colors', '{\"warm_colors\": 0.8, \"cool_colors\": 0.2}', 0.85),
            ($user_id, 'styles', '{\"casual\": 0.9, \"formal\": 0.3}', 0.75);" > /dev/null 2>&1
        
        # Recriar escolhas
        execute_sql "INSERT INTO style_choices (user_id, category, question_id, selected_option, response_time_ms, confidence_level) VALUES 
            ($user_id, 'colors', 'warm_vs_cool_1', 'warm_colors', 1500, 4),
            ($user_id, 'styles', 'casual_vs_formal_1', 'casual', 1200, 5);" > /dev/null 2>&1
        
        print_success "Dados de teste recriados"
    else
        print_error "Falha ao criar usuário de teste"
    fi
}

# Backup do banco
backup_database() {
    print_header "💾 BACKUP DO BANCO DE DADOS"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_matchit_${timestamp}.sql"
    
    print_info "Criando backup: $backup_file"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"; then
        print_success "Backup criado: $backup_file"
        
        # Mostrar tamanho do arquivo
        local size=$(du -h "$backup_file" | cut -f1)
        print_info "Tamanho: $size"
    else
        print_error "Falha ao criar backup"
        return 1
    fi
}

# Restaurar backup
restore_database() {
    print_header "📥 RESTAURAR BACKUP"
    
    # Listar backups disponíveis
    local backups=$(ls backup_matchit_*.sql 2>/dev/null)
    
    if [ -z "$backups" ]; then
        print_warning "Nenhum backup encontrado"
        return 1
    fi
    
    print_info "Backups disponíveis:"
    echo "$backups" | nl
    
    echo ""
    read -p "Digite o número do backup para restaurar (ou 'q' para sair): " choice
    
    if [ "$choice" = "q" ]; then
        print_info "Operação cancelada"
        return 0
    fi
    
    local backup_file=$(echo "$backups" | sed -n "${choice}p")
    
    if [ -z "$backup_file" ]; then
        print_error "Backup inválido"
        return 1
    fi
    
    print_warning "ATENÇÃO: Esta ação irá sobrescrever o banco atual!"
    read -p "Confirma a restauração de '$backup_file'? (sim/não): " confirm
    
    if [ "$confirm" != "sim" ]; then
        print_info "Operação cancelada"
        return 0
    fi
    
    print_info "Restaurando backup: $backup_file"
    
    # Limpar banco atual
    clean_database
    
    # Restaurar backup
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"; then
        print_success "Backup restaurado com sucesso"
    else
        print_error "Falha ao restaurar backup"
        return 1
    fi
}

# Mostrar ajuda
show_help() {
    echo ""
    echo -e "${CYAN}🗄️  GERENCIADOR DO BANCO MATCHIT${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  status    - Verificar status do banco"
    echo "  clean     - Limpar banco completamente"
    echo "  reset     - Resetar dados de teste"
    echo "  backup    - Criar backup do banco"
    echo "  restore   - Restaurar backup"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 status"
    echo "  $0 backup"
    echo "  $0 reset"
    echo ""
}

# Menu interativo
interactive_menu() {
    while true; do
        echo ""
        echo -e "${CYAN}🗄️  GERENCIADOR DO BANCO MATCHIT${NC}"
        echo ""
        echo "Escolha uma opção:"
        echo "1. Verificar status"
        echo "2. Resetar dados de teste"
        echo "3. Criar backup"
        echo "4. Restaurar backup"
        echo "5. Limpar banco (CUIDADO!)"
        echo "0. Sair"
        echo ""
        read -p "Digite sua escolha [0-5]: " choice
        
        case $choice in
            1)
                check_status
                ;;
            2)
                reset_test_data
                ;;
            3)
                backup_database
                ;;
            4)
                restore_database
                ;;
            5)
                clean_database
                ;;
            0)
                print_info "Saindo..."
                break
                ;;
            *)
                print_error "Opção inválida"
                ;;
        esac
        
        echo ""
        read -p "Pressione Enter para continuar..."
    done
}

# Função principal
main() {
    case "${1:-menu}" in
        "status")
            check_status
            ;;
        "clean")
            clean_database
            ;;
        "reset")
            reset_test_data
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database
            ;;
        "help")
            show_help
            ;;
        "menu"|"")
            interactive_menu
            ;;
        *)
            print_error "Comando inválido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar
main "$@"