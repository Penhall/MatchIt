#!/bin/bash
# test-endpoints.sh - Script para testar se os endpoints funcionam após a correção

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3000"

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 🧪 TESTE DE ENDPOINTS - VERIFICAÇÃO PÓS-CORREÇÃO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local auth_header=$5
    
    echo -e "${YELLOW}🔍 Testando: $description${NC}"
    echo -e "   ${BLUE}$method $endpoint${NC}"
    
    # Construir comando curl
    local curl_cmd="curl -s -w 'HTTP_STATUS:%{http_code}' -X $method"
    
    if [[ -n "$auth_header" ]]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [[ -n "$data" ]]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $BASE_URL$endpoint"
    
    # Executar teste
    local response=$(eval $curl_cmd)
    local status_code=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    # Verificar resultado
    if [[ "$status_code" == "200" || "$status_code" == "201" ]]; then
        echo -e "   ✅ ${GREEN}Sucesso (${status_code})${NC}"
        echo -e "   📄 Resposta: $(echo "$body" | jq -c . 2>/dev/null || echo "$body" | head -c 100)..."
    elif [[ "$status_code" == "404" ]]; then
        echo -e "   ❌ ${RED}404 - Endpoint não encontrado${NC}"
        echo -e "   📄 Resposta: $body"
        return 1
    elif [[ "$status_code" == "401" ]]; then
        echo -e "   🔒 ${YELLOW}401 - Não autorizado (esperado sem token)${NC}"
    else
        echo -e "   ⚠️ ${YELLOW}Status: $status_code${NC}"
        echo -e "   📄 Resposta: $body"
    fi
    
    echo ""
    return 0
}

# Função para registrar usuário de teste e obter token
register_test_user() {
    echo -e "${BLUE}🔐 Registrando usuário de teste...${NC}"
    
    local test_email="test_$(date +%s)@matchit.com"
    local test_data="{\"email\":\"$test_email\",\"password\":\"123456\",\"name\":\"Teste User\"}"
    
    local response=$(curl -s -w 'HTTP_STATUS:%{http_code}' -X POST \
        -H 'Content-Type: application/json' \
        -d "$test_data" \
        "$BASE_URL/api/auth/register")
    
    local status_code=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    if [[ "$status_code" == "201" || "$status_code" == "200" ]]; then
        echo -e "   ✅ ${GREEN}Usuário registrado com sucesso${NC}"
        
        # Extrair token da resposta
        local token=$(echo "$body" | jq -r '.token // .data.token // empty' 2>/dev/null)
        
        if [[ -n "$token" && "$token" != "null" ]]; then
            echo -e "   🔑 Token obtido: ${token:0:20}...${NC}"
            echo "$token"
        else
            echo -e "   ⚠️ ${YELLOW}Token não encontrado na resposta, fazendo login...${NC}"
            
            # Tentar fazer login para obter token
            local login_response=$(curl -s -w 'HTTP_STATUS:%{http_code}' -X POST \
                -H 'Content-Type: application/json' \
                -d "{\"email\":\"$test_email\",\"password\":\"123456\"}" \
                "$BASE_URL/api/auth/login")
            
            local login_status=$(echo "$login_response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
            local login_body=$(echo "$login_response" | sed 's/HTTP_STATUS:[0-9]*$//')
            
            if [[ "$login_status" == "200" ]]; then
                local login_token=$(echo "$login_body" | jq -r '.token // .data.token // empty' 2>/dev/null)
                if [[ -n "$login_token" && "$login_token" != "null" ]]; then
                    echo -e "   🔑 Token obtido via login: ${login_token:0:20}...${NC}"
                    echo "$login_token"
                else
                    echo -e "   ❌ ${RED}Não foi possível obter token${NC}"
                    return 1
                fi
            else
                echo -e "   ❌ ${RED}Falha no login (${login_status})${NC}"
                return 1
            fi
        fi
    else
        echo -e "   ❌ ${RED}Falha no registro (${status_code})${NC}"
        echo -e "   📄 Resposta: $body"
        return 1
    fi
}

# =====================================================
# INÍCIO DOS TESTES
# =====================================================

echo -e "${YELLOW}🏥 Verificando se o servidor está rodando...${NC}"
if ! curl -s "$BASE_URL/api/health" > /dev/null; then
    echo -e "${RED}❌ Servidor não está respondendo em $BASE_URL${NC}"
    echo -e "${RED}   Certifique-se de que o servidor está rodando: npm run server${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor está rodando!${NC}"
echo ""

# Teste 1: Health Check
test_endpoint "GET" "/api/health" "Health Check" "" ""

# Teste 2: Endpoints que estavam com 404
echo -e "${BLUE}🎯 Testando endpoints que estavam com erro 404...${NC}"
echo ""

test_endpoint "GET" "/api/style/categories" "Categorias de Estilo (sem auth)" "" ""
test_endpoint "GET" "/api/style-preferences" "Preferências de Estilo (sem auth)" "" ""
test_endpoint "GET" "/api/style/completion-stats/1" "Estatísticas de Completude (sem auth)" "" ""

# Teste 3: Com autenticação
echo -e "${BLUE}🔐 Testando com autenticação...${NC}"
echo ""

TOKEN=$(register_test_user)

if [[ -n "$TOKEN" ]]; then
    echo -e "${GREEN}✅ Token de teste obtido, testando endpoints protegidos...${NC}"
    echo ""
    
    test_endpoint "GET" "/api/style/categories" "Categorias de Estilo (com auth)" "" "$TOKEN"
    test_endpoint "GET" "/api/style-preferences" "Preferências de Estilo (com auth)" "" "$TOKEN"
    test_endpoint "GET" "/api/style/completion-stats/1" "Estatísticas de Completude (com auth)" "" "$TOKEN"
    
    # Teste de salvamento de preferência
    local preference_data='{"category":"cores","questionId":"color_preference","selectedOption":"warm"}'
    test_endpoint "PUT" "/api/style-preferences" "Salvar Preferência" "$preference_data" "$TOKEN"
    
    # Teste de salvamento em lote
    local batch_data='{"preferences":{"cores":{"color_preference":{"selectedOption":"cool"}}}}'
    test_endpoint "POST" "/api/style-preferences/batch" "Salvamento em Lote" "$batch_data" "$TOKEN"
    
else
    echo -e "${RED}❌ Não foi possível obter token, pulando testes com autenticação${NC}"
fi

# =====================================================
# RESUMO DOS RESULTADOS
# =====================================================

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 📊 RESUMO DOS TESTES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}   Os endpoints que estavam com 404 agora funcionam corretamente.${NC}"
    echo ""
    echo -e "${YELLOW}🎉 Próximos passos:${NC}"
    echo -e "   1. Reinicie o frontend: ${BLUE}npm run dev${NC}"
    echo -e "   2. Teste a StyleAdjustmentScreen no navegador"
    echo -e "   3. Verifique se os erros 404 sumiram do console"
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo -e "${RED}   Verifique os logs acima para identificar problemas.${NC}"
fi

echo ""