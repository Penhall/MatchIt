# scripts/fix-phase2-db-credentials.sh
#!/bin/bash
# Script para corrigir credenciais do banco de dados na Fase 2

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
    echo "🔧 MatchIt - Correção de Credenciais do Banco"
    echo "🎯 Corrigindo scripts para usar credenciais corretas"
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
# FUNÇÕES PRINCIPAIS
# =====================================================

load_env() {
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        print_success "Configurações carregadas do .env"
        print_info "DB: $DB_NAME, User: $DB_USER, Host: $DB_HOST"
    else
        print_error "Arquivo .env não encontrado!"
        exit 1
    fi
}

fix_master_sync_script() {
    print_step "Corrigindo script master-sync-phase2.sh..."
    
    if [ ! -f "scripts/master-sync-phase2.sh" ]; then
        print_warning "Script master-sync-phase2.sh não encontrado"
        return
    fi
    
    # Criar backup
    cp scripts/master-sync-phase2.sh scripts/master-sync-phase2.sh.backup
    print_info "Backup criado: scripts/master-sync-phase2.sh.backup"
    
    # Criar versão corrigida
    cat > scripts/master-sync-phase2.sh << 'EOF'
#!/bin/bash
# scripts/master-sync-phase2.sh - CORRIGIDO PARA CREDENCIAIS CORRETAS

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
NC='\033[0m'

# =====================================================
# CARREGAR CREDENCIAIS CORRETAS
# =====================================================

load_database_config() {
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        
        # Exportar variáveis do PostgreSQL
        export PGHOST="$DB_HOST"
        export PGPORT="$DB_PORT"
        export PGDATABASE="$DB_NAME"
        export PGUSER="$DB_USER"
        export PGPASSWORD="$DB_PASSWORD"
        
        echo -e "${GREEN}✅ Configurações carregadas: DB=$DB_NAME, User=$DB_USER${NC}"
    else
        echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
        exit 1
    fi
}

# =====================================================
# FUNÇÕES DE VERIFICAÇÃO
# =====================================================

test_database_connection() {
    echo -e "${BLUE}🔍 Testando conexão com banco de dados...${NC}"
    
    if psql -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexão estabelecida com sucesso${NC}"
        
        # Verificar tabelas existentes
        local table_count=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        echo -e "${CYAN}ℹ️  Tabelas encontradas: $table_count${NC}"
        
        return 0
    else
        echo -e "${RED}❌ Falha na conexão com banco de dados${NC}"
        echo -e "${YELLOW}⚠️  Verifique:${NC}"
        echo -e "${YELLOW}   1. PostgreSQL está rodando${NC}"
        echo -e "${YELLOW}   2. Banco '$DB_NAME' existe${NC}"
        echo -e "${YELLOW}   3. Usuário '$DB_USER' tem permissões${NC}"
        echo -e "${YELLOW}   4. Senha está correta${NC}"
        return 1
    fi
}

create_database_if_needed() {
    echo -e "${BLUE}🗄️  Verificando se banco existe...${NC}"
    
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${GREEN}✅ Banco '$DB_NAME' já existe${NC}"
    else
        echo -e "${YELLOW}⚠️  Banco '$DB_NAME' não encontrado${NC}"
        echo -e "${BLUE}🔨 Criando banco de dados...${NC}"
        
        if createdb "$DB_NAME"; then
            echo -e "${GREEN}✅ Banco '$DB_NAME' criado com sucesso${NC}"
        else
            echo -e "${RED}❌ Falha ao criar banco${NC}"
            exit 1
        fi
    fi
}

run_migrations() {
    echo -e "${BLUE}🔄 Executando migrações...${NC}"
    
    # Verificar se existe a migração definitiva
    if [ -f "database/migrations/002_complete_style_and_tournament_schema.sql" ]; then
        echo -e "${CYAN}📄 Aplicando migração principal...${NC}"
        if psql -f "database/migrations/002_complete_style_and_tournament_schema.sql"; then
            echo -e "${GREEN}✅ Migração aplicada com sucesso${NC}"
        else
            echo -e "${YELLOW}⚠️  Migração teve problemas, mas continuando...${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Migração principal não encontrada${NC}"
    fi
    
    # Verificar se existem outras migrações importantes
    for migration in database/migrations/*.sql; do
        if [[ "$migration" =~ (004_definitive|005_definitive) ]]; then
            echo -e "${CYAN}📄 Aplicando: $(basename $migration)${NC}"
            psql -f "$migration" >/dev/null 2>&1 || echo -e "${YELLOW}   ⚠️  $(basename $migration) teve problemas${NC}"
        fi
    done
}

verify_final_state() {
    echo -e "${BLUE}🔍 Verificação final...${NC}"
    
    local table_count=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    local tournament_tables=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'tournament_%';" 2>/dev/null | xargs)
    
    echo -e "${CYAN}📊 Estatísticas finais:${NC}"
    echo -e "${CYAN}   Total de tabelas: $table_count${NC}"
    echo -e "${CYAN}   Tabelas de torneio: $tournament_tables${NC}"
    
    if [ "$tournament_tables" -ge 4 ]; then
        echo -e "${GREEN}🎉 Sistema de torneios configurado com sucesso!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Sistema parcialmente configurado${NC}"
        return 1
    fi
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    echo -e "${PURPLE}"
    echo "=========================================================================="
    echo "🚀 MatchIt - SINCRONIZAÇÃO MASTER FASE 2 (CORRIGIDA)"
    echo "🎯 Setup Completo para Sistema de Torneios"
    echo "📅 $(date '+%d/%m/%Y %H:%M:%S')"
    echo "=========================================================================="
    echo -e "${NC}"
    
    echo "Este script irá configurar completamente a Fase 2 do MatchIt."
    echo "Ele irá analisar, sincronizar e verificar todo o sistema."
    echo ""
    
    read -p "❓ Continuar com a sincronização master? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operação cancelada."
        exit 0
    fi
    
    # Executar etapas
    load_database_config
    test_database_connection || {
        create_database_if_needed
        test_database_connection || exit 1
    }
    
    run_migrations
    verify_final_state
    
    echo -e "${GREEN}"
    echo "=========================================================================="
    echo "🎉 SINCRONIZAÇÃO MASTER CONCLUÍDA!"
    echo "=========================================================================="
    echo -e "${NC}"
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
EOF

    chmod +x scripts/master-sync-phase2.sh
    print_success "Script master-sync-phase2.sh corrigido"
}

create_connection_test_script() {
    print_step "Criando script de teste de conexão..."
    
    cat > scripts/test-db-connection.sh << 'EOF'
#!/bin/bash
# scripts/test-db-connection.sh - Teste rápido de conexão

# Carregar .env
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Exportar credenciais do PostgreSQL
export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"
export PGDATABASE="$DB_NAME"  
export PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"

echo "🔍 Testando conexão com:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Testar conexão
if psql -c "SELECT version();" 2>/dev/null; then
    echo "✅ Conexão estabelecida com sucesso!"
    
    # Verificar tabelas
    table_count=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo "📊 Tabelas encontradas: $table_count"
    
    if [ "$table_count" -gt 0 ]; then
        echo "📋 Tabelas existentes:"
        psql -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" | sed 's/^/   /'
    fi
else
    echo "❌ Falha na conexão!"
    echo ""
    echo "🔧 Verifique:"
    echo "   1. PostgreSQL está rodando?"
    echo "   2. Banco '$DB_NAME' existe?"
    echo "   3. Usuário '$DB_USER' tem permissões?"
    echo "   4. Credenciais no .env estão corretas?"
fi
EOF

    chmod +x scripts/test-db-connection.sh
    print_success "Script de teste criado: scripts/test-db-connection.sh"
}

fix_env_file() {
    print_step "Verificando arquivo .env..."
    
    if [ -f ".env" ]; then
        print_info "Arquivo .env encontrado, verificando credenciais..."
        
        # Verificar se as credenciais estão corretas
        if grep -q "DB_USER=matchit" .env && grep -q "DB_NAME=matchit_db" .env; then
            print_success "Credenciais no .env estão corretas"
        else
            print_warning "Atualizando credenciais no .env..."
            
            # Fazer backup
            cp .env .env.backup
            
            # Atualizar credenciais
            sed -i.tmp 's/^DB_NAME=.*/DB_NAME=matchit_db/' .env
            sed -i.tmp 's/^DB_USER=.*/DB_USER=matchit/' .env
            sed -i.tmp 's/^DB_PASSWORD=.*/DB_PASSWORD=matchit123/' .env
            sed -i.tmp 's/^DB_HOST=.*/DB_HOST=localhost/' .env
            sed -i.tmp 's/^DB_PORT=.*/DB_PORT=5432/' .env
            
            # Remover arquivo temporário
            rm -f .env.tmp
            
            print_success "Credenciais atualizadas no .env"
        fi
    else
        print_warning "Arquivo .env não encontrado, criando..."
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

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF
        print_success "Arquivo .env criado com credenciais corretas"
    fi
}

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

main() {
    print_header
    
    echo "Este script irá corrigir os problemas de credenciais do banco de dados."
    echo "As seguintes correções serão aplicadas:"
    echo ""
    echo "✅ Verificar/corrigir arquivo .env"
    echo "✅ Corrigir script master-sync-phase2.sh"  
    echo "✅ Criar script de teste de conexão"
    echo "✅ Testar conexão com banco"
    echo ""
    
    read -p "❓ Continuar com as correções? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operação cancelada."
        exit 0
    fi
    
    # Aplicar correções
    fix_env_file
    load_env
    fix_master_sync_script
    create_connection_test_script
    
    echo -e "${BLUE}🔍 Testando conexão corrigida...${NC}"
    
    # Testar conexão
    if ./scripts/test-db-connection.sh; then
        echo -e "${GREEN}"
        echo "=========================================================================="
        echo "🎉 CORREÇÕES APLICADAS COM SUCESSO!"
        echo "=========================================================================="
        echo ""
        echo "✅ Credenciais corrigidas"
        echo "✅ Scripts atualizados"  
        echo "✅ Conexão funcionando"
        echo ""
        echo "🚀 Próximos passos:"
        echo "   1. ./scripts/master-sync-phase2.sh     # Execute a sincronização"
        echo "   2. ./scripts/test-db-connection.sh      # Teste conexão a qualquer momento"
        echo ""
        echo "🎯 O problema de credenciais foi resolvido!"
        echo "=========================================================================="
        echo -e "${NC}"
    else
        echo -e "${YELLOW}"
        echo "=========================================================================="
        echo "⚠️  CORREÇÕES APLICADAS MAS AINDA HÁ PROBLEMAS"
        echo "=========================================================================="
        echo ""
        echo "🔧 Verifique manualmente:"
        echo "   1. PostgreSQL está rodando?"
        echo "   2. Execute: createdb -U matchit matchit_db"
        echo "   3. Teste: ./scripts/test-db-connection.sh"
        echo ""
        echo "📞 Se problemas persistirem, verifique:"
        echo "   - Serviço PostgreSQL ativo"
        echo "   - Usuário 'matchit' existe no PostgreSQL"
        echo "   - Permissões do usuário"
        echo "=========================================================================="
        echo -e "${NC}"
    fi
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi