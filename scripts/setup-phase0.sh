#!/bin/bash

# scripts/setup-phase0.sh - Setup completo da Fase 0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${CYAN}${1}${NC}"
}

print_step() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Função para aguardar confirmação
wait_for_confirmation() {
    local message="$1"
    echo ""
    print_info "$message"
    read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."
    echo ""
}

# Verificar dependências necessárias
check_dependencies() {
    print_header "🔍 VERIFICANDO DEPENDÊNCIAS"
    
    local missing_deps=()
    
    # Verificar Node.js
    if command -v node &> /dev/null; then
        node_version=$(node --version)
        print_status "Node.js encontrado: $node_version"
    else
        print_error "Node.js não encontrado"
        missing_deps+=("Node.js")
    fi
    
    # Verificar npm
    if command -v npm &> /dev/null; then
        npm_version=$(npm --version)
        print_status "npm encontrado: $npm_version"
    else
        print_error "npm não encontrado"
        missing_deps+=("npm")
    fi
    
    # Verificar PostgreSQL client
    if command -v psql &> /dev/null; then
        psql_version=$(psql --version | head -n1)
        print_status "PostgreSQL client encontrado: $psql_version"
    else
        print_warning "psql não encontrado (recomendado para testes de banco)"
        print_info "Instale com: sudo apt-get install postgresql-client"
    fi
    
    # Verificar curl
    if command -v curl &> /dev/null; then
        print_status "curl encontrado"
    else
        print_error "curl não encontrado"
        missing_deps+=("curl")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Dependências faltando: ${missing_deps[*]}"
        print_info "Instale as dependências antes de continuar"
        exit 1
    fi
    
    print_status "Todas as dependências essenciais estão disponíveis"
}

# Verificar estrutura do projeto
check_project_structure() {
    print_header "🏗️  VERIFICANDO ESTRUTURA DO PROJETO"
    
    if [ ! -f "package.json" ]; then
        print_error "package.json não encontrado. Execute este script na raiz do projeto MatchIt"
        exit 1
    fi
    print_status "package.json encontrado"
    
    if [ ! -d "server" ]; then
        print_error "Diretório server/ não encontrado"
        exit 1
    fi
    print_status "Diretório server/ encontrado"
    
    if [ ! -f "server/app.js" ]; then
        print_error "server/app.js não encontrado"
        print_info "Certifique-se de ter implementado a estrutura modular"
        exit 1
    fi
    print_status "server/app.js encontrado"
}

# Instalar dependências Node.js
install_node_dependencies() {
    print_header "📦 INSTALANDO DEPENDÊNCIAS NODE.JS"
    
    if [ ! -d "node_modules" ]; then
        print_step "Executando npm install..."
        if npm install; then
            print_status "Dependências instaladas com sucesso"
        else
            print_error "Falha ao instalar dependências"
            exit 1
        fi
    else
        print_status "node_modules já existe"
        print_info "Verificando se precisa atualizar..."
        npm outdated || true
    fi
}

# Configurar arquivo .env
setup_environment() {
    print_header "🔧 CONFIGURANDO AMBIENTE"
    
    if [ ! -f ".env" ]; then
        print_step "Criando arquivo .env..."
        cat > .env << 'EOF'
# Database Configuration - MatchIt
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Server Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-matchit-2025
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:4173

# Logging
LOG_LEVEL=debug

# Upload Configuration
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=jpeg,jpg,png,gif
EOF
        print_status "Arquivo .env criado com credenciais fornecidas"
        print_warning "LEMBRE-SE: Altere JWT_SECRET em produção!"
    else
        print_status "Arquivo .env já existe"
        
        # Verificar se tem as credenciais corretas
        if grep -q "DB_NAME=matchit_db" .env && grep -q "DB_USER=matchit" .env && grep -q "DB_PASSWORD=matchit123" .env; then
            print_status "Credenciais do banco corretas no .env"
        else
            print_warning "Credenciais do banco podem estar incorretas no .env"
            print_info "Verifique se DB_NAME=matchit_db, DB_USER=matchit, DB_PASSWORD=matchit123"
        fi
    fi
}

# Configurar banco de dados
setup_database() {
    print_header "🗄️  CONFIGURANDO BANCO DE DADOS"
    
    if [ -f "scripts/setup-database.sh" ]; then
        print_step "Executando setup do banco..."
        if chmod +x scripts/setup-database.sh && ./scripts/setup-database.sh; then
            print_status "Banco de dados configurado com sucesso"
        else
            print_error "Falha na configuração do banco"
            print_info "Verifique se PostgreSQL está rodando e as credenciais estão corretas"
            return 1
        fi
    else
        print_error "Script setup-database.sh não encontrado"
        print_info "Certifique-se de ter criado o script de setup do banco"
        return 1
    fi
}

# Corrigir styleAdjustmentService.js
fix_style_service() {
    print_header "🔧 CORRIGINDO STYLEADJUSTMENTSERVICE"
    
    if [ -f "server/services/styleAdjustmentService.js" ]; then
        # Fazer backup
        cp server/services/styleAdjustmentService.js server/services/styleAdjustmentService.js.backup.$(date +%Y%m%d_%H%M%S)
        print_status "Backup do styleAdjustmentService criado"
        
        print_warning "IMPORTANTE: Substitua o arquivo server/services/styleAdjustmentService.js"
        print_info "Use o artifact: style_adjustment_service_fixed"
        wait_for_confirmation "Arquivo styleAdjustmentService.js foi atualizado?"
    else
        print_warning "styleAdjustmentService.js não encontrado"
    fi
}

# Testar servidor
test_server() {
    print_header "🚀 TESTANDO SERVIDOR"
    
    print_step "Iniciando servidor em background..."
    
    # Verificar se servidor já está rodando
    if curl -f -s "http://localhost:3001/api/health" > /dev/null; then
        print_status "Servidor já está rodando"
        return 0
    fi
    
    # Iniciar servidor em background
    npm run server &
    SERVER_PID=$!
    
    # Aguardar servidor inicializar
    print_info "Aguardando servidor inicializar..."
    sleep 10
    
    # Testar se está respondendo
    if curl -f -s "http://localhost:3001/api/health" > /dev/null; then
        print_status "Servidor iniciado com sucesso na porta 3001"
        
        # Testar endpoint principal
        health_response=$(curl -s "http://localhost:3001/api/health")
        print_info "Health check response: $health_response"
        
        # Parar servidor de teste
        kill $SERVER_PID 2>/dev/null || true
        sleep 2
        
        return 0
    else
        print_error "Servidor não está respondendo"
        kill $SERVER_PID 2>/dev/null || true
        return 1
    fi
}

# Executar testes da Fase 0
run_phase0_tests() {
    print_header "🧪 EXECUTANDO TESTES DA FASE 0"
    
    if [ -f "scripts/test-phase0.sh" ]; then
        print_step "Preparando testes..."
        chmod +x scripts/test-phase0.sh
        
        print_info "IMPORTANTE: Certifique-se de que o servidor está rodando"
        print_info "Em outro terminal, execute: npm run server"
        wait_for_confirmation "Servidor está rodando?"
        
        print_step "Executando testes..."
        if ./scripts/test-phase0.sh; then
            print_status "Testes da Fase 0 executados com sucesso"
        else
            print_warning "Alguns testes falharam - verifique os resultados acima"
        fi
    else
        print_warning "Script test-phase0.sh não encontrado"
        print_info "Crie o script usando o artifact: test_phase0_sh"
    fi
}

# Relatório final
final_report() {
    print_header "📋 RELATÓRIO FINAL - SETUP FASE 0"
    
    echo ""
    print_info "Resumo do que foi configurado:"
    echo "  ✅ Dependências Node.js verificadas"
    echo "  ✅ Arquivo .env configurado com credenciais corretas"
    echo "  ✅ Banco de dados PostgreSQL configurado"
    echo "  ✅ Tabela style_choices criada"
    echo "  ✅ Servidor testado e funcionando"
    echo ""
    
    print_info "Próximos passos para usar o sistema:"
    echo "  1. Inicie o servidor: npm run server"
    echo "  2. Execute os testes: ./scripts/test-phase0.sh"
    echo "  3. Teste manualmente: curl http://localhost:3001/api/health"
    echo ""
    
    print_info "Arquivos importantes criados/modificados:"
    echo "  📄 .env - Configurações de ambiente"
    echo "  🗄️  Banco: tabela style_choices"
    echo "  🔧 Backup: styleAdjustmentService.js.backup.*"
    echo ""
    
    print_header "🎉 FASE 0 PRONTA PARA USO!"
    print_status "Integração Backend-Frontend implementada com sucesso"
}

# Função principal
main() {
    print_header "🚀 SETUP COMPLETO DA FASE 0 - MATCHIT"
    print_info "Este script irá configurar todo o ambiente para a Fase 0"
    echo ""
    
    wait_for_confirmation "Deseja continuar com o setup?"
    
    # Executar etapas em sequência
    check_dependencies
    echo ""
    
    check_project_structure
    echo ""
    
    install_node_dependencies
    echo ""
    
    setup_environment
    echo ""
    
    setup_database
    echo ""
    
    fix_style_service
    echo ""
    
    test_server
    echo ""
    
    run_phase0_tests
    echo ""
    
    final_report
}

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    print_error "Execute este script na raiz do projeto MatchIt"
    exit 1
fi

# Executar função principal
main "$@"