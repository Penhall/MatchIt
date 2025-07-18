#!/bin/bash

# Script para verificar a nova estrutura do projeto

echo "🔍 Verificando nova estrutura..."

check_dir() {
  if [ -d "$1" ]; then
    echo "✔️  $1 existe"
    return 0
  else
    echo "❌ $1 não encontrado"
    return 1
  fi
}

check_file() {
  if [ -f "$1" ]; then
    echo "✔️  $1 existe"
    return 0
  else
    echo "❌ $1 não encontrado"
    return 1
  fi
}

# Verificar pastas principais
echo "📂 Verificando pastas principais..."
check_dir "frontend.User"
check_dir "frontend.Adm"
check_dir "backend"
check_dir "infraestrutura"

# Verificar conteúdo do frontend.User
echo "🖥️ Verificando frontend.User..."
check_dir "frontend.User/src"
check_dir "frontend.User/public"
check_file "frontend.User/vite.config.js"
check_file "frontend.User/index.html"

# Verificar conteúdo do backend
echo "⚙️ Verificando backend..."
check_dir "backend/server"
check_dir "backend/api"
check_dir "backend/database"
check_dir "backend/services"
check_dir "backend/config"
check_dir "backend/types"
check_dir "backend/utils"
check_file "backend/package.json"

# Verificar conteúdo da infraestrutura
echo "🐳 Verificando infraestrutura..."
check_file "infraestrutura/Dockerfile.backend"
check_file "infraestrutura/docker-compose.yml"

echo "✅ Verificação completa!"
echo "⚠️ Se houver erros, corrija antes de prosseguir"
