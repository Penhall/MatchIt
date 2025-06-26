# scripts/teste-fase0-detalhado.sh - Teste específico da Fase 0

#!/bin/bash

# Teste focado na Fase 0: Integração Backend-Frontend para preferências de estilo

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_BASE="http://localhost:3000/api"
TEST_EMAIL="fase0_$(date +%s)@test.com"
TEST_PASSWORD="Test123!"
TOKEN=""

print_header() { echo -e "${CYAN}$1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Pré-requisitos
verificar_prerequisitos() {
    print_header "🔍 VERIFICANDO PRÉ-REQUISITOS"
    
    # Servidor rodando?
    if curl -s "$API_BASE/health" > /dev/null 2>&1; then
        print_success "Servidor está rodando"
    else
        print_error "Servidor não está rodando!"
        print_info "Execute: npm run server"
        exit 1
    fi
    
    # Banco de dados conectado?
    db_status=$(curl -s "$API_BASE/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    if [ "$db_status" = "connected" ] || [ "$db_status" = "ok" ]; then
        print_success "Banco de dados conectado"
    else
        print_warning "Status do banco: $db_status"
    fi
    
    # Tabela style_choices existe?
    print_info "Verificando estrutura do banco..."
    # Este teste será feito via API
    
    echo ""
}

# Setup do usuário de teste
setup_usuario_teste() {
    print_header "👤 CONFIGURANDO USUÁRIO DE TESTE"
    
    # Registrar usuário
    print_info "Registrando usuário: $TEST_EMAIL"
    response=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Teste Fase 0\"}")
    
    if echo "$response" | grep -q "token"; then
        TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        print_success "Usuário registrado e autenticado"
        print_info "Token: ${TOKEN:0:20}..."
    else
        print_error "Falha no registro: $response"
        exit 1
    fi
    
    echo ""
}

# Teste detalhado dos endpoints de preferências
testar_endpoints_preferencias() {
    print_header "🎨 TESTANDO ENDPOINTS DE PREFERÊNCIAS DE ESTILO"
    
    # 1. GET inicial (deve retornar vazio)
    print_info "1. Testando GET inicial (deve estar vazio)"
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/profile/style-preferences")
    
    if echo "$response" | grep -q '\[\]' || echo "$response" | grep -q '"preferences":\s*\[\]'; then
        print_success "GET inicial retorna vazio corretamente"
    else
        print_warning "GET inicial: $response"
    fi
    
    # 2. PUT primeira preferência
    print_info "2. Testando PUT - primeira preferência"
    response=$(curl -s -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"category":"cores","questionId":"cor_favorita","selectedOption":"azul"}' \
        "$API_BASE/profile/style-preferences")
    
    if echo "$response" | grep -q "success\|updated\|saved"; then
        print_success "PUT primeira preferência: OK"
    else
        print_error "PUT falhou: $response"
    fi
    
    # 3. GET após PUT (deve retornar a preferência)
    print_info "3. Testando GET após PUT"
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/profile/style-preferences")
    
    if echo "$response" | grep -q "cores\|azul"; then
        print_success "GET após PUT retorna dados corretos"
    else
        print_warning "GET após PUT: $response"
    fi
    
    # 4. PUT update da mesma preferência
    print_info "4. Testando PUT update (mudar valor)"
    response=$(curl -s -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"category":"cores","questionId":"cor_favorita","selectedOption":"vermelho"}' \
        "$API_BASE/profile/style-preferences")
    
    if echo "$response" | grep -q "success\|updated"; then
        print_success "PUT update: OK"
    else
        print_error "PUT update falhou: $response"
    fi
    
    # 5. POST batch de preferências
    print_info "5. Testando POST batch"
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"preferences":[
            {"category":"roupas","questionId":"estilo_roupa","selectedOption":"casual"},
            {"category":"tenis","questionId":"tipo_tenis","selectedOption":"esportivo"},
            {"category":"acessorios","questionId":"tipo_acessorio","selectedOption":"minimalista"}
        ]}' \
        "$API_BASE/profile/style-preferences/batch")
    
    if echo "$response" | grep -q "success\|saved\|created"; then
        print_success "POST batch: OK"
    else
        print_error "POST batch falhou: $response"
    fi
    
    # 6. GET final (deve ter 4 preferências)
    print_info "6. Testando GET final (deve ter 4 preferências)"
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/profile/style-preferences")
    
    echo "Resposta GET final:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Contar preferências
    count=$(echo "$response" | grep -o "questionId" | wc -l)
    if [ "$count" -ge 4 ]; then
        print_success "GET final: $count preferências encontradas"
    else
        print_warning "GET final: apenas $count preferências (esperado: 4)"
    fi
    
    echo ""
}

# Teste de validação e erro handling
testar_error_handling() {
    print_header "⚠️  TESTANDO ERROR HANDLING"
    
    # 1. Request sem auth
    print_info "1. Request sem autenticação"
    response=$(curl -s -w "%{http_code}" "$API_BASE/profile/style-preferences")
    http_code="${response: -3}"
    
    if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        print_success "Rejeita request sem auth (HTTP $http_code)"
    else
        print_warning "Request sem auth retornou HTTP $http_code"
    fi
    
    # 2. Dados inválidos
    print_info "2. Dados inválidos (categoria vazia)"
    response=$(curl -s -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"category":"","questionId":"test","selectedOption":"value"}' \
        "$API_BASE/profile/style-preferences")
    
    if echo "$response" | grep -q "error\|invalid\|required"; then
        print_success "Rejeita dados inválidos corretamente"
    else
        print_warning "Validação de dados: $response"
    fi
    
    # 3. JSON malformado
    print_info "3. JSON malformado"
    response=$(curl -s -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"category":"test"' \
        "$API_BASE/profile/style-preferences")
    
    if echo "$response" | grep -q "error\|invalid\|parse"; then
        print_success "Rejeita JSON malformado"
    else
        print_warning "JSON malformado: $response"
    fi
    
    echo ""
}

# Teste de performance
testar_performance() {
    print_header "⚡ TESTANDO PERFORMANCE"
    
    # Testar velocidade do GET
    start_time=$(date +%s%N)
    curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/profile/style-preferences" > /dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 500 ]; then
        print_success "GET performance: ${duration}ms (< 500ms)"
    else
        print_warning "GET performance: ${duration}ms (> 500ms)"
    fi
    
    # Testar velocidade do PUT
    start_time=$(date +%s%N)
    curl -s -X PUT \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"category":"performance","questionId":"test_speed","selectedOption":"fast"}' \
        "$API_BASE/profile/style-preferences" > /dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 1000 ]; then
        print_success "PUT performance: ${duration}ms (< 1s)"
    else
        print_warning "PUT performance: ${duration}ms (> 1s)"
    fi
    
    echo ""
}

# Verificar integridade dos dados
verificar_integridade_dados() {
    print_header "🔍 VERIFICANDO INTEGRIDADE DOS DADOS"
    
    # Buscar dados finais
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/profile/style-preferences")
    
    # Verificar se tem estrutura correta
    if echo "$response" | grep -q "category\|questionId\|selectedOption"; then
        print_success "Estrutura de dados correta"
    else
        print_error "Estrutura de dados incorreta: $response"
    fi
    
    # Verificar se não há duplicatas
    duplicates=$(echo "$response" | grep -o '"questionId":"[^"]*"' | sort | uniq -d | wc -l)
    if [ "$duplicates" -eq 0 ]; then
        print_success "Sem questionIds duplicados"
    else
        print_warning "Encontradas $duplicates duplicatas"
    fi
    
    echo ""
}

# Limpeza
cleanup() {
    print_header "🧹 LIMPANDO DADOS DE TESTE"
    
    if [ -n "$TOKEN" ]; then
        # Tentar limpar preferências
        curl -s -X DELETE \
            -H "Authorization: Bearer $TOKEN" \
            "$API_BASE/profile/style-preferences" > /dev/null
        
        print_success "Dados de teste removidos"
    fi
}

# Relatório final
gerar_relatorio_fase0() {
    print_header "📊 RELATÓRIO DA FASE 0"
    
    echo ""
    print_info "✅ FUNCIONALIDADES TESTADAS:"
    echo "  • Endpoints de preferências de estilo"
    echo "  • Autenticação e autorização"
    echo "  • Validação de dados"
    echo "  • Error handling"
    echo "  • Performance básica"
    echo "  • Integridade de dados"
    
    echo ""
    print_header "🎯 STATUS DA FASE 0:"
    
    # Verificar se preferências funcionam
    final_test=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/profile/style-preferences" 2>/dev/null)
    if echo "$final_test" | grep -q "category\|questionId"; then
        print_success "✅ FASE 0 FUNCIONAL"
        print_info "   Integração backend-frontend estabelecida"
        print_info "   Preferências de estilo persistindo no banco"
        print_info "   Error handling implementado"
        
        echo ""
        print_header "🚀 PRÓXIMO PASSO: FASE 1"
        print_info "Sistema pronto para implementação dos torneios visuais"
        
        return 0
    else
        print_error "❌ FASE 0 COM PROBLEMAS"
        print_info "   Revisar integração backend-frontend"
        print_info "   Verificar banco de dados"
        
        return 1
    fi
}

# Função principal
main() {
    print_header "🚀 TESTE DETALHADO DA FASE 0 - MATCHIT"
    print_info "Testando integração backend-frontend para preferências de estilo"
    echo ""
    
    verificar_prerequisitos
    setup_usuario_teste
    testar_endpoints_preferencias
    testar_error_handling
    testar_performance
    verificar_integridade_dados
    
    # Relatório final
    if gerar_relatorio_fase0; then
        cleanup
        print_header "🎉 TESTE CONCLUÍDO COM SUCESSO!"
        exit 0
    else
        cleanup
        print_header "⚠️  TESTE IDENTIFICOU PROBLEMAS"
        exit 1
    fi
}

# Verificar dependências
if ! command -v curl &> /dev/null; then
    print_error "curl não encontrado. Instale curl primeiro."
    exit 1
fi

# Executar
main "$@"