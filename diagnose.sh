#!/bin/bash
# diagnose.sh - Diagnóstico MatchIt (SÓ ANALISA, NÃO MODIFICA NADA)

echo "🔍 MatchIt - Diagnóstico Completo"
echo "================================="

echo ""
echo "📁 1. VERIFICANDO ARQUIVOS NO DIRETÓRIO ATUAL:"
echo "----------------------------------------------"
ls -la | grep -E "\.(js|sh|txt|yml|json|env)$" || echo "Nenhum arquivo relevante encontrado"

echo ""
echo "🐳 2. VERIFICANDO DOCKERFILE.BACKEND ATUAL:"
echo "-------------------------------------------"
if [ -f "Dockerfile.backend" ]; then
    echo "✅ Dockerfile.backend existe"
    echo ""
    echo "🔍 Comando CMD atual no Dockerfile:"
    grep -A2 -B2 "CMD" Dockerfile.backend || echo "❌ CMD não encontrado"
    
    echo ""
    echo "🔍 ENTRYPOINT atual no Dockerfile:"
    grep -A2 -B2 "ENTRYPOINT" Dockerfile.backend || echo "ℹ️ ENTRYPOINT não encontrado"
    
    echo ""
    echo "🔍 Últimas 10 linhas do Dockerfile:"
    tail -10 Dockerfile.backend
else
    echo "❌ Dockerfile.backend NÃO EXISTE!"
fi

echo ""
echo "📄 3. VERIFICANDO SERVER.JS:"
echo "----------------------------"
if [ -f "server.js" ]; then
    echo "✅ server.js existe"
    echo "📊 Tamanho: $(wc -l server.js | cut -d' ' -f1) linhas"
    
    echo ""
    echo "🔍 Primeiras 5 linhas (imports):"
    head -5 server.js
    
    echo ""
    echo "🔍 Exports encontrados:"
    grep -n "export" server.js || echo "❌ Nenhum export encontrado"
    
    echo ""
    echo "🔍 Últimas 5 linhas:"
    tail -5 server.js
    
    echo ""
    echo "✅ Verificando sintaxe JavaScript:"
    if node -c server.js 2>/dev/null; then
        echo "✅ Sintaxe OK"
    else
        echo "❌ ERRO DE SINTAXE!"
        node -c server.js
    fi
else
    echo "❌ server.js NÃO EXISTE!"
fi

echo ""
echo "📋 4. VERIFICANDO ARQUIVOS SUSPEITOS:"
echo "------------------------------------"

# Verificar entrypoint.sh
if [ -f "entrypoint.sh" ]; then
    echo "⚠️ entrypoint.sh EXISTE"
    echo "🔍 Conteúdo:"
    cat entrypoint.sh
else
    echo "ℹ️ entrypoint.sh não existe"
fi

echo ""
# Verificar requirements.txt
if [ -f "requirements.txt" ]; then
    echo "⚠️ requirements.txt EXISTE (usado para Python)"
    echo "🔍 Conteúdo:"
    cat requirements.txt
else
    echo "ℹ️ requirements.txt não existe"
fi

echo ""
# Verificar start.sh
if [ -f "start.sh" ]; then
    echo "⚠️ start.sh EXISTE"
    echo "🔍 Conteúdo:"
    cat start.sh
else
    echo "ℹ️ start.sh não existe"
fi

echo ""
echo "🐳 5. VERIFICANDO CONTAINERS ATUAIS:"
echo "-----------------------------------"
echo "📊 Status dos containers:"
docker-compose ps 2>/dev/null || echo "❌ Docker Compose não funcionando"

echo ""
echo "📋 Últimos logs do backend (se disponível):"
docker-compose logs --tail=5 backend 2>/dev/null || echo "❌ Logs não disponíveis"

echo ""
echo "🔍 6. VERIFICANDO DOCKER-COMPOSE.YML:"
echo "------------------------------------"
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml existe"
    echo ""
    echo "🔍 Seção do backend:"
    sed -n '/backend:/,/^[[:space:]]*[^[:space:]]/p' docker-compose.yml | head -20
else
    echo "❌ docker-compose.yml NÃO EXISTE!"
fi

echo ""
echo "📦 7. VERIFICANDO PACKAGE.JSON:"
echo "------------------------------"
if [ -f "package.json" ]; then
    echo "✅ package.json existe"
    echo ""
    echo "🔍 Scripts definidos:"
    grep -A10 '"scripts"' package.json || echo "❌ Scripts não encontrados"
    
    echo ""
    echo "🔍 Tipo de módulo:"
    grep '"type"' package.json || echo "ℹ️ Tipo não especificado (default: CommonJS)"
else
    echo "❌ package.json NÃO EXISTE!"
fi

echo ""
echo "🎯 8. DIAGNÓSTICO - POSSÍVEIS CAUSAS:"
echo "======================================"

# Analisar possíveis causas
if [ -f "Dockerfile.backend" ]; then
    CMD_LINE=$(grep "CMD" Dockerfile.backend)
    if [[ $CMD_LINE == *"start.sh"* ]]; then
        echo "🔴 PROBLEMA IDENTIFICADO: Dockerfile está chamando start.sh"
        echo "   Linha problemática: $CMD_LINE"
        echo "   🛠️ Solução: Mudar para CMD [\"node\", \"server.js\"]"
    elif [[ $CMD_LINE == *"entrypoint.sh"* ]]; then
        echo "🔴 PROBLEMA IDENTIFICADO: Dockerfile está chamando entrypoint.sh"
        echo "   Linha problemática: $CMD_LINE"
        echo "   🛠️ Solução: Mudar para CMD [\"node\", \"server.js\"]"
    else
        echo "🟡 CMD parece OK: $CMD_LINE"
    fi
fi

# Verificar exports duplicados
if [ -f "server.js" ]; then
    EXPORT_COUNT=$(grep -c "^export" server.js)
    if [ "$EXPORT_COUNT" -gt 1 ]; then
        echo "🔴 PROBLEMA: $EXPORT_COUNT exports encontrados (deveria ter apenas 1)"
        echo "   Exports encontrados:"
        grep -n "^export" server.js
    fi
fi

echo ""
echo "✅ DIAGNÓSTICO COMPLETO!"
echo "========================"
echo ""
echo "🔍 Com base neste diagnóstico, podemos identificar exatamente o que precisa ser corrigido."
echo "💡 Execute este script primeiro e depois analisaremos os resultados juntos."