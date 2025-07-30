#!/bin/bash

# start-admin.sh - Script para iniciar Dashboard Administrativo MatchIt
# Uso: ./start-admin.sh [dev|prod|standalone]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando! Por favor, inicie o Docker."
        exit 1
    fi
    log "✅ Docker está rodando"
}

# Função para verificar se docker-compose está disponível
check_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        error "docker-compose não encontrado! Por favor, instale o docker-compose."
        exit 1
    fi
    log "✅ docker-compose encontrado"
}

# Função para criar arquivo .env se não existir
create_env_file() {
    local env_file="../.env"
    
    if [ ! -f "$env_file" ]; then
        log "📝 Criando arquivo .env com configurações padrão..."
        cat > "$env_file" << EOF
# MatchIt Environment Configuration

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Admin Dashboard
ADMIN_USERNAME=admin
ADMIN_PASSWORD=matchit_admin_2025
SECRET_KEY=matchit_admin_secret_key_2025_change_in_production
SESSION_TIMEOUT=7200

# Upload Settings
MAX_FILE_SIZE_MB=5
ALLOWED_FORMATS=jpg,jpeg,png,webp

# Security
JWT_SECRET=matchit_secret_key_production_2024_change_this

# Logs
LOG_LEVEL=INFO
DEBUG_MODE=false
ADMIN_DEBUG_LOGS=true

# Streamlit
STREAMLIT_THEME_BASE=light
EOF
        log "✅ Arquivo .env criado em $env_file"
        warn "⚠️  Por favor, revise e ajuste as configurações no arquivo .env antes de usar em produção!"
    else
        log "✅ Arquivo .env já existe"
    fi
}

# Função para verificar se os serviços estão saudáveis
wait_for_services() {
    log "🕐 Aguardando serviços ficarem saudáveis..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "healthy"; then
            log "✅ Serviços estão saudáveis"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    warn "⚠️  Alguns serviços podem não estar completamente saudáveis, mas continuando..."
}

# Função para mostrar status dos serviços
show_status() {
    log "📊 Status dos serviços:"
    docker-compose ps
    
    echo ""
    log "🔗 URLs de acesso:"
    echo "   • Dashboard Admin: http://localhost:8501"
    echo "   • API Backend: http://localhost:3000"
    echo "   • Admin via Proxy: http://localhost:8080/admin (se nginx estiver rodando)"
    echo ""
    log "👤 Credenciais padrão do admin:"
    echo "   • Usuário: admin"
    echo "   • Senha: matchit_admin_2025"
    echo ""
}

# Função para parar serviços
stop_services() {
    log "🛑 Parando serviços administrativos..."
    docker-compose --profile admin down
    log "✅ Serviços parados"
}

# Função para limpeza completa
cleanup() {
    log "🧹 Realizando limpeza completa..."
    docker-compose --profile admin down -v --remove-orphans
    log "✅ Limpeza concluída"
}

# Função principal
main() {
    local mode="${1:-dev}"
    
    log "🚀 Iniciando MatchIt Admin Dashboard - Modo: $mode"
    
    # Verificações iniciais
    check_docker
    check_compose
    create_env_file
    
    case "$mode" in
        "dev"|"development")
            log "🔧 Iniciando em modo desenvolvimento..."
            docker-compose --profile admin --profile dev up --build -d
            ;;
        "prod"|"production")
            log "🏭 Iniciando em modo produção..."
            docker-compose --profile admin --profile prod up --build -d
            ;;
        "standalone"|"admin-only")
            log "🎯 Iniciando apenas dashboard admin..."
            docker-compose up admin-dashboard postgres -d --build
            ;;
        "full")
            log "🌟 Iniciando stack completo com admin..."
            docker-compose --profile full up --build -d
            ;;
        "stop")
            stop_services
            exit 0
            ;;
        "clean"|"cleanup")
            cleanup
            exit 0
            ;;
        "status")
            show_status
            exit 0
            ;;
        "logs")
            docker-compose logs -f admin-dashboard
            exit 0
            ;;
        "help"|"-h"|"--help")
            echo "Uso: $0 [modo]"
            echo ""
            echo "Modos disponíveis:"
            echo "  dev         - Desenvolvimento (padrão)"
            echo "  prod        - Produção"
            echo "  standalone  - Apenas admin + postgres"
            echo "  full        - Stack completo"
            echo "  stop        - Parar serviços admin"
            echo "  clean       - Limpeza completa"
            echo "  status      - Mostrar status"
            echo "  logs        - Mostrar logs do admin"
            echo "  help        - Mostrar esta ajuda"
            exit 0
            ;;
        *)
            error "Modo inválido: $mode"
            echo "Use '$0 help' para ver opções disponíveis"
            exit 1
            ;;
    esac
    
    # Aguardar serviços
    wait_for_services
    
    # Mostrar status
    show_status
    
    log "🎉 Dashboard administrativo iniciado com sucesso!"
    log "📝 Para parar: $0 stop"
    log "📊 Para ver logs: $0 logs"
}

# Executar função principal
main "$@"