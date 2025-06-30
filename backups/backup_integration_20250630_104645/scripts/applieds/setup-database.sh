#!/bin/bash
# scripts/setup-database.sh - Script de Setup do Banco de Dados MatchIt

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações do banco
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-matchit_db}
DB_USER=${DB_USER:-matchit}
DB_PASSWORD=${DB_PASSWORD:-matchit123}

echo -e "${BLUE}🚀 Setup do Banco de Dados MatchIt${NC}"
echo "=================================="

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se PostgreSQL está instalado
if ! command_exists psql; then
    echo -e "${RED}❌ PostgreSQL não encontrado. Por favor, instale primeiro.${NC}"
    exit 1
fi

# Verificar se PostgreSQL está rodando
if ! pg_isready -h $DB_HOST -p $DB_PORT >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ PostgreSQL não está rodando. Tentando iniciar...${NC}"
    
    # Tentar iniciar PostgreSQL (Linux/macOS)
    if command_exists systemctl; then
        sudo systemctl start postgresql
    elif command_exists brew; then
        brew services start postgresql
    else
        echo -e "${RED}❌ Não foi possível iniciar PostgreSQL automaticamente.${NC}"
        echo "Por favor, inicie manualmente e execute o script novamente."
        exit 1
    fi
    
    # Aguardar PostgreSQL ficar disponível
    echo "Aguardando PostgreSQL iniciar..."
    sleep 3
fi

echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"

# Função para executar comando SQL como superusuário
run_as_superuser() {
    local sql_command="$1"
    if command_exists sudo; then
        sudo -u postgres psql -c "$sql_command"
    else
        # Windows ou ambiente sem sudo
        psql -U postgres -c "$sql_command"
    fi
}

# Verificar/criar usuário
echo -e "${BLUE}👤 Verificando usuário $DB_USER...${NC}"

USER_EXISTS=$(run_as_superuser "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" 2>/dev/null | grep -c "1" || echo "0")

if [ "$USER_EXISTS" = "0" ]; then
    echo -e "${YELLOW}📝 Criando usuário $DB_USER...${NC}"
    run_as_superuser "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    run_as_superuser "ALTER USER $DB_USER CREATEDB;"
    echo -e "${GREEN}✅ Usuário $DB_USER criado${NC}"
else
    echo -e "${GREEN}✅ Usuário $DB_USER já existe${NC}"
fi

# Verificar/criar banco de dados
echo -e "${BLUE}🗄️ Verificando banco $DB_NAME...${NC}"

DB_EXISTS=$(run_as_superuser "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null | grep -c "1" || echo "0")

if [ "$DB_EXISTS" = "0" ]; then
    echo -e "${YELLOW}📝 Criando banco $DB_NAME...${NC}"
    run_as_superuser "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo -e "${GREEN}✅ Banco $DB_NAME criado${NC}"
else
    echo -e "${GREEN}✅ Banco $DB_NAME já existe${NC}"
fi

# Conceder permissões
echo -e "${BLUE}🔐 Configurando permissões...${NC}"
run_as_superuser "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
run_as_superuser "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"

# Configurar .pgpass para facilitar conexões futuras
echo -e "${BLUE}🔑 Configurando .pgpass...${NC}"
PGPASS_FILE="$HOME/.pgpass"
PGPASS_ENTRY="$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASSWORD"

# Remover entrada existente se houver
if [ -f "$PGPASS_FILE" ]; then
    grep -v "^$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:" "$PGPASS_FILE" > "$PGPASS_FILE.tmp" || true
    mv "$PGPASS_FILE.tmp" "$PGPASS_FILE"
fi

# Adicionar nova entrada
echo "$PGPASS_ENTRY" >> "$PGPASS_FILE"
chmod 600 "$PGPASS_FILE"
echo -e "${GREEN}✅ .pgpass configurado${NC}"

# Testar conexão
echo -e "${BLUE}🔌 Testando conexão...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexão bem-sucedida!${NC}"
else
    echo -e "${RED}❌ Falha na conexão${NC}"
    exit 1
fi

# Verificar se arquivo de migração existe
MIGRATION_FILE="database/migrations/002_emotional_profile_schema.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Arquivo de migração não encontrado: $MIGRATION_FILE${NC}"
    echo "Por favor, certifique-se de que está no diretório correto do projeto."
    exit 1
fi

# Executar migração do perfil emocional
echo -e "${BLUE}📦 Executando migração do perfil emocional...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migração executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na execução da migração${NC}"
    exit 1
fi

# Verificar tabelas criadas
echo -e "${BLUE}🔍 Verificando tabelas criadas...${NC}"
TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'emotional%';" | tr -d ' ')

if [ -n "$TABLES" ]; then
    echo -e "${GREEN}✅ Tabelas criadas:${NC}"
    echo "$TABLES" | while read -r table; do
        if [ -n "$table" ]; then
            echo "  - $table"
        fi
    done
else
    echo -e "${YELLOW}⚠️ Nenhuma tabela emocional encontrada${NC}"
fi

# Testar funções criadas
echo -e "${BLUE}🧪 Testando funções do banco...${NC}"
FUNCTION_TEST=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT calculate_profile_quality_score('test');" 2>/dev/null || echo "ERRO")

if [ "$FUNCTION_TEST" != "ERRO" ]; then
    echo -e "${GREEN}✅ Funções do banco funcionando${NC}"
else
    echo -e "${YELLOW}⚠️ Algumas funções podem não estar disponíveis${NC}"
fi

# Configurações finais e summary
echo ""
echo -e "${GREEN}🎉 Setup do banco concluído com sucesso!${NC}"
echo "=================================="
echo -e "${BLUE}📋 Informações de Conexão:${NC}"
echo "  Host: $DB_HOST"
echo "  Porta: $DB_PORT"
echo "  Banco: $DB_NAME"
echo "  Usuário: $DB_USER"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo "  Conectar ao banco:"
echo "    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo ""
echo "  Verificar tabelas:"
echo "    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"\\dt emotional*\""
echo ""
echo "  Executar query de teste:"
echo "    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT COUNT(*) FROM emotional_profiles;\""
echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo "  1. Configurar variáveis de ambiente na aplicação"
echo "  2. Executar testes de integração"
echo "  3. Iniciar desenvolvimento da Fase 1"
echo ""
echo -e "${GREEN}✅ Pronto para desenvolvimento!${NC}"