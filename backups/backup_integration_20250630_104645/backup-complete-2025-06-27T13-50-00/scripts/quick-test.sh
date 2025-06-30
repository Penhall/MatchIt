#!/bin/bash
# scripts/quick-test.sh - Teste rápido do sistema

echo "🧪 Testando sistema MatchIt..."

# Teste 1: Conexão com banco
echo -n "Teste de banco de dados: "
if PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALHOU"
fi

# Teste 2: Arquivos críticos
echo -n "Middleware de auth: "
if [ -f "server/middleware/authMiddleware.js" ]; then
    echo "✅ OK"
else
    echo "❌ FALTANDO"
fi

# Teste 3: Dependências
echo -n "Dependências npm: "
if npm list jsonwebtoken > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALTANDO"
fi

# Teste 4: Estrutura de diretórios
echo -n "Diretórios de upload: "
if [ -d "uploads/tournament-images" ]; then
    echo "✅ OK"
else
    echo "❌ FALTANDO"
fi

echo "🎉 Teste rápido concluído!"
