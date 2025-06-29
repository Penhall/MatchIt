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
