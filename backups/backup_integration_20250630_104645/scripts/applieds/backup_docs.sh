#!/bin/bash

# Define o diretório de origem e o de arquivo
SOURCE_DIR="docs"
ARCHIVE_DIR="$SOURCE_DIR/archive"
BACKUP_DIR="$ARCHIVE_DIR/backup_$(date +%Y%m%d)"

# Cria o diretório de backup se ele não existir
mkdir -p "$BACKUP_DIR"

# Move todos os arquivos .md do diretório de origem para o de backup
# Usamos 'find' para pegar apenas os arquivos no diretório raiz de 'docs' e não nos subdiretórios.
find "$SOURCE_DIR" -maxdepth 1 -type f -name "*.md" -exec mv {} "$BACKUP_DIR/" \;

echo "Backup da documentação concluído em: $BACKUP_DIR"
