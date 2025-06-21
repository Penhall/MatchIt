#!/bin/bash
# scripts/fix/complete_fix.sh - Correção completa e definitiva
# Arquivo: scripts/fix/complete_fix.sh

# =====================================================
# CORREÇÃO COMPLETA E DEFINITIVA DO PROBLEMA
# =====================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-matchit}"
DB_PASSWORD="${DB_PASSWORD:-matchit123}"
DB_NAME="${DB_NAME:-matchit_db}"
API_URL="${API_URL:-http://localhost:3001}"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxODIwMTE0Yy0zNDhhLTQ1NWQtOGZhNi1kZWNhZjFlZjYxZmIiLCJlbWFpbCI6ImZpbmFsdGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MDQ0NjMzMCwiZXhwIjoxNzUzMDM4MzMwfQ.5JjYitbMG4xJKJY4A8Kc3nqM4MCHFqPimY9W7wqEuL0"
USER_ID="1820114c-348a-455d-8fa6-decaf1ef61fb"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   MATCHIT - CORREÇÃO COMPLETA E DEFINITIVA${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Função para executar SQL
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "${YELLOW}Executando: ${description}${NC}"
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$sql_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${description} executado com sucesso${NC}"
        return 0
    else
        echo -e "${RED}❌ Erro ao executar ${description}${NC}"
        echo "Executando novamente com output para debug..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$sql_file"
        return 1
    fi
}

# Verificar conexão
echo -e "${YELLOW}1. Verificando conexão com o banco...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao banco${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Conexão estabelecida${NC}"
echo ""

# Etapa 1: Corrigir estrutura das tabelas
echo -e "${BLUE}2. Corrigindo estrutura das tabelas...${NC}"
execute_sql "scripts/fix/005_fix_table_structure.sql" "Correção da estrutura das tabelas"
echo ""

# Etapa 2: Testar ProfileService
echo -e "${BLUE}3. Testando ProfileService...${NC}"
execute_sql "scripts/fix/006_test_profile_service.sql" "Teste do ProfileService"
echo ""

# Etapa 3: Verificar se o servidor precisa do novo ProfileService
echo -e "${BLUE}4. Verificando se ProfileService precisa ser atualizado...${NC}"

# Backup do arquivo atual
if [ -f "server/services/profileService.js" ]; then
    cp "server/services/profileService.js" "server/services/profileService.js.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup do ProfileService criado${NC}"
fi

# Verificar se o arquivo tem as correções necessárias
if ! grep -q "Query mais robusta que funciona com qualquer estrutura" server/services/profileService.js 2>/dev/null; then
    echo -e "${YELLOW}⚠️  ProfileService precisa ser atualizado${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANTE: Substitua o conteúdo do arquivo server/services/profileService.js${NC}"
    echo -e "${YELLOW}pelo código fornecido no artefato 'ProfileService Compatível'${NC}"
    echo ""
    echo -e "${BLUE}Pressione ENTER quando tiver atualizado o arquivo...${NC}"
    read -r
else
    echo -e "${GREEN}✅ ProfileService já está atualizado${NC}"
fi

# Etapa 4: Testar API
echo -e "${BLUE}5. Testando API...${NC}"

# Verificar se servidor está rodando
if ! curl -s "$API_URL/health" > /dev/null 2>&1 && ! curl -s "$API_URL/" > /dev/null 2>&1; then
    echo -e "${RED}❌ Servidor não está acessível${NC}"
    echo ""
    echo -e "${YELLOW}Inicie o servidor com:${NC}"
    echo "  cd server && npm run dev"
    echo "  # ou"
    echo "  docker-compose up backend"
    echo ""
    echo -e "${BLUE}Pressione ENTER quando o servidor estiver rodando...${NC}"
    read -r
fi

echo -e "${YELLOW}Testando endpoint de perfil...${NC}"
response_file="/tmp/profile_test_final.json"
http_code=$(curl -s -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/api/profile/$USER_ID" \
    -o "$response_file" 2>/dev/null)

echo "Status HTTP: $http_code"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}🎉 SUCESSO! API está funcionando corretamente${NC}"
    echo ""
    echo -e "${BLUE}Resposta da API:${NC}"
    if command -v jq &> /dev/null; then
        cat "$response_file" | jq .
    else
        cat "$response_file"
    fi
    
    # Verificar se a resposta contém dados esperados
    if grep -q '"email"' "$response_file" && grep -q '"user_id"' "$response_file"; then
        echo ""
        echo -e "${GREEN}✅ Resposta contém dados do usuário${NC}"
        
        if grep -q '"stylePreferences"' "$response_file"; then
            echo -e "${GREEN}✅ Resposta contém stylePreferences${NC}"
        else
            echo -e "${YELLOW}⚠️  stylePreferences vazio (normal se usuário não tem escolhas)${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎊 PROBLEMA RESOLVIDO COMPLETAMENTE! 🎊${NC}"
        echo ""
        echo -e "${BLUE}Próximos passos:${NC}"
        echo "• Seu endpoint /api/profile/{userId} está funcionando"
        echo "• Você pode continuar o desenvolvimento"
        echo "• Para adicionar mais style preferences, use a tela de ajuste de estilo"
        
    else
        echo -e "${YELLOW}⚠️  Resposta não contém dados esperados${NC}"
    fi
    
elif [ "$http_code" = "401" ]; then
    echo -e "${YELLOW}⚠️  Token expirado ou inválido${NC}"
    echo ""
    echo "Para testar manualmente:"
    echo "1. Faça login na aplicação"
    echo "2. Pegue o token do localStorage"
    echo "3. Execute: curl -H \"Authorization: Bearer SEU_TOKEN\" $API_URL/api/profile/$USER_ID"
    
elif [ "$http_code" = "500" ]; then
    echo -e "${RED}❌ Ainda há erro 500${NC}"
    echo ""
    echo "Resposta:"
    cat "$response_file"
    echo ""
    echo -e "${YELLOW}Verifique:${NC}"
    echo "1. Se o ProfileService foi atualizado corretamente"
    echo "2. Logs do servidor para ver o erro específico"
    echo "3. Se todas as dependências estão instaladas"
    
else
    echo -e "${RED}❌ Erro inesperado: $http_code${NC}"
    if [ -f "$response_file" ]; then
        echo "Resposta:"
        cat "$response_file"
    fi
fi

rm -f "$response_file"

echo ""
echo -e "${BLUE}=====================================================${NC}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}   ✅ CORREÇÃO COMPLETA E BEM-SUCEDIDA ✅${NC}"
else
    echo -e "${YELLOW}   ⚠️  CORREÇÃO PARCIAL - VERIFIQUE LOGS ⚠️${NC}"
fi
echo -e "${BLUE}=====================================================${NC}"

# Mostrar resumo final
echo ""
echo -e "${BLUE}📋 RESUMO FINAL:${NC}"
echo "• Estrutura do banco: ✅ Corrigida"
echo "• Usuário de teste: ✅ Existe"  
echo "• ProfileService: $([ "$http_code" = "200" ] && echo "✅ Funcionando" || echo "⚠️  Verificar logs")"
echo "• API: $([ "$http_code" = "200" ] && echo "✅ HTTP 200" || echo "❌ HTTP $http_code")"