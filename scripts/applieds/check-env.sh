#!/bin/bash

# scripts/check-env.sh - Verificar configuração do ambiente

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

# Verificar arquivo .env
check_env_file() {
    print_header "🔧 VERIFICANDO ARQUIVO .ENV"
    
    if [ -f ".env" ]; then
        print_status "Arquivo .env encontrado"
        
        # Verificar variáveis essenciais
        required_vars=("DB_NAME" "DB_USER" "DB_PASSWORD" "DB_HOST" "DB_PORT" "JWT_SECRET" "NODE_ENV" "PORT")
        missing_vars=()
        
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                value=$(grep "^${var}=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
                if [ -n "$value" ]; then
                    if [ "$var" == "DB_PASSWORD" ] || [ "$var" == "JWT_SECRET" ]; then
                        print_status "$var=****** (configurado)"
                    else
                        print_status "$var=$value"
                    fi
                else
                    print_warning "$var está vazio"
                    missing_vars+=("$var")
                fi
            else
                print_error "$var não encontrado"
                missing_vars+=("$var")
            fi
        done
        
        if [ ${#missing_vars[@]} -eq 0 ]; then
            print_status "Todas as variáveis essenciais estão configuradas"
        else
            print_warning "Variáveis faltando ou vazias: ${missing_vars[*]}"
        fi
        
    else
        print_error "Arquivo .env não encontrado"
        print_info "Criando arquivo .env com configurações padrão..."
        create_env_file
    fi
}

# Criar arquivo .env
create_env_file() {
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Server Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:4173

# Logging
LOG_LEVEL=debug
EOF
    
    print_status "Arquivo .env criado com configurações padrão"
    print_warning "IMPORTANTE: Altere JWT_SECRET para um valor seguro!"
}

# Verificar conexão com banco
test_database_connection() {
    print_header "🗄️  TESTANDO CONEXÃO COM BANCO"
    
    # Extrair configurações do .env
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | grep -v '^$' | xargs)
    fi
    
    # Usar as variáveis ou valores padrão
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-matchit_db}
    DB_USER=${DB_USER:-matchit}
    DB_PASSWORD=${DB_PASSWORD:-matchit123}
    
    db_url="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    
    print_info "Testando conexão: postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
    
    if command -v psql &> /dev/null; then
        if psql "$db_url" -c "SELECT NOW() as current_time;" 2>/dev/null; then
            print_status "Conexão com banco de dados bem-sucedida"
            
            # Verificar se tabela style_choices existe
            if psql "$db_url" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'style_choices';" 2>/dev/null | grep -q "style_choices"; then
                print_status "Tabela style_choices existe"
            else
                print_warning "Tabela style_choices não existe (execute setup-database.sh)"
            fi
            
        else
            print_error "Falha na conexão com banco de dados"
            print_info "Verifique se PostgreSQL está rodando e as credenciais estão corretas"
        fi
    else
        print_warning "psql não encontrado - não é possível testar conexão"
    fi
}

# Verificar se servidor está rodando
check_server_status() {
    print_header "🚀 VERIFICANDO STATUS DO SERVIDOR"
    
    PORT=${PORT:-3001}
    
    if curl -f -s "http://localhost:$PORT/api/health" > /dev/null; then
        print_status "Servidor está rodando na porta $PORT"
        
        # Testar endpoints principais
        endpoints=("/api/health" "/api/info" "/api/auth/register")
        for endpoint in "${endpoints[@]}"; do
            if curl -f -s "http://localhost:$PORT$endpoint" > /dev/null 2>&1; then
                print_status "Endpoint $endpoint respondendo"
            else
                print_warning "Endpoint $endpoint não responde"
            fi
        done
        
    else
        print_warning "Servidor não está rodando ou não responde na porta $PORT"
        print_info "Para iniciar: npm run server ou node server/app.js"
    fi
}

# Verificar dependências Node.js
check_node_dependencies() {
    print_header "📦 VERIFICANDO DEPENDÊNCIAS NODE.JS"
    
    if [ -f "package.json" ]; then
        print_status "package.json encontrado"
        
        if [ -d "node_modules" ]; then
            print_status "node_modules existe"
            
            # Verificar dependências críticas
            critical_deps=("express" "pg" "jsonwebtoken" "bcryptjs" "cors" "dotenv")
            for dep in "${critical_deps[@]}"; do
                if [ -d "node_modules/$dep" ]; then
                    print_status "$dep instalado"
                else
                    print_error "$dep não encontrado"
                fi
            done
            
        else
            print_error "node_modules não existe"
            print_info "Execute: npm install"
        fi
    else
        print_error "package.json não encontrado"
    fi
}

# Verificar estrutura modular
check_modular_structure() {
    print_header "🏗️  VERIFICANDO ESTRUTURA MODULAR"
    
    required_dirs=("server/config" "server/middleware" "server/routes" "server/services" "server/utils")
    required_files=("server/app.js" "server/routes/profile.js" "server/services/profileService.js")
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_status "Diretório $dir existe"
        else
            print_error "Diretório $dir não existe"
        fi
    done
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_status "Arquivo $file existe"
        else
            print_error "Arquivo $file não existe"
        fi
    done
}

# Relatório de próximos passos
suggest_next_steps() {
    print_header "🎯 PRÓXIMOS PASSOS SUGERIDOS"
    
    echo ""
    print_info "Com base na verificação acima:"
    echo ""
    
    if [ ! -f ".env" ]; then
        echo "1. ✏️  Configure o arquivo .env com suas credenciais"
    fi
    
    if ! command -v psql &> /dev/null; then
        echo "2. 📥 Instale PostgreSQL client: apt install postgresql-client"
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "3. 📦 Instale dependências: npm install"
    fi
    
    echo "4. 🗄️  Execute setup do banco: ./scripts/setup-database.sh"
    echo "5. 🚀 Inicie o servidor: npm run server"
    echo "6. 🧪 Execute os testes: ./scripts/test-phase0.sh"
    
    echo ""
    print_info "Scripts disponíveis:"
    echo "  ./scripts/check-env.sh       - Este script"
    echo "  ./scripts/setup-database.sh  - Configurar banco"
    echo "  ./scripts/test-phase0.sh     - Testar Fase 0"
    echo ""
}

# Função principal
main() {
    print_header "🔍 VERIFICAÇÃO DO AMBIENTE - MATCHIT FASE 0"
    echo ""
    
    check_env_file
    echo ""
    
    test_database_connection
    echo ""
    
    check_server_status
    echo ""
    
    check_node_dependencies
    echo ""
    
    check_modular_structure
    echo ""
    
    suggest_next_steps
}

# Executar
main "$@"