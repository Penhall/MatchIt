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

# 5. Manter arquivos raiz importantes
echo "📝 Mantendo arquivos raiz..."
[ -f "package.json" ] && git mv package.json backend/
[ -f "package-lock.json" ] && git mv package-lock.json backend/
[ -f ".env" ] && git mv .env backend/
[ -f ".env.local" ] && mv .env.local backend/
[ -f ".env.example" ] && git mv .env.example backend/
[ -f ".env.docker" ] && git mv .env.docker backend/

echo "✅ Reestruturação completa!"
echo "⚠️ Atenção: Agora você precisa:"
echo "1. Verificar a nova estrutura com './verificar.sh'"
echo "2. Atualizar referências nos arquivos com './atualizar_refs.sh'"
