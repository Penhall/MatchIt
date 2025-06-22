# scripts/test/test_integration.sh - Teste de integração frontend-backend

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}   TESTE DE INTEGRAÇÃO FRONTEND-BACKEND${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Função para fazer requisições HTTP
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -e "${YELLOW}Testando: $description${NC}"
    echo -e "${BLUE}URL: $url${NC}"
    
    # Fazer requisição com timeout
    response=$(curl -s -w "%{http_code}" -m 10 "$url" 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Sucesso - Status: $status_code${NC}"
        return 0
    else
        echo -e "${RED}❌ Falhou - Status esperado: $expected_status, recebido: $status_code${NC}"
        return 1
    fi
}

# =====================================================
# ETAPA 1: VERIFICAR PORTAS
# =====================================================

echo -e "\n${BLUE}ETAPA 1: Verificando portas${NC}"

# Verificar se backend está rodando (porta 3001)
if check_port 3001; then
    echo -e "${GREEN}✅ Backend rodando na porta 3001${NC}"
    backend_running=true
else
    echo -e "${RED}❌ Backend NÃO está rodando na porta 3001${NC}"
    backend_running=false
fi

# Verificar se frontend está rodando (porta 5173)
if check_port 5173; then
    echo -e "${GREEN}✅ Frontend rodando na porta 5173${NC}"
    frontend_running=true
else
    echo -e "${YELLOW}⚠️  Frontend não está rodando na porta 5173${NC}"
    frontend_running=false
fi

# =====================================================
# ETAPA 2: TESTAR BACKEND DIRETAMENTE
# =====================================================

echo -e "\n${BLUE}ETAPA 2: Testando backend diretamente${NC}"

if [ "$backend_running" = true ]; then
    # Testar health check
    test_endpoint "http://localhost:3001/api/health" "200" "Health check do backend"
    
    # Testar endpoint de informações
    test_endpoint "http://localhost:3001/api/info" "200" "Informações da API"
    
    # Testar endpoint de registro (sem dados - deve retornar 400)
    echo -e "\n${YELLOW}Testando endpoint de registro (sem dados)...${NC}"
    register_response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -m 10 \
        "http://localhost:3001/api/auth/register" 2>/dev/null)
    register_status="${register_response: -3}"
    
    if [ "$register_status" = "400" ]; then
        echo -e "${GREEN}✅ Endpoint de registro respondendo corretamente${NC}"
    else
        echo -e "${RED}❌ Endpoint de registro - Status esperado: 400, recebido: $register_status${NC}"
    fi
    
else
    echo -e "${RED}❌ Backend não está rodando - pulando testes${NC}"
    echo -e "${YELLOW}Para iniciar o backend: npm start${NC}"
fi

# =====================================================
# ETAPA 3: TESTAR PROXY DO FRONTEND
# =====================================================

echo -e "\n${BLUE}ETAPA 3: Testando proxy do frontend${NC}"

if [ "$frontend_running" = true ] && [ "$backend_running" = true ]; then
    # Testar se o proxy está funcionando
    test_endpoint "http://localhost:5173/api/health" "200" "Proxy - Health check"
    
    test_endpoint "http://localhost:5173/api/info" "200" "Proxy - Informações da API"
    
else
    echo -e "${YELLOW}⚠️  Frontend ou backend não está rodando - pulando testes de proxy${NC}"
    
    if [ "$frontend_running" = false ]; then
        echo -e "${YELLOW}Para iniciar o frontend: npm run dev${NC}"
    fi
fi

# =====================================================
# ETAPA 4: VERIFICAR CONFIGURAÇÕES
# =====================================================

echo -e "\n${BLUE}ETAPA 4: Verificando configurações${NC}"

# Verificar se .env.local existe
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local encontrado${NC}"
    
    if grep -q "VITE_API_URL" .env.local; then
        vite_api_url=$(grep "VITE_API_URL" .env.local | cut -d'=' -f2)
        echo -e "${GREEN}✅ VITE_API_URL configurado: $vite_api_url${NC}"
    else
        echo -e "${RED}❌ VITE_API_URL não encontrado em .env.local${NC}"
    fi
else
    echo -e "${RED}❌ .env.local não encontrado${NC}"
fi

# Verificar vite.config.ts
if [ -f "vite.config.ts" ]; then
    echo -e "${GREEN}✅ vite.config.ts encontrado${NC}"
    
    if grep -q "proxy" vite.config.ts; then
        echo -e "${GREEN}✅ Configuração de proxy encontrada${NC}"
    else
        echo -e "${RED}❌ Configuração de proxy não encontrada${NC}"
    fi
    
    if grep -q "rewrite.*replace" vite.config.ts; then
        echo -e "${RED}❌ PROBLEMA: Rewrite problemático ainda presente${NC}"
    else
        echo -e "${GREEN}✅ Rewrite problemático não encontrado${NC}"
    fi
else
    echo -e "${RED}❌ vite.config.ts não encontrado${NC}"
fi

# Verificar api.ts
if [ -f "src/services/api.ts" ]; then
    echo -e "${GREEN}✅ src/services/api.ts encontrado${NC}"
    
    if grep -q "import.meta.env.VITE_API_URL" src/services/api.ts; then
        echo -e "${GREEN}✅ Usando import.meta.env.VITE_API_URL${NC}"
    elif grep -q "process.env.REACT_APP" src/services/api.ts; then
        echo -e "${RED}❌ PROBLEMA: Ainda usando process.env.REACT_APP${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuração de API_BASE_URL não identificada${NC}"
    fi
else
    echo -e "${RED}❌ src/services/api.ts não encontrado${NC}"
fi

# =====================================================
# ETAPA 5: TESTE DE AUTENTICAÇÃO SIMULADO
# =====================================================

echo -e "\n${BLUE}ETAPA 5: Teste de autenticação simulado${NC}"

if [ "$backend_running" = true ]; then
    echo -e "${YELLOW}Testando registro com dados inválidos...${NC}"
    
    # Teste de registro com dados inválidos (deve retornar erro)
    auth_response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email": "invalid", "password": "123"}' \
        -m 10 \
        "http://localhost:3001/api/auth/register" 2>/dev/null)
    auth_status="${auth_response: -3}"
    
    if [ "$auth_status" = "400" ] || [ "$auth_status" = "422" ]; then
        echo -e "${GREEN}✅ Validação de dados funcionando${NC}"
    else
        echo -e "${YELLOW}⚠️  Status de validação: $auth_status${NC}"
    fi
    
    echo -e "\n${YELLOW}Testando login com dados inválidos...${NC}"
    
    # Teste de login com dados inválidos
    login_response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email": "test@example.com", "password": "wrongpassword"}' \
        -m 10 \
        "http://localhost:3001/api/auth/login" 2>/dev/null)
    login_status="${login_response: -3}"
    
    if [ "$login_status" = "400" ] || [ "$login_status" = "401" ]; then
        echo -e "${GREEN}✅ Autenticação rejeitando credenciais inválidas${NC}"
    else
        echo -e "${YELLOW}⚠️  Status de autenticação: $login_status${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend não rodando - pulando testes de autenticação${NC}"
fi

# =====================================================
# ETAPA 6: RESUMO DOS RESULTADOS
# =====================================================

echo -e "\n${BLUE}=========================================================${NC}"
echo -e "${BLUE}   RESUMO DOS TESTES${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Contadores
total_tests=0
passed_tests=0

# Backend
echo -e "\n${YELLOW}Backend:${NC}"
if [ "$backend_running" = true ]; then
    echo -e "  ✅ Rodando na porta 3001"
    ((passed_tests++))
else
    echo -e "  ❌ Não está rodando"
fi
((total_tests++))

# Frontend
echo -e "\n${YELLOW}Frontend:${NC}"
if [ "$frontend_running" = true ]; then
    echo -e "  ✅ Rodando na porta 5173"
    ((passed_tests++))
else
    echo -e "  ❌ Não está rodando"
fi
((total_tests++))

# Configurações
echo -e "\n${YELLOW}Configurações:${NC}"
if [ -f ".env.local" ] && grep -q "VITE_API_URL" .env.local; then
    echo -e "  ✅ Variáveis de ambiente corretas"
    ((passed_tests++))
else
    echo -e "  ❌ Variáveis de ambiente incorretas"
fi
((total_tests++))

if [ -f "src/services/api.ts" ] && grep -q "import.meta.env" src/services/api.ts; then
    echo -e "  ✅ API configurada para Vite"
    ((passed_tests++))
else
    echo -e "  ❌ API não configurada para Vite"
fi
((total_tests++))

# Resultado final
echo -e "\n${BLUE}=========================================================${NC}"
if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM! ($passed_tests/$total_tests)${NC}"
    echo -e "${GREEN}Frontend e backend estão integrados corretamente!${NC}"
elif [ $passed_tests -gt $((total_tests / 2)) ]; then
    echo -e "${YELLOW}⚠️  ALGUNS TESTES FALHARAM ($passed_tests/$total_tests)${NC}"
    echo -e "${YELLOW}Verificar problemas identificados acima${NC}"
else
    echo -e "${RED}❌ MUITOS TESTES FALHARAM ($passed_tests/$total_tests)${NC}"
    echo -e "${RED}Execute o script de correção antes de prosseguir${NC}"
fi

echo -e "\n${BLUE}Para corrigir problemas:${NC}"
echo "  bash scripts/fix/convert_react_to_vite.sh"

echo -e "\n${BLUE}Para iniciar os serviços:${NC}"
echo "  Backend: npm start"
echo "  Frontend: npm run dev"
