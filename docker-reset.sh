#!/bin/bash
# docker-reset.sh - Reset completo do ambiente

echo "⚠️  ATENÇÃO: Isso irá remover TODOS os dados!"
read -p "Continuar? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Parando e removendo containers..."
    docker compose down -v
    
    echo "🗑️  Removendo imagens..."
    docker image prune -a -f
    
    echo "💽 Removendo volumes..."
    docker volume prune -f
    
    echo "✅ Reset completo realizado!"
else
    echo "❌ Operação cancelada"
fi
