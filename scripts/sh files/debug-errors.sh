#!/bin/bash
# debug-errors.sh - Diagnostica problemas de setError + API 400

echo "🔍 MatchIt - Diagnóstico de Erros"
echo "================================="
echo ""
echo "❌ Problema 1: setError is not defined"
echo "❌ Problema 2: HTTP 400 em /api/auth/register"
echo ""

# Problema 1: Procurar todas as ocorrências de setError
echo "🔍 1. PROCURANDO TODAS AS OCORRÊNCIAS DE setError:"
echo "------------------------------------------------"

if [ -f "screens/LoginScreen.tsx" ]; then
    echo "📄 Em LoginScreen.tsx:"
    grep -n "setError" screens/LoginScreen.tsx || echo "   ✅ Nenhuma ocorrência encontrada"
else
    echo "❌ LoginScreen.tsx não encontrado"
fi

echo ""
echo "📄 Em todos os arquivos .tsx:"
find . -name "*.tsx" -exec grep -l "setError" {} \; 2>/dev/null | while read file; do
    echo "   📁 $file:"
    grep -n "setError" "$file"
done

# Problema 2: Verificar logs do backend para o erro 400
echo ""
echo "🔍 2. VERIFICANDO LOGS DO BACKEND (últimas 20 linhas):"
echo "----------------------------------------------------"
docker-compose logs --tail=20 backend

echo ""
echo "🔍 3. TESTANDO API MANUALMENTE:"
echo "------------------------------"

# Testar se a API está acessível
echo "📡 Testando conectividade com backend..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend acessível"
    
    echo ""
    echo "📋 Testando endpoint de registro com dados válidos..."
    RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"123456","name":"Test User"}' \
        -o /tmp/register_response.json 2>/dev/null)
    
    echo "📊 Status HTTP: $RESPONSE"
    
    if [ -f /tmp/register_response.json ]; then
        echo "📋 Resposta do servidor:"
        cat /tmp/register_response.json
        echo ""
    fi
    
    rm -f /tmp/register_response.json
    
else
    echo "❌ Backend não acessível"
fi

echo ""
echo "🔍 4. VERIFICANDO ESTRUTURA DO BANCO DE DADOS:"
echo "--------------------------------------------"

# Verificar se as tabelas existem
echo "📊 Verificando tabelas no PostgreSQL..."
docker-compose exec -T postgres psql -U matchit -d matchit_db -c "\dt" 2>/dev/null || echo "❌ Erro ao acessar banco"

echo ""
echo "🔍 5. VERIFICANDO PAYLOAD DA REQUISIÇÃO:"
echo "---------------------------------------"

echo "💡 Para debugar, abra o Developer Tools do navegador:"
echo "   1. F12 -> Network tab"
echo "   2. Tente cadastrar novamente"
echo "   3. Clique na requisição /api/auth/register"
echo "   4. Veja o payload enviado e resposta recebida"

echo ""
echo "🎯 POSSÍVEIS CAUSAS E SOLUÇÕES:"
echo "==============================="

echo ""
echo "🔴 Problema 1 - setError:"
echo "  Causa: Frontend ainda tem código antigo em cache"
echo "  Solução: docker-compose build --no-cache frontend"

echo ""
echo "🔴 Problema 2 - HTTP 400:"
echo "  Possíveis causas:"
echo "    - Campos obrigatórios faltando (email, password, name)"
echo "    - Formato de email inválido"
echo "    - Senha muito curta"
echo "    - Tabelas do banco não existem"
echo "    - Problema no server.js"

echo ""
echo "🛠️ PRÓXIMOS PASSOS RECOMENDADOS:"
echo "1. docker-compose build --no-cache frontend"
echo "2. docker-compose restart"
echo "3. Verificar logs: docker-compose logs backend"
echo "4. Testar com dados simples: test@test.com / 123456 / Test"