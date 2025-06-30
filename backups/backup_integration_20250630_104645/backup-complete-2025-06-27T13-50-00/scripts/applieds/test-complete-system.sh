# scripts/test-complete-system.sh - Teste completo de todo o sistema MatchIt
#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configurações
API_BASE_URL="http://localhost:3001/api"
TEST_EMAIL="complete.test.$(date +%s)@matchit.test"
TEST_PASSWORD="TestPassword123!"
TOKEN=""
USER_ID=""
FAILED_TESTS=0
TOTAL_TESTS=0

print_header() {
    echo ""
    echo -e "${CYAN}=====================================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}=====================================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${PURPLE}--- $1 ---${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para teste de endpoint com JSON
test_json_endpoint() {
    local test_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local token="$5"
    local expected_status="$6"
    
    ((TOTAL_TESTS++))
    print_info "Testando: $test_name"
    
    local curl_cmd="curl -s -w '\nHTTP_CODE:%{http_code}'"
    curl_cmd="$curl_cmd -X $method"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    local response
    response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    local response_body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    local expected=${expected_status:-200}
    
    if [[ "$http_code" =~ ^${expected}$ ]] || [[ "$http_code" =~ ^2[0-9]{2}$ && -z "$expected_status" ]]; then
        print_status "$test_name - HTTP $http_code"
        if command -v jq &> /dev/null && echo "$response_body" | jq . >/dev/null 2>&1; then
            echo "$response_body" | jq . | head -10
        else
            echo "$response_body" | head -c 300
        fi
        return 0
    else
        print_error "$test_name - HTTP $http_code (esperado: $expected)"
        echo "Response: $response_body"
        return 1
    fi
}

# Verificar dependências
check_dependencies() {
    print_section "Verificando Dependências"
    
    if ! command -v curl &> /dev/null; then
        print_error "curl não encontrado. Instale curl primeiro."
        exit 1
    fi
    print_status "curl encontrado"
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq não encontrado. Instale para melhor formatação JSON."
    else
        print_status "jq encontrado"
    fi
    
    if ! command -v node &> /dev/null; then
        print_warning "Node.js não encontrado no PATH"
    else
        print_status "Node.js $(node --version) encontrado"
    fi
    
    if ! command -v npm &> /dev/null; then
        print_warning "npm não encontrado no PATH"
    else
        print_status "npm $(npm --version) encontrado"
    fi
}

# Verificar se servidor está rodando
check_server() {
    print_section "Verificando Servidor"
    
    print_info "Testando conectividade com $API_BASE_URL"
    
    if curl -s --connect-timeout 5 "$API_BASE_URL/health" > /dev/null; then
        print_status "Servidor está rodando e respondendo"
        
        # Teste de health check
        test_json_endpoint "Health Check" "$API_BASE_URL/health" "GET"
        
        # Teste de info
        test_json_endpoint "Server Info" "$API_BASE_URL/info" "GET"
        
    else
        print_error "Servidor não está respondendo em $API_BASE_URL"
        print_info "Certifique-se de que o servidor está rodando:"
        print_info "  cd /path/to/project && npm run dev"
        exit 1
    fi
}

# Testar autenticação
test_authentication() {
    print_section "Testando Sistema de Autenticação"
    
    # 1. Registro
    local register_data="{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"name\": \"Usuário Teste Completo\",
        \"dateOfBirth\": \"1990-01-01\",
        \"location\": {
            \"city\": \"São Paulo\",
            \"state\": \"SP\",
            \"coordinates\": [-23.5505, -46.6333]
        }
    }"
    
    if test_json_endpoint "Registro de usuário" "$API_BASE_URL/auth/register" "POST" "$register_data"; then
        
        # 2. Login
        local login_data="{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}"
        local login_response
        login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$API_BASE_URL/auth/login")
        
        if echo "$login_response" | grep -q "token"; then
            print_status "Login realizado com sucesso"
            
            if command -v jq &> /dev/null; then
                TOKEN=$(echo "$login_response" | jq -r '.token')
                USER_ID=$(echo "$login_response" | jq -r '.user.id')
            else
                TOKEN=$(echo "$login_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
                USER_ID=$(echo "$login_response" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
            fi
            
            print_status "Token obtido: ${TOKEN:0:20}..."
            print_status "User ID: $USER_ID"
            
            # 3. Verificar token
            test_json_endpoint "Verificar autenticação" "$API_BASE_URL/auth/me" "GET" "" "$TOKEN"
            
        else
            print_error "Falha no login"
            echo "Response: $login_response"
        fi
    fi
}

# Testar endpoints de perfil
test_profile_system() {
    print_section "Testando Sistema de Perfil"
    
    # GET profile
    test_json_endpoint "GET Profile" "$API_BASE_URL/profile" "GET" "" "$TOKEN"
    
    # GET style preferences (inicial - deve estar vazio)
    test_json_endpoint "GET Style Preferences (inicial)" "$API_BASE_URL/profile/style-preferences" "GET" "" "$TOKEN"
    
    # PUT style preferences
    local style_data='{"category":"cores","questionId":"color_warm","selectedOption":"warm_colors"}'
    test_json_endpoint "PUT Style Preferences" "$API_BASE_URL/profile/style-preferences" "PUT" "$style_data" "$TOKEN"
    
    # GET style preferences (com dados)
    test_json_endpoint "GET Style Preferences (com dados)" "$API_BASE_URL/profile/style-preferences" "GET" "" "$TOKEN"
    
    # PATCH categoria específica
    local update_data='{"questionId":"color_intensity","selectedOption":"vibrant"}'
    test_json_endpoint "PATCH Style Category" "$API_BASE_URL/profile/style-preferences/cores" "PATCH" "$update_data" "$TOKEN"
}

# Testar sistema de torneios (se implementado)
test_tournament_system() {
    print_section "Testando Sistema de Torneios"
    
    # Verificar se endpoints de torneio existem
    print_info "Verificando disponibilidade dos endpoints de torneio..."
    
    # GET categorias disponíveis
    if curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/tournament/categories" > /dev/null 2>&1; then
        test_json_endpoint "GET Tournament Categories" "$API_BASE_URL/tournament/categories" "GET" "" "$TOKEN"
        
        # Verificar sessão ativa (deve estar vazia inicialmente)
        test_json_endpoint "GET Active Session (cores)" "$API_BASE_URL/tournament/active/cores" "GET" "" "$TOKEN" "404"
        
        # Iniciar torneio
        local start_data='{"category":"cores"}'
        if test_json_endpoint "POST Start Tournament" "$API_BASE_URL/tournament/start" "POST" "$start_data" "$TOKEN"; then
            
            # Buscar sessão ativa novamente
            test_json_endpoint "GET Active Session (após iniciar)" "$API_BASE_URL/tournament/active/cores" "GET" "" "$TOKEN"
            
            # Simular algumas escolhas no torneio
            print_info "Simulando escolhas no torneio..."
            
            # Aqui você poderia adicionar lógica para simular um torneio completo
            # Por enquanto, apenas verificamos se o endpoint de escolha existe
            local choice_data='{"sessionId":"test_session","winnerId":1}'
            curl -s -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
                -d "$choice_data" "$API_BASE_URL/tournament/choice" > /dev/null 2>&1
        fi
    else
        print_warning "Endpoints de torneio não encontrados - Sistema ainda não implementado"
        print_info "Para implementar o sistema de torneios, execute:"
        print_info "  1. Crie as tabelas necessárias no banco de dados"
        print_info "  2. Implemente os endpoints em server/routes/tournament.js"
        print_info "  3. Adicione o TournamentEngine em server/services/"
    fi
}

# Testar sistema de recomendações
test_recommendation_system() {
    print_section "Testando Sistema de Recomendações"
    
    # GET recommendations
    if test_json_endpoint "GET Recommendations" "$API_BASE_URL/recommendations" "GET" "" "$TOKEN"; then
        
        # POST feedback (like)
        local feedback_data='{"targetUserId":"test_user_id","action":"like"}'
        test_json_endpoint "POST Feedback (like)" "$API_BASE_URL/recommendations/feedback" "POST" "$feedback_data" "$TOKEN"
        
        # POST feedback (pass)
        local pass_data='{"targetUserId":"test_user_id","action":"pass"}'
        test_json_endpoint "POST Feedback (pass)" "$API_BASE_URL/recommendations/feedback" "POST" "$pass_data" "$TOKEN"
        
    else
        print_warning "Sistema de recomendações pode não estar totalmente funcional"
    fi
}

# Testar tratamento de erros
test_error_handling() {
    print_section "Testando Tratamento de Erros"
    
    # Token inválido
    test_json_endpoint "Token inválido" "$API_BASE_URL/profile" "GET" "" "invalid_token" "401"
    
    # Endpoint inexistente
    test_json_endpoint "Endpoint inexistente" "$API_BASE_URL/nonexistent/endpoint" "GET" "" "$TOKEN" "404"
    
    # Dados inválidos
    local invalid_data='{"invalid": true, "malformed": "json"'
    curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
        -d "$invalid_data" "$API_BASE_URL/profile/style-preferences" > /dev/null 2>&1
    print_status "Teste de JSON malformado executado"
    
    # Método não permitido
    test_json_endpoint "Método não permitido" "$API_BASE_URL/profile" "DELETE" "" "$TOKEN" "405"
}

# Verificar database
test_database() {
    print_section "Testando Conectividade com Database"
    
    test_json_endpoint "Database Health" "$API_BASE_URL/test/database" "GET"
}

# Cleanup
cleanup() {
    print_section "Limpeza"
    
    if [ -n "$TOKEN" ]; then
        # Tentar logout
        curl -s -X POST -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/auth/logout" > /dev/null 2>&1
        print_status "Logout realizado"
    fi
    
    print_status "Cleanup concluído"
}

# Relatório final
generate_final_report() {
    print_header "📊 RELATÓRIO FINAL DO SISTEMA MATCHIT"
    
    local success_rate=$(( (TOTAL_TESTS - FAILED_TESTS) * 100 / TOTAL_TESTS ))
    
    echo -e "📈 ${BLUE}ESTATÍSTICAS DOS TESTES${NC}"
    echo -e "   Total de testes: ${CYAN}$TOTAL_TESTS${NC}"
    echo -e "   Testes passou: ${GREEN}$((TOTAL_TESTS - FAILED_TESTS))${NC}"
    echo -e "   Testes falharam: ${RED}$FAILED_TESTS${NC}"
    echo -e "   Taxa de sucesso: ${CYAN}$success_rate%${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_header "🎉 SISTEMA TOTALMENTE FUNCIONAL!"
        echo -e "${GREEN}✅ Sistema de autenticação funcionando${NC}"
        echo -e "${GREEN}✅ Endpoints de perfil funcionando${NC}"
        echo -e "${GREEN}✅ Sistema de preferências de estilo funcionando${NC}"
        echo -e "${GREEN}✅ Tratamento de erros implementado${NC}"
        echo -e "${GREEN}✅ Database conectado e funcional${NC}"
        echo ""
        echo -e "${CYAN}🚀 SISTEMA PRONTO PARA:${NC}"
        echo -e "   • Implementação do sistema de torneios"
        echo -e "   • Interface React Native"
        echo -e "   • Deploy em produção"
        
    elif [ $success_rate -ge 80 ]; then
        print_header "🟡 SISTEMA MAJORITARIAMENTE FUNCIONAL"
        echo -e "${YELLOW}⚠️  Alguns componentes precisam de ajustes${NC}"
        echo -e "${BLUE}📝 PRÓXIMOS PASSOS:${NC}"
        echo -e "   • Corrigir falhas encontradas"
        echo -e "   • Implementar sistema de torneios"
        echo -e "   • Completar integração frontend"
        
    elif [ $success_rate -ge 50 ]; then
        print_header "🟠 SISTEMA PARCIALMENTE FUNCIONAL"
        echo -e "${YELLOW}⚠️  Sistema base funciona, mas precisa de melhorias${NC}"
        echo -e "${BLUE}📝 AÇÕES NECESSÁRIAS:${NC}"
        echo -e "   • Corrigir endpoints com falha"
        echo -e "   • Verificar configuração do banco de dados"
        echo -e "   • Revisar sistema de autenticação"
        
    else
        print_header "🔴 SISTEMA COM PROBLEMAS CRÍTICOS"
        echo -e "${RED}❌ Sistema precisa de correções importantes${NC}"
        echo -e "${BLUE}📝 AÇÕES CRÍTICAS:${NC}"
        echo -e "   • Revisar configuração do servidor"
        echo -e "   • Verificar conectividade com banco de dados"
        echo -e "   • Corrigir endpoints básicos"
        echo -e "   • Revisar sistema de autenticação"
    fi
    
    echo ""
    print_header "📋 PRÓXIMOS PASSOS RECOMENDADOS"
    
    if [ $success_rate -ge 80 ]; then
        echo -e "${CYAN}1. Implementar Sistema de Torneios:${NC}"
        echo -e "   • Criar tabelas de torneio no banco"
        echo -e "   • Implementar TournamentEngine"
        echo -e "   • Criar endpoints de torneio"
        echo ""
        echo -e "${CYAN}2. Interface React Native:${NC}"
        echo -e "   • Implementar TournamentScreen.tsx"
        echo -e "   • Criar componentes de UI"
        echo -e "   • Integrar com APIs"
        echo ""
        echo -e "${CYAN}3. Upload de Imagens:${NC}"
        echo -e "   • Configurar CDN para imagens"
        echo -e "   • Criar admin panel para upload"
        echo -e "   • Implementar 100 imagens por categoria"
    else
        echo -e "${CYAN}1. Corrigir Base do Sistema:${NC}"
        echo -e "   • Resolver problemas de conectividade"
        echo -e "   • Corrigir endpoints com falha"
        echo -e "   • Verificar configuração"
        echo ""
        echo -e "${CYAN}2. Executar Testes Novamente:${NC}"
        echo -e "   • ./scripts/test-complete-system.sh"
    fi
    
    echo ""
    echo -e "${BLUE}📞 Suporte: Execute este script novamente após fazer correções${NC}"
    echo ""
}

# Função principal
main() {
    print_header "🚀 TESTE COMPLETO DO SISTEMA MATCHIT"
    print_info "Testando todos os componentes do sistema..."
    print_info "Data/Hora: $(date)"
    print_info "API Base URL: $API_BASE_URL"
    
    # Executar todos os testes
    check_dependencies
    check_server
    test_database
    test_authentication
    test_profile_system
    test_tournament_system
    test_recommendation_system
    test_error_handling
    
    # Cleanup e relatório
    cleanup
    generate_final_report
    
    # Exit code baseado nos resultados
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Sistema de Teste Completo MatchIt"
    echo ""
    echo "Uso: $0 [--help]"
    echo ""
    echo "Este script testa todos os componentes do sistema MatchIt:"
    echo "  • Sistema de autenticação"
    echo "  • Endpoints de perfil e preferências"
    echo "  • Sistema de torneios (se implementado)"
    echo "  • Sistema de recomendações"
    echo "  • Tratamento de erros"
    echo "  • Conectividade com database"
    echo ""
    echo "Certifique-se de que o servidor está rodando antes de executar:"
    echo "  npm run dev"
    echo ""
    exit 0
fi

# Executar função principal
main "$@"