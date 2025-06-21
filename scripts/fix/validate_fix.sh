#!/bin/bash
# scripts/fix/validate_fix.sh - Script de validação da correção
# Arquivo: scripts/fix/validate_fix.sh

# =====================================================
# SCRIPT DE VALIDAÇÃO DA CORREÇÃO
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
echo -e "${BLUE}   MATCHIT - VALIDAÇÃO DA CORREÇÃO${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Função para validação de banco
validate_database() {
    echo -e "${YELLOW}1. Validando estrutura do banco...${NC}"
    
    # Verificar tabelas
    local tables_check=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_name IN ('users', 'user_profiles', 'style_choices');
    ")
    
    if [ "$tables_check" -eq 3 ]; then
        echo -e "${GREEN}✅ Todas as tabelas necessárias existem${NC}"
    else
        echo -e "${RED}❌ Tabelas faltando (encontradas: $tables_check/3)${NC}"
        return 1
    fi
    
    # Verificar usuário de teste
    local user_exists=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT EXISTS(SELECT 1 FROM users WHERE id = '$USER_ID');
    ")
    
    if [ "$user_exists" = " t" ]; then
        echo -e "${GREEN}✅ Usuário de teste existe${NC}"
    else
        echo -e "${RED}❌ Usuário de teste não encontrado${NC}"
        return 1
    fi
    
    # Verificar perfil do usuário
    local profile_exists=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = '$USER_ID');
    ")
    
    if [ "$profile_exists" = " t" ]; then
        echo -e "${GREEN}✅ Perfil do usuário existe${NC}"
    else
        echo -e "${RED}❌ Perfil do usuário não encontrado${NC}"
        return 1
    fi
    
    echo ""
}

# Função para validação da API
validate_api() {
    echo -e "${YELLOW}2. Validando API...${NC}"
    
    # Verificar se servidor está rodando
    if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ Servidor não está acessível em $API_URL${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Servidor está acessível${NC}"
    
    # Testar endpoint de perfil
    local response_file="/tmp/profile_test.json"
    local http_code=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/api/profile/$USER_ID" \
        -o "$response_file" 2>/dev/null)
    
    echo "Status HTTP: $http_code"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ API retornou sucesso (200)${NC}"
        
        # Verificar se a resposta contém dados esperados
        if [ -f "$response_file" ]; then
            local has_email=$(cat "$response_file" | grep -o '"email"' | wc -l)
            local has_name=$(cat "$response_file" | grep -o '"name"' | wc -l)
            local has_style_preferences=$(cat "$response_file" | grep -o '"stylePreferences"' | wc -l)
            
            if [ "$has_email" -gt 0 ] && [ "$has_name" -gt 0 ]; then
                echo -e "${GREEN}✅ Resposta contém dados básicos do usuário${NC}"
            else
                echo -e "${RED}❌ Resposta não contém dados básicos esperados${NC}"
                return 1
            fi
            
            if [ "$has_style_preferences" -gt 0 ]; then
                echo -e "${GREEN}✅ Resposta contém stylePreferences${NC}"
            else
                echo -e "${YELLOW}⚠️  Resposta não contém stylePreferences (pode ser normal)${NC}"
            fi
            
            echo ""
            echo -e "${BLUE}Resposta da API:${NC}"
            if command -v jq &> /dev/null; then
                cat "$response_file" | jq .
            else
                cat "$response_file"
            fi
            echo ""
            
            rm -f "$response_file"
        fi
    else
        echo -e "${RED}❌ API retornou erro ($http_code)${NC}"
        if [ -f "$response_file" ]; then
            echo "Resposta:"
            cat "$response_file"
            rm -f "$response_file"
        fi
        return 1
    fi
    
    echo ""
}

# Função para testes adicionais
additional_tests() {
    echo -e "${YELLOW}3. Executando testes adicionais...${NC}"
    
    # Testar endpoint de style preferences
    local style_response=$(curl -s -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/api/profile/style-preferences" \
        -o /tmp/style_test.json 2>/dev/null)
    
    echo "Teste de style preferences: $style_response"
    if [ "$style_response" = "200" ]; then
        echo -e "${GREEN}✅ Endpoint de style preferences funcionando${NC}"
    else
        echo -e "${YELLOW}⚠️  Endpoint de style preferences retornou: $style_response${NC}"
    fi
    
    rm -f /tmp/style_test.json
    echo ""
}

# Função para relatório final
final_report() {
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${BLUE}   RELATÓRIO FINAL DA VALIDAÇÃO${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    echo ""
    
    echo -e "${GREEN}✅ CORREÇÃO BEM-SUCEDIDA!${NC}"
    echo ""
    echo "O problema foi resolvido:"
    echo "• Banco de dados estruturado corretamente"
    echo "• Usuário de teste criado"
    echo "• API funcionando normalmente"
    echo "• Endpoint /api/profile/{userId} retornando dados"
    echo ""
    echo -e "${BLUE}Você pode agora:${NC}"
    echo "1. Continuar o desenvolvimento"
    echo "2. Testar outros endpoints"
    echo "3. Implementar novas funcionalidades"
    echo ""
    echo -e "${YELLOW}Para monitorar logs em tempo real:${NC}"
    echo "  tail -f server.log"
    echo "  # ou"
    echo "  docker logs -f <container_name>"
    echo ""
}

# Executar validações
if validate_database && validate_api; then
    additional_tests
    final_report
else
    echo ""
    echo -e "${RED}=====================================================${NC}"
    echo -e "${RED}   VALIDAÇÃO FALHOU${NC}"
    echo -e "${RED}=====================================================${NC}"
    echo ""
    echo "Algumas verificações falharam. Verifique:"
    echo "1. Se o banco de dados está rodando"
    echo "2. Se as migrations foram executadas"
    echo "3. Se o servidor backend está rodando"
    echo "4. Se as credenciais estão corretas"
    echo ""
    echo "Execute novamente o script de correção:"
    echo "  bash scripts/fix/fix_profile_api.sh"
    echo ""
    exit 1
fi