#!/bin/bash
# Cleanup script for MatchIt migrations
# Generated at: 2025-06-25T03:31:48.071Z

set -e

echo "🗑️ Limpeza de Arquivos de Migração MatchIt"
echo "=========================================="

# Backup antes da limpeza
BACKUP_DIR="backup_migrations_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Criando backup em: $BACKUP_DIR"

# Arquivos duplicados
echo "🔄 Removendo duplicatas..."


# Arquivos obsoletos
echo "👻 Removendo arquivos obsoletos..."


echo "✅ Limpeza concluída!"
echo "📦 Backup disponível em: $BACKUP_DIR"
echo ""
echo "Para restaurar arquivos se necessário:"
echo "  cp $BACKUP_DIR/* [pasta_destino]/"
