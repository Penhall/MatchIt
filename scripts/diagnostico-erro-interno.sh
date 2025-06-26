# scripts/diagnostico-erro-interno.sh - Diagnosticar erro interno do sistema

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "${CYAN}$1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Verificar logs do servidor
verificar_logs_servidor() {
    print_header "📋 VERIFICANDO LOGS DO SERVIDOR"
    
    print_info "Fazendo request de teste para capturar erro..."
    
    # Fazer request que deve falhar para capturar logs
    test_response=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"diagnostico@test.com","password":"123456","name":"Diagnostico"}' 2>/dev/null)
    
    print_info "Resposta do servidor: $test_response"
    
    # Verificar se há logs recentes
    if [ -f "server.log" ]; then
        print_info "Últimos logs do arquivo server.log:"
        tail -20 server.log
    elif [ -f "logs/server.log" ]; then
        print_info "Últimos logs do arquivo logs/server.log:"
        tail -20 logs/server.log
    else
        print_warning "Arquivo de log não encontrado"
    fi
    
    echo ""
}

# Testar conexão com banco de dados
testar_conexao_banco() {
    print_header "🗄️  TESTANDO CONEXÃO COM BANCO DE DADOS"
    
    # Tentar conexão direta com psql
    print_info "Testando conexão direta com psql..."
    
    export PGPASSWORD="matchit123"
    if psql -h localhost -p 5432 -U matchit -d matchit_db -c "SELECT 'Conexao OK' as status, NOW() as timestamp;" 2>/dev/null; then
        print_success "✅ Conexão direta com banco FUNCIONANDO!"
    else
        print_error "❌ Falha na conexão direta com banco"
        print_info "Detalhes do erro:"
        psql -h localhost -p 5432 -U matchit -d matchit_db -c "SELECT 1;" 2>&1 | head -5
    fi
    unset PGPASSWORD
    
    # Verificar se tabelas existem
    print_info "Verificando se tabela 'users' existe..."
    export PGPASSWORD="matchit123"
    table_exists=$(psql -h localhost -p 5432 -U matchit -d matchit_db -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 2>/dev/null)
    
    if echo "$table_exists" | grep -q "t"; then
        print_success "✅ Tabela 'users' existe"
        
        # Verificar estrutura da tabela
        print_info "Estrutura da tabela users:"
        psql -h localhost -p 5432 -U matchit -d matchit_db -c "\d users" 2>/dev/null
    else
        print_error "❌ Tabela 'users' não existe"
        print_info "Criando tabela users..."
        psql -h localhost -p 5432 -U matchit -d matchit_db -c "
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            print_success "✅ Tabela users criada"
        else
            print_error "❌ Falha ao criar tabela users"
        fi
    fi
    unset PGPASSWORD
    
    echo ""
}

# Testar imports dos módulos ES
testar_imports_es() {
    print_header "📦 TESTANDO IMPORTS DOS MÓDULOS ES"
    
    # Criar script de teste para cada módulo
    print_info "Testando database.js..."
    cat > test_database.js << 'EOF'
import database from './server/config/database.js';
console.log('✅ Database import OK');
database.testConnection().then(() => {
    console.log('✅ Database connection OK');
    process.exit(0);
}).catch(error => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
});
EOF
    
    if node test_database.js 2>/dev/null; then
        print_success "✅ database.js importando e conectando"
    else
        print_error "❌ Problema com database.js"
        print_info "Detalhes do erro:"
        node test_database.js 2>&1
    fi
    
    rm -f test_database.js
    
    # Testar middleware
    print_info "Testando auth middleware..."
    cat > test_middleware.js << 'EOF'
import authMiddleware from './server/middleware/auth.js';
console.log('✅ Auth middleware import OK');
console.log('Type:', typeof authMiddleware);
process.exit(0);
EOF
    
    if node test_middleware.js 2>/dev/null; then
        print_success "✅ auth middleware importando"
    else
        print_error "❌ Problema com auth middleware"
        print_info "Detalhes do erro:"
        node test_middleware.js 2>&1
    fi
    
    rm -f test_middleware.js
    
    # Testar rotas
    print_info "Testando auth routes..."
    cat > test_routes.js << 'EOF'
import authRoutes from './server/routes/auth.js';
console.log('✅ Auth routes import OK');
console.log('Type:', typeof authRoutes);
console.log('Methods:', Object.getOwnPropertyNames(authRoutes));
process.exit(0);
EOF
    
    if node test_routes.js 2>/dev/null; then
        print_success "✅ auth routes importando"
    else
        print_error "❌ Problema com auth routes"
        print_info "Detalhes do erro:"
        node test_routes.js 2>&1
    fi
    
    rm -f test_routes.js
    echo ""
}

# Verificar dependências npm
verificar_dependencias() {
    print_header "📦 VERIFICANDO DEPENDÊNCIAS NPM"
    
    required_deps=("express" "bcrypt" "jsonwebtoken" "pg" "dotenv")
    
    for dep in "${required_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            version=$(cat "node_modules/$dep/package.json" | grep '"version"' | cut -d'"' -f4)
            print_success "$dep@$version instalado"
        else
            print_error "$dep não encontrado"
            print_info "Instalando $dep..."
            npm install "$dep" --save
        fi
    done
    
    echo ""
}

# Testar endpoint específico com debug
testar_endpoint_debug() {
    print_header "🔍 TESTE DETALHADO DO ENDPOINT /api/auth/register"
    
    print_info "1. Verificando se endpoint existe..."
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/auth/register")
    
    if [ "$status_code" = "404" ]; then
        print_error "❌ Endpoint não existe (404)"
        return
    elif [ "$status_code" = "405" ]; then
        print_warning "⚠️ Endpoint existe mas método não permitido (405)"
        print_info "Testando GET em vez de POST..."
        curl -s "http://localhost:3000/api/auth/register"
        return
    else
        print_success "✅ Endpoint existe (status: $status_code)"
    fi
    
    print_info "2. Teste com dados mínimos..."
    response=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test1@test.com","password":"123456","name":"Test"}')
    
    print_info "Resposta completa: $response"
    
    if echo "$response" | grep -q "INTERNAL_ERROR"; then
        print_error "❌ Erro interno detectado"
    elif echo "$response" | grep -q "success.*true"; then
        print_success "✅ Registro funcionou!"
    elif echo "$response" | grep -q "EMAIL_EXISTS"; then
        print_warning "⚠️ Email já existe (isso é normal se testou antes)"
        
        # Tentar com email único
        unique_email="test_$(date +%s)@test.com"
        print_info "3. Teste com email único: $unique_email"
        response2=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$unique_email\",\"password\":\"123456\",\"name\":\"Test\"}")
        
        print_info "Resposta com email único: $response2"
    fi
    
    echo ""
}

# Verificar variáveis de ambiente
verificar_env_vars() {
    print_header "🔧 VERIFICANDO VARIÁVEIS DE AMBIENTE"
    
    if [ -f ".env" ]; then
        print_success "✅ Arquivo .env existe"
        
        # Verificar variáveis críticas
        vars=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "JWT_SECRET")
        
        for var in "${vars[@]}"; do
            if grep -q "^$var=" .env; then
                value=$(grep "^$var=" .env | cut -d'=' -f2)
                if [ ${#value} -gt 0 ]; then
                    print_success "$var definido"
                else
                    print_error "$var vazio"
                fi
            else
                print_error "$var não encontrado no .env"
            fi
        done
    else
        print_error "❌ Arquivo .env não encontrado"
    fi
    
    echo ""
}

# Análise do server/app.js
analisar_app_js() {
    print_header "🔍 ANALISANDO SERVER/APP.JS"
    
    if [ -f "server/app.js" ]; then
        # Verificar imports
        if grep -q "import.*auth.*from.*./routes/auth.js" server/app.js; then
            print_success "✅ Import das rotas de auth encontrado"
        else
            print_error "❌ Import das rotas de auth não encontrado"
        fi
        
        if grep -q "import.*authMiddleware.*from.*./middleware/auth.js" server/app.js; then
            print_success "✅ Import do middleware de auth encontrado"
        else
            print_error "❌ Import do middleware de auth não encontrado"
        fi
        
        if grep -q "import.*database.*from.*./config/database.js" server/app.js; then
            print_success "✅ Import do database encontrado"
        else
            print_error "❌ Import do database não encontrado"
        fi
        
        # Verificar uso das rotas
        if grep -q "app.use.*'/api/auth'.*authRoutes" server/app.js; then
            print_success "✅ Uso das rotas de auth encontrado"
        else
            print_error "❌ Uso das rotas de auth não encontrado"
        fi
        
    else
        print_error "❌ server/app.js não encontrado"
    fi
    
    echo ""
}

# Gerar relatório com soluções
gerar_relatorio_solucoes() {
    print_header "📊 RELATÓRIO DE DIAGNÓSTICO E SOLUÇÕES"
    
    echo ""
    print_info "🔍 PROBLEMAS IDENTIFICADOS E SOLUÇÕES:"
    
    # Verificar se banco está acessível
    export PGPASSWORD="matchit123"
    if ! psql -h localhost -p 5432 -U matchit -d matchit_db -c "SELECT 1;" &>/dev/null; then
        echo ""
        print_error "🗄️ PROBLEMA: Banco de dados inacessível"
        print_info "SOLUÇÃO:"
        echo "  1. Verifique se PostgreSQL está rodando:"
        echo "     sudo systemctl status postgresql  # Linux"
        echo "     brew services list | grep postgres  # Mac"
        echo "  2. Verifique credenciais no .env"
        echo "  3. Crie banco se necessário:"
        echo "     createdb -h localhost -U postgres matchit_db"
    fi
    unset PGPASSWORD
    
    # Verificar se módulos têm problemas
    if ! node -e "import('./server/config/database.js')" &>/dev/null; then
        echo ""
        print_error "📦 PROBLEMA: Módulo database.js não carrega"
        print_info "SOLUÇÃO:"
        echo "  1. Verifique sintaxe: node --check server/config/database.js"
        echo "  2. Verifique dependências: npm install pg dotenv"
    fi
    
    echo ""
    print_header "🚀 PRÓXIMAS AÇÕES RECOMENDADAS:"
    echo "1. 🔧 Se banco estiver inacessível, configure PostgreSQL"
    echo "2. 📦 Se módulos não carregam, reinstale dependências"
    echo "3. 🧪 Teste novamente: ./scripts/teste-fase0-detalhado.sh"
    echo "4. 📋 Monitore logs do servidor para erros específicos"
    
    echo ""
    print_success "✅ DIAGNÓSTICO CONCLUÍDO!"
}

# Função principal
main() {
    print_header "🔍 DIAGNÓSTICO COMPLETO DO ERRO INTERNO"
    print_info "Identificando causa raiz do erro interno no sistema"
    echo ""
    
    verificar_env_vars
    verificar_dependencias
    testar_conexao_banco
    testar_imports_es
    analisar_app_js
    testar_endpoint_debug
    verificar_logs_servidor
    gerar_relatorio_solucoes
}

# Executar
main "$@"