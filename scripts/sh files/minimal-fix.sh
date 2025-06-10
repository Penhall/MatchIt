#!/bin/bash
# minimal-fix.sh - Aplica APENAS as 2 correções identificadas no diagnóstico

echo "🔧 MatchIt - Correção Mínima"
echo "============================"
echo ""
echo "⚠️ Este script vai aplicar APENAS as 2 correções identificadas:"
echo "   1. Mudar CMD no Dockerfile.backend"
echo "   2. Remover export duplicado do server.js"
echo ""
read -p "Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

echo "🔄 Aplicando correções..."

# 1. Backup dos arquivos
echo "📁 Criando backups..."
cp Dockerfile.backend Dockerfile.backend.backup.$(date +%Y%m%d_%H%M%S)
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# 2. Correção 1: Dockerfile.backend
echo "🛠️ Correção 1: Dockerfile.backend..."
sed -i 's|CMD \["/app/start.sh"\]|CMD ["node", "server.js"]|' Dockerfile.backend

# Verificar se a correção funcionou
if grep -q 'CMD \["node", "server.js"\]' Dockerfile.backend; then
    echo "✅ Dockerfile.backend corrigido com sucesso"
else
    echo "❌ Erro ao corrigir Dockerfile.backend"
    exit 1
fi

# 3. Correção 2: server.js (remover linha 315)
echo "🛠️ Correção 2: server.js (removendo export duplicado)..."

# Verificar se a linha 315 realmente contém o export problemático
LINE_315=$(sed -n '315p' server.js)
if [[ $LINE_315 == *"export { app, pool, authenticateToken }"* ]]; then
    # Remover a linha 315
    sed -i '315d' server.js
    echo "✅ Export duplicado removido da linha 315"
else
    echo "⚠️ Linha 315 não contém o export esperado:"
    echo "   Conteúdo: $LINE_315"
    echo "💡 Verificando todas as linhas com export duplicado..."
    
    # Procurar e remover qualquer linha com este export específico
    sed -i '/^export { app, pool, authenticateToken };$/d' server.js
    echo "✅ Export duplicado removido (busca por padrão)"
fi

# 4. Verificar resultado final
echo ""
echo "🔍 Verificando correções aplicadas..."

echo "📋 Dockerfile.backend - últimas linhas:"
tail -3 Dockerfile.backend

echo ""
echo "📋 server.js - exports restantes:"
grep -n "export" server.js

# Verificar sintaxe do server.js
echo ""
echo "✅ Verificando sintaxe do server.js..."
if node -c server.js 2>/dev/null; then
    echo "✅ Sintaxe OK"
else
    echo "❌ ERRO DE SINTAXE!"
    echo "🔄 Restaurando backup..."
    cp server.js.backup.$(date +%Y%m%d_%H%M%S) server.js
    exit 1
fi

echo ""
echo "✅ CORREÇÕES APLICADAS COM SUCESSO!"
echo "=================================="
echo ""
echo "🚀 Próximos passos:"
echo "   1. docker-compose down"
echo "   2. docker-compose build --no-cache backend"
echo "   3. docker-compose up -d"
echo "   4. docker-compose logs backend"
echo ""
echo "📁 Backups criados:"
ls -la *.backup.* 2>/dev/null || echo "   (nenhum backup adicional criado)"