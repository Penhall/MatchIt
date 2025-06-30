#!/bin/bash
# scripts/test-auth-corrigido.sh - Teste específico para validar correção de autenticação

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3000/api"
TEST_EMAIL="test_$(date +%s)@matchit.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Teste Correção Auth"

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 🧪 TESTE DE VALIDAÇÃO - CORREÇÃO DE AUTENTICAÇÃO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Função para testar endpoint
test_endpoint() {
    local description="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    
    echo -e "${YELLOW}🧪 Testando: $description${NC}"
    echo -e "   URL: $url"
    echo -e "   Method: $method"
    
    if [[ "$method" == "POST" ]]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>/dev/null)
    fi
    
    # Separar body e status code
    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    echo -e "   Status: $status_code"
    
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        echo -e "${GREEN}✅ SUCESSO${NC}"
        echo -e "   Response: $body"
        return 0
    else
        echo -e "${RED}❌ FALHA${NC}"
        echo -e "   Response: $body"
        return 1
    fi
}

echo -e "${BLUE}▶ ETAPA 1: Verificar se servidor está rodando${NC}"
if ! curl -s "$API_URL/health" > /dev/null; then
    echo -e "${RED}❌ Servidor não está rodando na porta 3000${NC}"
    echo -e "${YELLOW}   Inicie o servidor com: npm run server${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor ativo${NC}"

echo -e "${BLUE}▶ ETAPA 2: Testar endpoints básicos${NC}"

# Health check
test_endpoint "Health Check" "$API_URL/health" "GET"

# Info endpoint
test_endpoint "Info Endpoint" "$API_URL/info" "GET"

echo -e "${BLUE}▶ ETAPA 3: Testar autenticação (objetivo principal)${NC}"

# Dados de registro
REGISTER_DATA=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD",
    "name": "$TEST_NAME"
}
EOF
)

# Teste de registro
echo ""
if test_endpoint "Registro de Usuário" "$API_URL/auth/register" "POST" "$REGISTER_DATA"; then
    echo -e "${GREEN}🎉 REGISTRO FUNCIONANDO!${NC}"
    REGISTRATION_SUCCESS=true
    
    # Extrair token da resposta
    TOKEN=$(curl -s -X POST -H "Content-Type: application/json" -d "$REGISTER_DATA" "$API_URL/auth/register" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [[ -n "$TOKEN" ]]; then
        echo -e "${GREEN}✅ Token obtido: ${TOKEN:0:20}...${NC}"
    else
        echo -e "${YELLOW}⚠️ Token não encontrado na resposta${NC}"
    fi
else
    echo -e "${RED}❌ REGISTRO FALHOU!${NC}"
    REGISTRATION_SUCCESS=false
fi

# Dados de login
LOGIN_DATA=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD"
}
EOF
)

# Teste de login
echo ""
if test_endpoint "Login de Usuário" "$API_URL/auth/login" "POST" "$LOGIN_DATA"; then
    echo -e "${GREEN}🎉 LOGIN FUNCIONANDO!${NC}"
    LOGIN_SUCCESS=true
    
    # Extrair token do login
    if [[ -z "$TOKEN" ]]; then
        TOKEN=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$API_URL/auth/login" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
else
    echo -e "${RED}❌ LOGIN FALHOU!${NC}"
    LOGIN_SUCCESS=false
fi

echo -e "${BLUE}▶ ETAPA 4: Testar endpoint autenticado${NC}"

# Testar /me se temos token
if [[ -n "$TOKEN" ]]; then
    echo ""
    echo -e "${YELLOW}🧪 Testando: Dados do usuário logado${NC}"
    echo -e "   URL: $API_URL/auth/me"
    echo -e "   Method: GET (com token)"
    
    response=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/auth/me" 2>/dev/null)
    
    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    echo -e "   Status: $status_code"
    
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        echo -e "${GREEN}✅ ENDPOINT /me FUNCIONANDO${NC}"
        echo -e "   Response: $body"
        ME_SUCCESS=true
    else
        echo -e "${RED}❌ ENDPOINT /me FALHOU${NC}"
        echo -e "   Response: $body"
        ME_SUCCESS=false
    fi
else
    echo -e "${YELLOW}⚠️ Sem token, pulando teste /me${NC}"
    ME_SUCCESS=false
fi

echo -e "${BLUE}▶ ETAPA 5: Relatório final${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 📊 RELATÓRIO DE VALIDAÇÃO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Calcular status geral
TOTAL_TESTS=0
PASSED_TESTS=0

if [[ "$REGISTRATION_SUCCESS" == true ]]; then
    echo -e "${GREEN}✅ Registro de usuário: FUNCIONANDO${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Registro de usuário: FALHOU${NC}"
fi
((TOTAL_TESTS++))

if [[ "$LOGIN_SUCCESS" == true ]]; then
    echo -e "${GREEN}✅ Login de usuário: FUNCIONANDO${NC}"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ Login de usuário: FALHOU${NC}"
fi
((TOTAL_TESTS++))

if [[ "$ME_SUCCESS" == true ]]; then
    echo -e "${GREEN}✅ Endpoint /me: FUNCIONANDO${NC}"
    ((PASSED_TESTS++))
elif [[ -n "$TOKEN" ]]; then
    echo -e "${RED}❌ Endpoint /me: FALHOU${NC}"
else
    echo -e "${YELLOW}⚠️ Endpoint /me: NÃO TESTADO (sem token)${NC}"
fi
((TOTAL_TESTS++))

echo ""
echo -e "${BLUE}📈 Taxa de sucesso: $PASSED_TESTS/$TOTAL_TESTS testes passaram${NC}"

if [[ "$PASSED_TESTS" -ge 2 ]]; then
    echo ""
    echo -e "${GREEN}🎉 CORREÇÃO APLICADA COM SUCESSO!${NC}"
    echo -e "${GREEN}   As rotas de autenticação estão funcionando!${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Próximos passos recomendados:${NC}"
    echo -e "   1. Executar teste completo: ./scripts/test-sistema-completo-melhorado.sh"
    echo -e "   2. Testar frontend: npm run dev"
    echo -e "   3. Continuar integração incremental"
    echo ""
    echo -e "${GREEN}✅ SISTEMA PRONTO PARA USO!${NC}"
    
    # Salvar credenciais de teste para uso futuro
    echo ""
    echo -e "${BLUE}📝 Credenciais de teste criadas:${NC}"
    echo -e "   Email: $TEST_EMAIL"
    echo -e "   Senha: $TEST_PASSWORD"
    echo -e "   Token: ${TOKEN:0:30}..."
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ CORREÇÃO NÃO FUNCIONOU COMPLETAMENTE${NC}"
    echo -e "${RED}   Ainda há problemas com as rotas de autenticação${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Verificações adicionais necessárias:${NC}"
    echo -e "   1. Verificar se server/routes/auth.js existe"
    echo -e "   2. Verificar se app.js importa authRoutes corretamente"
    echo -e "   3. Verificar logs do servidor para erros"
    echo -e "   4. Reiniciar servidor se necessário"
    
    exit 1
fi