# scripts/teste-completo-sistema.sh - Teste abrangente do estado atual do MatchIt

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações
API_BASE="http://localhost:3000/api"
TEST_EMAIL="teste_completo_$(date +%s)@matchit.com"
TEST_PASSWORD="TesteSistema123!"
TOKEN=""

# Contadores
TOTAL_TESTES=0
TESTES_PASSOU=0
TESTES_FALHOU=0

print_header() { echo -e "${CYAN}🔍 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Função para executar teste
executar_teste() {
    local nome="$1"
    local comando="$2"
    local esperado="$3"
    
    TOTAL_TESTES=$((TOTAL_TESTES + 1))
    print_info "Testando: $nome"
    
    resultado=$(eval "$comando" 2>/dev/null)
    status=$?
    
    if [ $status -eq $esperado ]; then
        TESTES_PASSOU=$((TESTES_PASSOU + 1))
        print_success "PASSOU: $nome"
    else
        TESTES_FALHOU=$((TESTES_FALHOU + 1))
        print_error "FALHOU: $nome (Status: $status, Esperado: $esperado)"
        echo "Resposta: $resultado"
    fi
    echo ""
}

# Teste de infraestrutura
testar_infraestrutura() {
    print_header "📋 TESTANDO INFRAESTRUTURA"
    
    # Servidor rodando
    executar_teste "Servidor respondendo" \
        "curl -s -o /dev/null -w '%{http_code}' $API_BASE/health" \
        0
    
    # Banco de dados
    executar_teste "Conexão com banco" \
        "curl -s $API_BASE/health | grep -q 'database.*ok'" \
        0
    
    # Endpoints básicos
    executar_teste "Endpoint de registro disponível" \
        "curl -s -o /dev/null -w '%{http_code}' -X POST $API_BASE/auth/register" \
        0
}

# Teste de autenticação
testar_autenticacao() {
    print_header "🔐 TESTANDO AUTENTICAÇÃO"
    
    # Registrar usuário
    print_info "Registrando usuário de teste..."
    response=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Teste Sistema\"}")
    
    if echo "$response" | grep -q "token\|success"; then
        print_success "Usuário registrado"
        TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        TESTES_PASSOU=$((TESTES_PASSOU + 1))
    else
        print_error "Falha no registro: $response"
        TESTES_FALHOU=$((TESTES_FALHOU + 1))
    fi
    
    TOTAL_TESTES=$((TOTAL_TESTES + 1))
    
    # Login
    if [ -n "$TOKEN" ]; then
        executar_teste "Login funcional" \
            "curl -s -X POST $API_BASE/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}' | grep -q token" \
            0
    fi
}

# Teste do sistema de perfil
testar_perfil() {
    print_header "👤 TESTANDO SISTEMA DE PERFIL"
    
    if [ -z "$TOKEN" ]; then
        print_warning "Token não disponível, pulando testes de perfil"
        return
    fi
    
    # Buscar perfil
    executar_teste "Buscar perfil do usuário" \
        "curl -s -H 'Authorization: Bearer $TOKEN' $API_BASE/profile | grep -q 'email\|id'" \
        0
    
    # Atualizar perfil
    executar_teste "Atualizar perfil" \
        "curl -s -X PUT -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' $API_BASE/profile -d '{\"bio\":\"Teste bio\"}' | grep -q 'success\|updated'" \
        0
}

# Teste do sistema de preferências (Fase 0)
testar_preferencias_estilo() {
    print_header "🎨 TESTANDO PREFERÊNCIAS DE ESTILO (FASE 0)"
    
    if [ -z "$TOKEN" ]; then
        print_warning "Token não disponível, pulando testes de preferências"
        return
    fi
    
    # GET preferências
    executar_teste "Buscar preferências de estilo" \
        "curl -s -H 'Authorization: Bearer $TOKEN' $API_BASE/profile/style-preferences" \
        0
    
    # PUT preferência individual
    executar_teste "Salvar preferência individual" \
        "curl -s -X PUT -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' $API_BASE/profile/style-preferences -d '{\"category\":\"cores\",\"questionId\":\"cor_1\",\"selectedOption\":\"azul\"}'" \
        0
    
    # POST batch preferências
    executar_teste "Salvar preferências em lote" \
        "curl -s -X POST -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' $API_BASE/profile/style-preferences/batch -d '{\"preferences\":[{\"category\":\"roupas\",\"questionId\":\"roupa_1\",\"selectedOption\":\"casual\"}]}'" \
        0
}

# Teste do algoritmo de recomendação
testar_recomendacoes() {
    print_header "🤖 TESTANDO SISTEMA DE RECOMENDAÇÕES"
    
    if [ -z "$TOKEN" ]; then
        print_warning "Token não disponível, pulando testes de recomendações"
        return
    fi
    
    # Buscar recomendações
    executar_teste "Algoritmo de recomendações" \
        "curl -s -H 'Authorization: Bearer $TOKEN' $API_BASE/recommendations" \
        0
    
    # Enviar feedback
    executar_teste "Sistema de feedback" \
        "curl -s -X POST -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' $API_BASE/recommendations/feedback -d '{\"targetUserId\":1,\"action\":\"like\"}'" \
        0
}

# Teste de performance básica
testar_performance() {
    print_header "⚡ TESTANDO PERFORMANCE BÁSICA"
    
    start_time=$(date +%s%N)
    curl -s "$API_BASE/health" > /dev/null
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ $duration -lt 1000 ]; then
        print_success "Response time: ${duration}ms (< 1s)"
        TESTES_PASSOU=$((TESTES_PASSOU + 1))
    else
        print_error "Response time: ${duration}ms (> 1s)"
        TESTES_FALHOU=$((TESTES_FALHOU + 1))
    fi
    
    TOTAL_TESTES=$((TOTAL_TESTES + 1))
}

# Teste específico para Fase 1 (Torneios)
testar_sistema_torneios() {
    print_header "🏆 TESTANDO SISTEMA DE TORNEIOS (FASE 1)"
    
    print_warning "❌ Sistema de torneios NÃO IMPLEMENTADO"
    print_info "Endpoints esperados mas ausentes:"
    echo "  - GET /api/tournaments/categories"
    echo "  - POST /api/tournaments/start"
    echo "  - PUT /api/tournaments/choose"
    echo "  - GET /api/tournaments/results"
    
    # Tentar acessar endpoints de torneio (devem falhar)
    executar_teste "Endpoint de torneios (deve falhar)" \
        "curl -s -o /dev/null -w '%{http_code}' $API_BASE/tournaments/categories" \
        1  # Esperamos que falhe
}

# Relatório final
gerar_relatorio_final() {
    print_header "📊 RELATÓRIO COMPLETO DO SISTEMA"
    
    taxa_sucesso=0
    if [ $TOTAL_TESTES -gt 0 ]; then
        taxa_sucesso=$(( (TESTES_PASSOU * 100) / TOTAL_TESTES ))
    fi
    
    echo ""
    print_info "📈 ESTATÍSTICAS GERAIS:"
    echo "  Total de testes: $TOTAL_TESTES"
    echo "  Testes aprovados: $TESTES_PASSOU"
    echo "  Testes falharam: $TESTES_FALHOU"
    echo "  Taxa de sucesso: $taxa_sucesso%"
    
    echo ""
    print_header "🎯 STATUS DAS FASES:"
    
    if [ $taxa_sucesso -ge 80 ]; then
        print_success "Fase 0: FUNCIONAL (integração backend-frontend)"
    else
        print_warning "Fase 0: PROBLEMAS DETECTADOS"
    fi
    
    print_error "Fase 1: NÃO IMPLEMENTADA (sistema de torneios)"
    print_warning "Fase 2: PARCIAL (perfil básico funcional)"
    
    echo ""
    print_header "🚀 PRÓXIMOS PASSOS RECOMENDADOS:"
    
    if [ $taxa_sucesso -lt 80 ]; then
        echo "1. 🔧 URGENTE: Corrigir integração Fase 0"
        echo "   ./scripts/setup-phase0.sh"
    fi
    
    echo "2. 🏆 CRÍTICO: Implementar sistema de torneios (Fase 1)"
    echo "   - Este é o diferencial principal do produto"
    echo "   - Necessário para MVP funcional"
    
    echo "3. 👤 Completar sistema de perfil (Fase 2)"
    echo "   - Username único"
    echo "   - Sistema de 5 fotos"
    
    echo ""
    if [ $taxa_sucesso -ge 80 ]; then
        print_success "✅ SISTEMA BASE ESTÁVEL - Pronto para desenvolvimento das próximas fases"
    else
        print_error "❌ SISTEMA BASE INSTÁVEL - Corrigir problemas antes de prosseguir"
    fi
}

# Limpeza
cleanup() {
    if [ -n "$TOKEN" ]; then
        print_info "🧹 Limpando dados de teste..."
        curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$API_BASE/user" > /dev/null
    fi
}

# Função principal
main() {
    print_header "🚀 TESTE COMPLETO DO SISTEMA MATCHIT"
    print_info "Verificando estado atual de todas as fases implementadas"
    echo ""
    
    # Verificar se servidor está rodando
    if ! curl -s "$API_BASE/health" > /dev/null 2>&1; then
        print_error "❌ Servidor não está rodando!"
        print_info "Inicie o servidor com: npm run server"
        exit 1
    fi
    
    # Executar todos os testes
    testar_infraestrutura
    testar_autenticacao
    testar_perfil
    testar_preferencias_estilo
    testar_recomendacoes
    testar_performance
    testar_sistema_torneios
    
    # Cleanup e relatório
    cleanup
    gerar_relatorio_final
    
    # Exit code baseado nos resultados
    if [ $TESTES_FALHOU -gt 5 ]; then
        exit 1
    else
        exit 0
    fi
}

# Verificar dependências
if ! command -v curl &> /dev/null; then
    print_error "curl não encontrado. Instale curl primeiro."
    exit 1
fi

# Executar
main "$@"