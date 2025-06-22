#!/bin/bash
# scripts/fix/fix_profile_api.sh - Script de correção completa do problema de perfil
# Arquivo: scripts/fix/fix_profile_api.sh

# =====================================================
# SCRIPT DE CORREÇÃO - PROBLEMA DO PERFIL API
# =====================================================

set -e  # Para em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações do banco
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-matchit}"
DB_PASSWORD="${DB_PASSWORD:-matchit123}"
DB_NAME="${DB_NAME:-matchit_db}"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   MATCHIT - CORREÇÃO DO PROBLEMA DE PERFIL${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Função para executar SQL
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "${YELLOW}Executando: ${description}${NC}"
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$sql_file"; then
        echo -e "${GREEN}✅ ${description} executado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao executar ${description}${NC}"
        echo "Arquivo: $sql_file"
        return 1
    fi
    echo ""
}

# Verificar conexão com o banco
echo -e "${YELLOW}1. Verificando conexão com o banco...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao banco de dados${NC}"
    echo "Verifique as configurações:"
    echo "  Host: $DB_HOST"
    echo "  Porta: $DB_PORT"
    echo "  Usuário: $DB_USER"
    echo "  Banco: $DB_NAME"
    exit 1
fi
echo -e "${GREEN}✅ Conexão estabelecida${NC}"
echo ""

# Criar diretório de scripts se não existir
mkdir -p scripts/fix

# Executar correções
echo -e "${BLUE}2. Executando correções do banco de dados...${NC}"

# Passo 1: Criar tabelas principais
execute_sql "scripts/fix/001_create_users_tables.sql" "Criação das tabelas users e user_profiles"

# Passo 2: Criar tabelas de estilo
execute_sql "scripts/fix/002_create_style_tables.sql" "Criação das tabelas de estilo"

# Passo 3: Inserir usuário de teste
execute_sql "scripts/fix/003_insert_test_user.sql" "Inserção de usuário de teste"

# Passo 4: Executar diagnóstico
echo -e "${BLUE}3. Executando diagnóstico...${NC}"
execute_sql "scripts/fix/004_diagnostic_check.sql" "Diagnóstico do banco"

# Verificar se o ProfileService precisa ser atualizado
echo -e "${BLUE}4. Verificações adicionais...${NC}"

# Testar a API com curl
echo -e "${YELLOW}Testando API com curl...${NC}"
RESPONSE=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxODIwMTE0Yy0zNDhhLTQ1NWQtOGZhNi1kZWNhZjFlZjYxZmIiLCJlbWFpbCI6ImZpbmFsdGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MDQ0NjMzMCwiZXhwIjoxNzUzMDM4MzMwfQ.5JjYitbMG4xJKJY4A8Kc3nqM4MCHFqPimY9W7wqEuL0" \
    http://localhost:3001/api/profile/1820114c-348a-455d-8fa6-decaf1ef61fb \
    -o /tmp/api_response.json 2>/dev/null)

echo "Status HTTP: $RESPONSE"

if [ -f /tmp/api_response.json ]; then
    echo "Resposta da API:"
    cat /tmp/api_response.json | jq . 2>/dev/null || cat /tmp/api_response.json
    echo ""
    rm -f /tmp/api_response.json
fi

# Verificar logs do servidor
echo -e "${YELLOW}Últimas linhas do log do servidor:${NC}"
if [ -f "server.log" ]; then
    tail -10 server.log
elif docker ps | grep -q "matchit.*backend"; then
    docker logs --tail=10 $(docker ps -q -f name=backend)
else
    echo "Logs do servidor não encontrados"
fi

echo ""
echo -e "${BLUE}5. Instruções para próximos passos:${NC}"
echo ""
echo -e "${GREEN}Se a API ainda estiver falhando:${NC}"
echo "1. Reinicie o servidor backend:"
echo "   npm run dev  # ou"
echo "   docker-compose restart backend"
echo ""
echo "2. Verifique se o ProfileService foi atualizado:"
echo "   - Arquivo: server/services/profileService.js"
echo "   - Deve incluir tratamento de erros robusto"
echo ""
echo "3. Teste novamente com curl:"
echo "   curl -H \"Authorization: Bearer [SEU_TOKEN]\" http://localhost:3001/api/profile/1820114c-348a-455d-8fa6-decaf1ef61fb"
echo ""
echo -e "${GREEN}Se a API estiver funcionando:${NC}"
echo "✅ Problema resolvido! O usuário de teste foi criado e as tabelas estão funcionais."
echo ""
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   CORREÇÃO CONCLUÍDA${NC}"
echo -e "${BLUE}=====================================================${NC}"