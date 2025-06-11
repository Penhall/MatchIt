#!/bin/bash

# scripts/migrate-to-modular.sh
# Script de migração automática para estrutura modular do MatchIt Backend

set -e  # Para se houver erro

echo "🚀 Iniciando migração para estrutura modular do MatchIt Backend..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar com cores
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    print_error "Execute este script na raiz do projeto MatchIt"
    exit 1
fi

print_info "Verificando pré-requisitos..."

# Verificar se server.js existe
if [ ! -f "server.js" ]; then
    print_error "Arquivo server.js não encontrado"
    exit 1
fi

print_status "Arquivo server.js encontrado"

# Criar backup se não existir
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp server.js "$BACKUP_DIR/server.js.backup"
    print_status "Backup criado em $BACKUP_DIR/"
fi

# Parar servidor se estiver rodando
print_info "Parando servidor se estiver rodando..."
pkill -f "node.*server" 2>/dev/null || true
sleep 2

# Criar estrutura de diretórios
print_info "Criando estrutura de diretórios..."
mkdir -p server/{config,middleware,routes,services,utils}
print_status "Estrutura de diretórios criada"

# Função para criar arquivo se não existir
create_file_if_not_exists() {
    local file_path="$1"
    local content="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "$content" > "$file_path"
        print_status "Criado: $file_path"
    else
        print_warning "Já existe: $file_path"
    fi
}

# Verificar se todos os artefatos foram criados
print_info "Verificando se todos os arquivos da estrutura modular estão prontos..."

# Lista de arquivos necessários
declare -a REQUIRED_FILES=(
    "server/config/database.js"
    "server/config/cors.js"
    "server/config/environment.js"
    "server/middleware/auth.js"
    "server/middleware/configure.js"
    "server/middleware/errorHandler.js"
    "server/middleware/logger.js"
    "server/middleware/validation.js"
    "server/middleware/index.js"
    "server/services/authService.js"
    "server/services/profileService.js"
    "server/services/productService.js"
    "server/services/subscriptionService.js"
    "server/services/statsService.js"
    "server/services/chatService.js"
    "server/services/recommendationService.js"
    "server/services/matchService.js"
    "server/routes/health.js"
    "server/routes/auth.js"
    "server/routes/profile.js"
    "server/routes/matches.js"
    "server/routes/products.js"
    "server/routes/chat.js"
    "server/routes/subscription.js"
    "server/routes/stats.js"
    "server/routes/recommendations.js"
    "server/routes/index.js"
    "server/utils/constants.js"
    "server/utils/helpers.js"
    "server/app.js"
)

missing_files=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    print_error "Os seguintes arquivos estão faltando:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    print_warning "Por favor, crie todos os arquivos usando os artefatos fornecidos antes de continuar"
    exit 1
fi

print_status "Todos os arquivos da estrutura modular estão presentes"

# Atualizar package.json se necessário
print_info "Verificando package.json..."
if grep -q '"main": "server.js"' package.json; then
    sed -i.bak 's/"main": "server.js"/"main": "server\/app.js"/' package.json
    print_status "package.json atualizado"
fi

# Adicionar scripts se não existirem
if ! grep -q '"server": "node server/app.js"' package.json; then
    print_warning "Considere atualizar os scripts no package.json:"
    echo '  "start": "node server/app.js",'
    echo '  "server": "node server/app.js",'
    echo '  "dev": "nodemon server/app.js"'
fi

# Renomear server.js original
if [ -f "server.js" ]; then
    mv server.js "$BACKUP_DIR/server.js.original"
    print_status "server.js original movido para backup"
fi

# Testar a nova estrutura
print_info "Iniciando testes da nova estrutura..."

# Verificar sintaxe dos arquivos principais
print_info "Verificando sintaxe dos arquivos..."
if node -c server/app.js 2>/dev/null; then
    print_status "Sintaxe do server/app.js válida"
else
    print_error "Erro de sintaxe em server/app.js"
    exit 1
fi

# Tentar iniciar o servidor em modo de teste
print_info "Testando inicialização do servidor..."
timeout 10s node server/app.js &
SERVER_PID=$!
sleep 5

# Verificar se o servidor está rodando
if ps -p $SERVER_PID > /dev/null; then
    print_status "Servidor iniciado com sucesso"
    
    # Testar health check se o servidor estiver respondendo
    if curl -f http://localhost:3000/api/health -s > /dev/null 2>&1; then
        print_status "Health check funcionando"
    else
        print_warning "Health check não respondeu (pode ser normal se banco não estiver disponível)"
    fi
    
    # Parar servidor de teste
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
else
    print_error "Falha ao iniciar servidor - verifique os logs"
    exit 1
fi

# Verificar Dockerfile.backend
print_info "Verificando Dockerfile.backend..."
if [ -f "Dockerfile.backend" ]; then
    if grep -q "CMD.*server/app.js" Dockerfile.backend; then
        print_status "Dockerfile.backend já está atualizado"
    else
        print_warning "Considere atualizar CMD no Dockerfile.backend para: CMD [\"node\", \"server/app.js\"]"
    fi
else
    print_warning "Dockerfile.backend não encontrado"
fi

# Verificar docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    print_status "docker-compose.yml encontrado"
else
    print_warning "docker-compose.yml não encontrado"
fi

# Resumo final
echo ""
echo "=============================================="
print_status "MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=============================================="
echo ""

print_info "Estrutura criada:"
echo "  📁 server/config/     - Configurações"
echo "  📁 server/middleware/ - Middleware"
echo "  📁 server/routes/     - Rotas da API"
echo "  📁 server/services/   - Lógica de negócio"
echo "  📁 server/utils/      - Utilitários"
echo "  📄 server/app.js      - Entry point"
echo ""

print_info "Para iniciar o servidor:"
echo "  npm run server"
echo "  # ou"
echo "  node server/app.js"
echo ""

print_info "Para desenvolvimento:"
echo "  npm run dev"
echo ""

print_info "Para Docker:"
echo "  docker-compose up --build"
echo ""

print_info "Endpoints para testar:"
echo "  http://localhost:3000/api/health"
echo "  http://localhost:3000/api/info"
echo "  http://localhost:3000/api/auth/register"
echo ""

print_warning "Lembre-se de:"
echo "  1. Testar todas as funcionalidades"
echo "  2. Verificar variáveis de ambiente"
echo "  3. Confirmar conexão com banco de dados"
echo "  4. Revisar logs para possíveis erros"
echo ""

print_status "Backup do código original em: $BACKUP_DIR/"
echo ""

echo "🎉 Estrutura modular implementada com sucesso!"
echo "💡 Consulte o guia de implementação para próximos passos"