# scripts/test/ready_commands.sh - Comandos prontos para copiar e colar
# Arquivo: scripts/test/ready_commands.sh

# =====================================================
# COMANDOS PRONTOS PARA USAR - COPIE E COLE
# =====================================================

# Token válido (o mesmo que funcionou)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxODIwMTE0Yy0zNDhhLTQ1NWQtOGZhNi1kZWNhZjFlZjYxZmIiLCJlbWFpbCI6ImZpbmFsdGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MDQ0NjMzMCwiZXhwIjoxNzUzMDM4MzMwfQ.5JjYitbMG4xJKJY4A8Kc3nqM4MCHFqPimY9W7wqEuL0"

# ID do usuário de teste
USER_ID="1820114c-348a-455d-8fa6-decaf1ef61fb"

# URL da API
API_URL="http://localhost:3001"

echo "======================================================"
echo "   COMANDOS PRONTOS PARA TESTAR - COPIE E COLE"
echo "======================================================"
echo ""

# 1. BUSCAR PERFIL (já funcionando)
echo "1. 🔍 BUSCAR PERFIL DO USUÁRIO:"
echo "curl -H \"Authorization: Bearer $TOKEN\" $API_URL/api/profile/$USER_ID"
echo ""

# 2. BUSCAR PREFERÊNCIAS DE ESTILO
echo "2. 🎨 BUSCAR PREFERÊNCIAS DE ESTILO:"
echo "curl -H \"Authorization: Bearer $TOKEN\" $API_URL/api/profile/style-preferences"
echo ""

# 3. ATUALIZAR PERFIL
echo "3. ✏️  ATUALIZAR PERFIL:"
echo "curl -X PUT -H \"Authorization: Bearer $TOKEN\" \\"
echo "-H \"Content-Type: application/json\" \\"
echo "-d '{\"displayName\":\"Nome Atualizado\",\"city\":\"São Paulo\",\"age\":28,\"bio\":\"Bio teste\"}' \\"
echo "$API_URL/api/profile"
echo ""

# 4. ADICIONAR NOVA PREFERÊNCIA DE ESTILO
echo "4. 🆕 ADICIONAR PREFERÊNCIA DE ESTILO:"
echo "curl -X PUT -H \"Authorization: Bearer $TOKEN\" \\"
echo "-H \"Content-Type: application/json\" \\"
echo "-d '{\"category\":\"Clothing\",\"questionId\":\"clothing_style_1\",\"selectedOption\":\"streetwear\"}' \\"
echo "$API_URL/api/profile/style-preferences"
echo ""

# 5. ADICIONAR PREFERÊNCIA DE CORES
echo "5. 🌈 ADICIONAR PREFERÊNCIA DE CORES:"
echo "curl -X PUT -H \"Authorization: Bearer $TOKEN\" \\"
echo "-H \"Content-Type: application/json\" \\"
echo "-d '{\"category\":\"Colors\",\"questionId\":\"color_preference_1\",\"selectedOption\":\"dark\"}' \\"
echo "$API_URL/api/profile/style-preferences"
echo ""

# 6. ADICIONAR HOBBY
echo "6. 🎯 ADICIONAR HOBBY:"
echo "curl -X PUT -H \"Authorization: Bearer $TOKEN\" \\"
echo "-H \"Content-Type: application/json\" \\"
echo "-d '{\"category\":\"Hobbies\",\"questionId\":\"hobby_1\",\"selectedOption\":\"music\"}' \\"
echo "$API_URL/api/profile/style-preferences"
echo ""

# 7. VERIFICAR TODAS AS PREFERÊNCIAS APÓS ADIÇÕES
echo "7. 📋 VERIFICAR TODAS AS PREFERÊNCIAS:"
echo "curl -H \"Authorization: Bearer $TOKEN\" $API_URL/api/profile/style-preferences"
echo ""

# 8. VERIFICAR PERFIL COMPLETO ATUALIZADO
echo "8. 📊 VERIFICAR PERFIL COMPLETO:"
echo "curl -H \"Authorization: Bearer $TOKEN\" $API_URL/api/profile/$USER_ID"
echo ""

echo "======================================================"
echo "   COMANDOS DE TESTE DE ERRO"
echo "======================================================"
echo ""

# 9. TESTAR SEM TOKEN (deve retornar 401)
echo "9. ❌ TESTE SEM TOKEN (deve retornar 401):"
echo "curl $API_URL/api/profile/style-preferences"
echo ""

# 10. TESTAR COM TOKEN INVÁLIDO (deve retornar 401)
echo "10. ❌ TESTE COM TOKEN INVÁLIDO (deve retornar 401):"
echo "curl -H \"Authorization: Bearer token_invalido\" $API_URL/api/profile/style-preferences"
echo ""

# 11. TESTAR USUÁRIO INEXISTENTE (deve retornar 404)
echo "11. ❌ TESTE USUÁRIO INEXISTENTE (deve retornar 404):"
echo "curl -H \"Authorization: Bearer $TOKEN\" $API_URL/api/profile/00000000-0000-0000-0000-000000000000"
echo ""

echo "======================================================"
echo "   COMANDOS ÚTEIS"
echo "======================================================"
echo ""

# 12. VERIFICAR SE SERVIDOR ESTÁ RODANDO
echo "12. 🔄 VERIFICAR SE SERVIDOR ESTÁ RODANDO:"
echo "curl -I $API_URL/"
echo ""

# 13. MONITORAR LOGS EM TEMPO REAL
echo "13. 📝 MONITORAR LOGS EM TEMPO REAL:"
echo "tail -f server.log"
echo "# ou"
echo "docker logs -f \$(docker ps -q --filter ancestor=matchit_backend)"
echo ""

# 14. REINICIAR SERVIDOR
echo "14. 🔄 REINICIAR SERVIDOR:"
echo "# Se usando npm:"
echo "cd server && npm run dev"
echo ""
echo "# Se usando docker:"
echo "docker-compose restart backend"
echo ""

echo "======================================================"
echo "   NOTAS IMPORTANTES"
echo "======================================================"
echo ""
echo "• O token expira em 30 dias (exp: 1753038330)"
echo "• Todos os comandos usam o usuário de teste: $USER_ID"
echo "• Para usar com outro usuário, substitua o USER_ID"
echo "• Para gerar novo token, faça login na aplicação"
echo ""

# Função para executar todos os testes automaticamente
echo "15. 🚀 EXECUTAR TODOS OS TESTES AUTOMATICAMENTE:"
echo "bash scripts/test/test_all_endpoints.sh"
echo ""