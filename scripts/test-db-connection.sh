#!/bin/bash
# scripts/test-db-connection.sh - Teste rápido de conexão

# Carregar .env
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Exportar credenciais do PostgreSQL
export PGHOST="$DB_HOST"
export PGPORT="$DB_PORT"
export PGDATABASE="$DB_NAME"  
export PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD"

echo "🔍 Testando conexão com:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Testar conexão
if psql -c "SELECT version();" 2>/dev/null; then
    echo "✅ Conexão estabelecida com sucesso!"
    
    # Verificar tabelas
    table_count=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo "📊 Tabelas encontradas: $table_count"
    
    if [ "$table_count" -gt 0 ]; then
        echo "📋 Tabelas existentes:"
        psql -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" | sed 's/^/   /'
    fi
else
    echo "❌ Falha na conexão!"
    echo ""
    echo "🔧 Verifique:"
    echo "   1. PostgreSQL está rodando?"
    echo "   2. Banco '$DB_NAME' existe?"
    echo "   3. Usuário '$DB_USER' tem permissões?"
    echo "   4. Credenciais no .env estão corretas?"
fi
