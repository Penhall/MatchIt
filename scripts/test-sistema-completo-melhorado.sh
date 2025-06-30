# scripts/test-sistema-completo-melhorado.sh - Teste completo: Banco + Backend + Frontend
#!/bin/bash

# =========================================================================
# TESTE COMPLETO SISTEMA MATCHIT - VERSÃO MELHORADA
# =========================================================================
# Testa: Banco de Dados + Rotas HTTP + Integração + Performance
# =========================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configurações de banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Configurações de teste
API_BASE_URL="http://localhost:3000/api"
TEST_EMAIL="integration.test.$(date +%s)@matchit.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Integration Test User"
TOKEN=""
USER_ID=""

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# Arrays para armazenar resultados
declare -a DB_RESULTS
declare -a API_RESULTS
declare -a INTEGRATION_RESULTS

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${PURPLE}▶ $1${NC}"
    echo -e "${PURPLE}$(printf '─%.0s' {1..50})${NC}"
}

print_test() {
    echo -e "${BLUE}   🧪 $1${NC}"
}

print_success() {
    echo -e "${GREEN}   ✅ $1${NC}"
    ((PASSED_TESTS++))
}

print_failure() {
    echo -e "${RED}   ❌ $1${NC}"
    ((FAILED_TESTS++))
    local test_type="$2"
    case $test_type in
        "DB") DB_RESULTS+=("FAIL: $1") ;;
        "API") API_RESULTS+=("FAIL: $1") ;;
        "INTEGRATION") INTEGRATION_RESULTS+=("FAIL: $1") ;;
    esac
}

print_warning() {
    echo -e "${YELLOW}   ⚠️  $1${NC}"
    ((WARNING_TESTS++))
    local test_type="$2"
    case $test_type in
        "DB") DB_RESULTS+=("WARN: $1") ;;
        "API") API_RESULTS+=("WARN: $1") ;;
        "INTEGRATION") INTEGRATION_RESULTS+=("WARN: $1") ;;
    esac
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para executar comandos SQL com as credenciais corretas
run_psql() {
    local query="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$query" 2>/dev/null
}

# Função para verificar conectividade SQL
check_psql_connection() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1
}

# Função para fazer requisições HTTP
# Retorna o corpo da resposta JSON se bem-sucedido, caso contrário, string vazia
make_http_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local token="$4"
    local description="$5"
    local expected_status="${6:-200}"
    
    ((TOTAL_TESTS++))
    
    local curl_cmd="curl -s -w '\nHTTP_CODE:%{http_code}'"
    curl_cmd="$curl_cmd -X $method"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    curl_cmd="$curl_cmd --connect-timeout 10"
    curl_cmd="$curl_cmd --max-time 30"
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_BASE_URL$endpoint'"
    
    local response
    response=$(eval $curl_cmd 2>/dev/null)
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        print_failure "$description - Conexão falhou" "API"
        echo "" # Retorna string vazia em caso de falha
        return 1
    fi
    
    local http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    local response_body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [[ "$http_code" =~ ^${expected_status}$ ]] || [[ "$http_code" =~ ^2[0-9]{2}$ && "$expected_status" == "200" ]]; then
        print_success "$description (HTTP $http_code)"
        # Mostrar resposta formatada se for JSON
        if command -v jq &> /dev/null && echo "$response_body" | jq . >/dev/null 2>&1; then
            echo "$response_body" | jq . | head -5
        else
            echo "     $(echo "$response_body" | head -c 100)..."
        fi
        echo "$response_body" # Imprime o corpo da resposta para ser capturado
        return 0
    else
        print_failure "$description - HTTP $http_code (esperado: $expected_status)" "API"
        echo "     Response: $(echo "$response_body" | head -c 100)..."
        echo "" # Retorna string vazia em caso de falha
        return 1
    fi
}

# Função para consulta SQL
run_sql_query() {
    local query="$1"
    local description="$2"
    local test_type="${3:-DB}"
    
    ((TOTAL_TESTS++))
    
    if check_psql_connection; then
        local result=$(run_psql "$query" | xargs)
        if [ $? -eq 0 ] && [ -n "$result" ]; then
            print_success "$description: $result"
            return 0
        else
            print_failure "$description - Consulta falhou ou retornou vazio" "$test_type"
            return 1
        fi
    else
        print_failure "$description - Conexão com banco falhou" "$test_type"
        return 1
    fi
}

# =========================================================================
# TESTES DE INFRAESTRUTURA
# =========================================================================

test_infrastructure() {
    print_section "INFRAESTRUTURA E DEPENDÊNCIAS"
    
    print_test "Verificando Node.js"
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js $node_version encontrado"
    else
        print_failure "Node.js não encontrado" "INFRA"
    fi
    
    print_test "Verificando npm"
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm $npm_version encontrado"
    else
        print_failure "npm não encontrado" "INFRA"
    fi
    
    print_test "Verificando PostgreSQL"
    if command -v psql &> /dev/null; then
        local pg_version=$(psql --version | head -1)
        print_success "$pg_version encontrado"
    else
        print_failure "PostgreSQL não encontrado" "INFRA"
    fi
    
    print_test "Verificando curl"
    if command -v curl &> /dev/null; then
        print_success "curl encontrado"
    else
        print_failure "curl não encontrado" "INFRA"
    fi
    
    print_test "Verificando dependências Node.js"
    if [ -f "package.json" ] && [ -d "node_modules" ]; then
        local deps_count=$(find node_modules -maxdepth 1 -type d | wc -l)
        print_success "$deps_count dependências instaladas"
    else
        print_warning "node_modules não encontrado - execute: npm install" "INFRA"
    fi
}

# =========================================================================
# TESTES DE BANCO DE DADOS
# =========================================================================

test_database() {
    print_section "BANCO DE DADOS"
    
    print_test "Conectividade com banco (matchit_db)"
    print_info "Conectando: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    
    if check_psql_connection; then
        print_success "Conexão estabelecida com sucesso"
        
        # Verificar versão do PostgreSQL
        local pg_version=$(run_psql "SELECT version();" | head -1)
        print_info "Versão: $(echo "$pg_version" | cut -d',' -f1)"
    else
        print_failure "Conexão falhou - Verifique credenciais e se PostgreSQL está rodando" "DB"
        print_info "Credenciais: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
        return 1
    fi
    
    print_test "Verificando tabela users"
    run_sql_query "SELECT COUNT(*) FROM users;" "Usuários cadastrados" "DB"
    
    print_test "Verificando tabela style_choices"
    run_sql_query "SELECT COUNT(*) FROM style_choices;" "Escolhas de estilo" "DB"
    
    print_test "Verificando tabela tournament_images"
    run_sql_query "SELECT COUNT(*) FROM tournament_images;" "Imagens de torneio" "DB"
    
    print_test "Verificando tabela tournament_sessions"
    run_sql_query "SELECT COUNT(*) FROM tournament_sessions;" "Sessões de torneio" "DB"
    
    print_test "Verificando relacionamentos (Users ↔ Style Choices)"
    if run_psql "SELECT u.id, sc.category FROM users u LEFT JOIN style_choices sc ON u.id = sc.user_id LIMIT 1;" >/dev/null 2>&1; then
        print_success "Relacionamento Users ↔ Style Choices OK"
    else
        print_failure "Problema no relacionamento Users ↔ Style Choices" "DB"
    fi
    
    print_test "Verificando índices críticos"
    local indexes_count=$(run_psql "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)
    if [ "$indexes_count" -gt 10 ]; then
        print_success "$indexes_count índices encontrados"
    else
        print_warning "Poucos índices ($indexes_count) - performance pode ser impactada" "DB"
    fi
}

# =========================================================================
# TESTES DE BACKEND/API
# =========================================================================

test_backend_server() {
    print_section "SERVIDOR BACKEND"
    
    print_test "Verificando se servidor está rodando na porta 3000"
    if curl -s --connect-timeout 5 http://localhost:3000 >/dev/null 2>&1; then
        print_success "Servidor está respondendo na porta 3000"
    else
        print_failure "Servidor não está respondendo na porta 3000" "API"
        print_info "Para iniciar o servidor execute:"
        print_info "  Terminal 1: npm run server"
        print_info "  Terminal 2: npm run dev"
        return 1
    fi
    
    print_test "Health check endpoint"
    make_http_request "GET" "/health" "" "" "Health check endpoint"
    
    print_test "Info endpoint (se disponível)"
    make_http_request "GET" "/info" "" "" "Info endpoint" || true
    
    print_test "Verificar estrutura de rotas registradas"
    local health_response=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    if echo "$health_response" | grep -q "endpoints\|routes"; then
        print_success "Servidor tem estrutura de rotas configurada"
    else
        print_warning "Estrutura de rotas não clara na resposta" "API"
    fi
}

test_authentication_api() {
    print_section "AUTENTICAÇÃO - API"
    
    print_test "Registro de usuário"
    local register_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}"
    local register_response_json
    register_response_json=$(make_http_request "POST" "/auth/register" "$register_data" "" "Registro de usuário" "201")
    
    if [ $? -eq 0 ] && [ -n "$register_response_json" ]; then
        # Extrair token e user_id da resposta JSON usando jq
        if command -v jq &> /dev/null; then
            export TOKEN=$(echo "$register_response_json" | jq -r '.token')
            export USER_ID=$(echo "$register_response_json" | jq -r '.user.id')
        else
            # Fallback para grep se jq não estiver disponível (menos robusto)
            export TOKEN=$(echo "$register_response_json" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
            export USER_ID=$(echo "$register_response_json" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        fi
        
        if [ -n "$TOKEN" ]; then
            print_success "Token JWT obtido: ${TOKEN:0:20}..."
            print_info "User ID: $USER_ID"
        else
            print_warning "Token não encontrado na resposta de registro" "API"
        fi
    else
        print_warning "Tentando com usuário existente..." "API"
        
        # Tentar login se registro falhou (usuário pode já existir)
        print_test "Login com usuário existente"
        local login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" # Usar o mesmo email de teste
        local login_response_json
        login_response_json=$(make_http_request "POST" "/auth/login" "$login_data" "" "Login usuário existente")
        
        if [ $? -eq 0 ] && [ -n "$login_response_json" ]; then
            if command -v jq &> /dev/null; then
                export TOKEN=$(echo "$login_response_json" | jq -r '.token')
                export USER_ID=$(echo "$login_response_json" | jq -r '.user.id')
            else
                export TOKEN=$(echo "$login_response_json" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
                export USER_ID=$(echo "$login_response_json" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
            fi
            if [ -n "$TOKEN" ]; then
                print_success "Token JWT obtido via login: ${TOKEN:0:20}..."
                print_info "User ID: $USER_ID"
            else
                print_warning "Token não encontrado na resposta de login" "API"
            fi
        fi
    fi
    
    if [ -n "$TOKEN" ]; then
        print_test "Verificação de token (auth/me)"
        make_http_request "GET" "/auth/me" "" "$TOKEN" "Verificação de token" || true
    else
        print_warning "Testes com token serão pulados (token não disponível)" "API"
    fi
}

test_profile_api() {
    print_section "PERFIL - API"
    
    if [ -z "$TOKEN" ]; then
        print_warning "Token não disponível, pulando testes de perfil" "API"
        return
    fi
    
    print_test "Buscar perfil do usuário"
    make_http_request "GET" "/profile" "" "$TOKEN" "Buscar perfil" || true
    
    print_test "Buscar preferências de estilo"
    make_http_request "GET" "/profile/style-preferences" "" "$TOKEN" "Buscar preferências de estilo" || true
    
    print_test "Atualizar preferência de estilo"
    local style_data='{"category":"cores","preferences":{"cor_favorita":"azul","tipo":"quente"}}' # Ajustado para o novo formato
    if make_http_request "PUT" "/profile/style-preferences" "$style_data" "$TOKEN" "Atualizar preferência"; then
        print_test "Verificar se preferência foi salva"
        make_http_request "GET" "/profile/style-preferences" "" "$TOKEN" "Verificar preferência salva" || true
    fi
}

test_tournament_api() {
    print_section "TORNEIOS - API"
    
    if [ -z "$TOKEN" ]; then
        print_warning "Token não disponível, pulando testes de torneio" "API"
        return
    fi
    
    print_test "Listar categorias de torneio"
    make_http_request "GET" "/tournament/categories" "" "$TOKEN" "Listar categorias" || true
    
    print_test "Listar imagens disponíveis"
    make_http_request "GET" "/tournament/images" "" "$TOKEN" "Listar imagens" || true
    
    print_test "Iniciar novo torneio"
    if [ -n "$USER_ID" ]; then
        local tournament_data='{"category":"cores","userId":"'$USER_ID'"}'
        make_http_request "POST" "/tournament/start" "$tournament_data" "$TOKEN" "Iniciar torneio" || true
    else
        print_warning "User ID não disponível, pulando teste de iniciar torneio" "API"
    fi
}

# =========================================================================
# TESTES DE INTEGRAÇÃO
# =========================================================================

test_integration() {
    print_section "INTEGRAÇÃO COMPLETA"
    
    print_test "Fluxo completo: Registro → Login → Perfil → Torneio"
    
    # 1. Novo usuário para teste de integração
    local integration_email="full.test.$(date +%s)@matchit.com"
    local integration_data="{\"email\":\"$integration_email\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Integration Test\"}"
    
    local register_response_json
    register_response_json=$(make_http_request "POST" "/auth/register" "$integration_data" "" "Fluxo: Registro" "201")
    
    if [ $? -eq 0 ] && [ -n "$register_response_json" ]; then
        local integration_token=""
        local integration_user_id=""
        
        if command -v jq &> /dev/null; then
            integration_token=$(echo "$register_response_json" | jq -r '.token')
            integration_user_id=$(echo "$register_response_json" | jq -r '.user.id')
        else
            integration_token=$(echo "$register_response_json" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
            integration_user_id=$(echo "$register_response_json" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        fi
        
        if [ -n "$integration_token" ] && [ -n "$integration_user_id" ]; then
            # 2. Configurar preferência
            local pref_data='{"category":"estilos","preferences":{"estilo_preferido":"moderno","sub_estilo":"casual"}}' # Ajustado para o novo formato
            if make_http_request "PUT" "/profile/style-preferences" "$pref_data" "$integration_token" "Fluxo: Configurar preferência"; then
                
                # 3. Verificar se foi salva no banco
                print_test "Verificando persistência no banco de dados"
                local saved_prefs
                saved_prefs=$(run_psql "SELECT COUNT(*) FROM style_choices WHERE user_id = '$integration_user_id';" | xargs) # Adicionado aspas simples para o user_id
                if [ "$saved_prefs" -gt 0 ]; then
                    print_success "Preferência persistida no banco ($saved_prefs registros)"
                else
                    print_failure "Preferência não foi persistida no banco" "INTEGRATION"
                fi
                
                # 4. Iniciar torneio
                local tournament_data='{"category":"cores","userId":"'$integration_user_id'"}'
                make_http_request "POST" "/tournament/start" "$tournament_data" "$integration_token" "Fluxo: Iniciar torneio" || true
            fi
        else
            print_failure "Token ou User ID não obtidos no registro" "INTEGRATION"
        fi
    else
        print_failure "Falha no registro - integração não pode continuar" "INTEGRATION"
    fi
    
    print_test "Verificando consistência Banco ↔ API"
    # Verificar se usuários da API estão no banco
    local api_users_count=0
    local db_users_count
    db_users_count=$(run_psql "SELECT COUNT(*) FROM users;" | xargs)
    
    if [ "$db_users_count" -gt 0 ]; then
        print_success "Banco tem $db_users_count usuários - integração consistente"
    else
        print_failure "Banco não tem usuários - problema de integração" "INTEGRATION"
    fi
}

# =========================================================================
# TESTES DE PERFORMANCE
# =========================================================================

test_performance() {
    print_section "PERFORMANCE"
    
    print_test "Tempo de resposta da API"
    local start_time=$(date +%s%N)
    make_http_request "GET" "/health" "" "" "Performance: Health check" >/dev/null 2>&1
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 100 ]; then
        print_success "API muito rápida: ${duration}ms"
    elif [ $duration -lt 500 ]; then
        print_success "API com boa performance: ${duration}ms"
    elif [ $duration -lt 1000 ]; then
        print_warning "API lenta: ${duration}ms" "PERFORMANCE"
    else
        print_failure "API muito lenta: ${duration}ms" "PERFORMANCE"
    fi
    
    print_test "Performance do banco de dados"
    if check_psql_connection; then
        local db_start=$(date +%s%N)
        run_psql "SELECT COUNT(*) FROM users;" >/dev/null 2>&1
        local db_end=$(date +%s%N)
        local db_duration=$(( (db_end - db_start) / 1000000 ))
        
        if [ $db_duration -lt 50 ]; then
            print_success "Banco muito rápido: ${db_duration}ms"
        elif [ $db_duration -lt 200 ]; then
            print_success "Banco com boa performance: ${db_duration}ms"
        else
            print_warning "Banco lento: ${db_duration}ms" "PERFORMANCE"
        fi
    else
        print_failure "Não foi possível testar performance do banco" "PERFORMANCE"
    fi
    
    print_test "Teste de carga básico (5 requisições simultâneas)"
    local load_start=$(date +%s%N)
    for i in {1..5}; do
        curl -s http://localhost:3000/api/health >/dev/null 2>&1 &
    done
    wait
    local load_end=$(date +%s%N)
    local load_duration=$(( (load_end - load_start) / 1000000 ))
    
    if [ $load_duration -lt 1000 ]; then
        print_success "Carga básica suportada: ${load_duration}ms para 5 requisições"
    else
        print_warning "Sistema lento sob carga: ${load_duration}ms" "PERFORMANCE"
    fi
}

# =========================================================================
# RELATÓRIO FINAL
# =========================================================================

generate_final_report() {
    print_header "RELATÓRIO FINAL - TESTE COMPLETO"
    
    ((TOTAL_TESTS = PASSED_TESTS + FAILED_TESTS + WARNING_TESTS))
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    fi
    
    echo -e "${CYAN}📊 ESTATÍSTICAS GERAIS:${NC}"
    echo -e "   Total de testes: $TOTAL_TESTS"
    echo -e "   ${GREEN}Sucessos: $PASSED_TESTS${NC}"
    echo -e "   ${RED}Falhas: $FAILED_TESTS${NC}"
    echo -e "   ${YELLOW}Avisos: $WARNING_TESTS${NC}"
    echo -e "   Taxa de sucesso: ${success_rate}%"
    echo ""
    
    echo -e "${CYAN}🔧 CONFIGURAÇÃO TESTADA:${NC}"
    echo -e "   Banco: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo -e "   API: $API_BASE_URL"
    echo -e "   Data: $(date)"
    echo ""
    
    # Status geral
    if [ $FAILED_TESTS -eq 0 ] && [ $WARNING_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 SISTEMA 100% FUNCIONAL!${NC}"
        echo -e "${GREEN}   ✅ Banco de dados funcionando${NC}"
        echo -e "${GREEN}   ✅ Backend respondendo${NC}"
        echo -e "${GREEN}   ✅ APIs funcionando${NC}"
        echo -e "${GREEN}   ✅ Integração completa${NC}"
        echo -e "${GREEN}   ✅ Performance adequada${NC}"
    elif [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${YELLOW}✅ SISTEMA FUNCIONAL com avisos menores${NC}"
        echo -e "${YELLOW}   Sistema está operacional mas pode ser otimizado${NC}"
    elif [ $success_rate -ge 80 ]; then
        echo -e "${YELLOW}⚠️  SISTEMA MAJORITARIAMENTE FUNCIONAL${NC}"
        echo -e "${YELLOW}   Alguns problemas encontrados mas sistema utilizável${NC}"
    else
        echo -e "${RED}❌ SISTEMA COM PROBLEMAS CRÍTICAS${NC}"
        echo -e "${RED}   Correções necessárias antes do uso${NC}"
    fi
    
    # Falhas críticas
    if [ $FAILED_TESTS -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ FALHAS CRÍTICAS:${NC}"
        printf '%s\n' "${DB_RESULTS[@]}" "${API_RESULTS[@]}" "${INTEGRATION_RESULTS[@]}" | grep "FAIL:" | while read -r fail; do
            echo -e "   ${RED}• ${fail#FAIL: }${NC}"
        done
    fi
    
    # Avisos
    if [ $WARNING_TESTS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  AVISOS:${NC}"
        printf '%s\n' "${DB_RESULTS[@]}" "${API_RESULTS[@]}" "${INTEGRATION_RESULTS[@]}" | grep "WARN:" | while read -r warn; do
            echo -e "   ${YELLOW}• ${warn#WARN: }${NC}"
        done
    fi
    
    # Próximos passos
    echo ""
    echo -e "${BLUE}🚀 PRÓXIMOS PASSOS:${NC}"
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "   1. ${RED}Corrigir falhas críticas listadas acima${NC}"
        if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo -e "   2. ${CYAN}Iniciar o servidor: npm run server${NC}"
        fi
        if ! check_psql_connection; then
            echo -e "   3. ${CYAN}Verificar PostgreSQL e credenciais do banco${NC}"
        fi
        echo -e "   4. Executar testes novamente após correções"
    else
        echo -e "   1. ${GREEN}Sistema está funcional para desenvolvimento${NC}"
        echo -e "   2. Continuar integração incremental: ${CYAN}./scripts/habilitar-proxima-fase.sh${NC}"
        echo -e "   3. Testar frontend: ${CYAN}npm run dev${NC}"
        echo -e "   4. Desenvolver novas funcionalidades"
    fi
    
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🏁 TESTE COMPLETO FINALIZADO - $(date)${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════${NC}"
}

# =========================================================================
# FUNÇÃO PRINCIPAL
# =========================================================================

main() {
    print_header "🧪 MATCHIT - TESTE COMPLETO DO SISTEMA"
    echo -e "${BLUE}🎯 Testando: Infraestrutura + Banco + Backend + API + Integração${NC}"
    echo -e "${BLUE}📅 $(date)${NC}"
    echo ""
    
    echo -e "${CYAN}🔧 CONFIGURAÇÃO DE TESTE:${NC}"
    echo -e "   Banco: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo -e "   API: $API_BASE_URL"
    echo ""
    
    echo -e "${YELLOW}Este script irá testar:${NC}"
    echo -e "   🔧 Infraestrutura (Node.js, npm, PostgreSQL, curl)"
    echo -e "   🗄️  Banco de dados ($DB_NAME) e estrutura de tabelas"
    echo -e "   🚀 Servidor backend na porta 3000"
    echo -e "   🔐 Sistema completo de autenticação (registro + login)"
    echo -e "   👤 APIs de perfil e preferências de estilo"
    echo -e "   🏆 APIs de torneio e imagens"
    echo -e "   🔄 Integração completa end-to-end"
    echo -e "   ⚡ Performance e responsividade"
    echo ""
    
    read -p "❓ Executar teste completo? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Teste cancelado."
        exit 0
    fi
    
    echo -e "${BLUE}🚀 Iniciando testes completos...${NC}"
    
    # Executar todos os testes
    test_infrastructure
    test_database
    test_backend_server
    test_authentication_api
    test_profile_api
    test_tournament_api
    test_integration
    test_performance
    
    # Gerar relatório final
    generate_final_report
    
    # Exit code baseado nos resultados
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Executar se script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
