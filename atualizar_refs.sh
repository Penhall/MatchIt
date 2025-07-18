#!/bin/bash

# Script para ajudar a atualizar referências após reestruturação

echo "🔄 Atualizando referências..."

# 1. Atualizar imports no frontend
echo "🖥️ Atualizando imports no frontend.User..."
find frontend.User/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '
  s|\.\./server|../backend/server|g;
  s|\.\./api|../backend/api|g;
  s|\.\./routes|../backend/routes|g;
  s|\.\./database|../backend/database|g;
' {} +

# 2. Atualizar imports no backend
echo "⚙️ Atualizando imports no backend..."
find backend -type f -name "*.js" -exec sed -i '
  s|\.\./src|../frontend.User/src|g;
  s|\.\./public|../frontend.User/public|g;
' {} +

# 3. Atualizar configurações do Docker
echo "🐳 Atualizando Dockerfiles..."
find infraestrutura -type f -name "Dockerfile*" -exec sed -i '
  s|COPY \. |COPY ../. |g;
  s|WORKDIR /app|WORKDIR /app/backend|g;
' {} +

# 4. Atualizar docker-compose
sed -i '
  s|context: \.|context: ./backend|g;
  s|dockerfile: Dockerfile|dockerfile: ../infraestrutura/Dockerfile.backend|g;
' infraestrutura/docker-compose.yml

echo "✅ Atualização de referências completa!"
echo "⚠️ Verifique cuidadosamente os arquivos modificados antes de commitar"
echo "💡 Dica: Use 'git diff' para revisar as alterações"
