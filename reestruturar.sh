#!/bin/bash

# Script para reestruturar o projeto MatchIt
set -e # Sai no primeiro erro

echo "🔧 Iniciando reestruturação do projeto..."

# 1. Criar estrutura de pastas
echo "📂 Criando estrutura de pastas..."
mkdir -p frontend.User frontend.Adm backend infraestrutura

# 2. Mover frontend existente (Vite)
echo "🚀 Movendo frontend.User..."
[ -d "src/" ] && mv src/ frontend.User/
[ -d "public/" ] && mv public/ frontend.User/
[ -f "vite.config.js" ] && mv vite.config* frontend.User/
[ -f "index.html" ] && mv index.html frontend.User/
[ -f "tsconfig.json" ] && mv tsconfig.json frontend.User/
[ -f "tailwind.config.js" ] && mv tailwind.config.js frontend.User/

# 3. Mover backend
echo "🛠️ Movendo backend..."
[ -d "server/" ] && mv server/ backend/
[ -d "api/" ] && mv api/ backend/
[ -d "routes/" ] && mv routes/ backend/
[ -d "database/" ] && mv database/ backend/
[ -d "services/" ] && mv services/ backend/
[ -d "models/" ] && mv models/ backend/
[ -d "config/" ] && mv config/ backend/
[ -d "types/" ] && mv types/ backend/
[ -d "utils/" ] && mv utils/ backend/

# 4. Mover infraestrutura
echo "🐳 Movendo infraestrutura..."
[ -f "Dockerfile.backend" ] && mv Dockerfile.backend infraestrutura/
[ -f "Dockerfile.dev" ] && mv Dockerfile.dev infraestrutura/
[ -f "Dockerfile.frontend" ] && mv Dockerfile.frontend infraestrutura/
[ -f "Dockerfile.frontend.dev" ] && mv Dockerfile.frontend.dev infraestrutura/
[ -f "docker-compose.yml" ] && mv docker-compose.yml infraestrutura/
[ -f "nginx.conf" ] && mv nginx.conf infraestrutura/
[ -f ".dockerignore" ] && mv .dockerignore infraestrutura/

# 5. Organizar arquivos restantes
echo "📝 Organizando arquivos restantes..."
# Configurações do frontend
[ -f "tsconfig.json" ] && mv tsconfig.json frontend.User/
[ -f "tsconfig.node.json" ] && mv tsconfig.node.json frontend.User/
[ -f "tsconfig.test.json" ] && mv tsconfig.test.json frontend.User/
[ -f "tailwind.config.js" ] && mv tailwind.config.js frontend.User/
[ -f "babel.config.js" ] && mv babel.config.js frontend.User/

# Configurações do backend
[ -f "jest.setup.js" ] && mv jest.setup.js backend/
[ -f "index.ts" ] && mv index.ts backend/

# Documentação
[ -f "README.md" ] && mv README.md docs/
[ -f "README1" ] && mv README1 docs/
[ -f "MIGRATION_GUIDE.md" ] && mv MIGRATION_GUIDE.md docs/
[ -f "DOCKER_SETUP_REPORT.md" ] && mv DOCKER_SETUP_REPORT.md docs/

# Arquivos específicos (analisar uso)
[ -f "register.json" ] && mv register.json backend/config/
[ -f "metadata.json" ] && mv metadata.json backend/config/

# Package auxiliar
[ -f "package1" ] && mv package1 backend/

echo "✅ Reestruturação completa!"
echo "⚠️ Atenção: Agora você precisa:"
echo "1. Verificar a nova estrutura com './verificar.sh'"
echo "2. Atualizar referências nos arquivos com './atualizar_refs.sh'"
