#!/bin/bash

# Esperar o PostgreSQL estar pronto
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up - executing migrations"

# Executar migrações
python /app/scripts/run_all_migrations.py

# Iniciar a aplicação Node.js
exec "$@"
