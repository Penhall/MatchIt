#!/bin/bash
# Teste básico do sistema de torneios

echo "🧪 TESTE BÁSICO DO SISTEMA DE TORNEIOS"
echo "======================================"

API_BASE="http://localhost:3000/api"

echo "1. Testando categorias..."
curl -H "user-id: 1" "$API_BASE/tournament/categories" | jq '.'

echo -e "\n2. Iniciando torneio..."
curl -H "user-id: 1" -H "Content-Type: application/json" \
     -d '{"category":"cores"}' "$API_BASE/tournament/start" | jq '.'

echo -e "\n3. Verificando sessão ativa..."
curl -H "user-id: 1" "$API_BASE/tournament/active/cores" | jq '.'

echo -e "\n✅ Teste básico concluído!"
