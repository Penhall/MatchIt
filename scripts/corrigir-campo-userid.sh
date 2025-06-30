#!/bin/bash
# scripts/corrigir-campo-userid.sh - Correção final do campo userId/id

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 CORREÇÃO FINAL: CAMPO USERID/ID${NC}"
echo ""
echo -e "${YELLOW}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   • Geração do token: usa campo 'id' ✅"
echo -e "   • Middleware: procura campo 'userId' ❌"
echo -e "   • Inconsistência entre geração e validação"
echo ""
echo -e "${YELLOW}🛠️ SOLUÇÃO:${NC}"
echo -e "   • Ajustar middleware para aceitar 'id' ou 'userId'"
echo -e "   • Manter compatibilidade com ambos os formatos"
echo ""

echo -e "${BLUE}▶ ETAPA 1: Backup do middleware atual${NC}"
cp server/middleware/auth.js server/middleware/auth.js.backup.userid.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup criado${NC}"

echo -e "${BLUE}▶ ETAPA 2: Corrigir middleware para aceitar 'id' e 'userId'${NC}"

cat > server/middleware/auth.js << 'EOF'
// server/middleware/auth.js - Middleware corrigido para aceitar id/userId
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'matchit-secret-development-2025';

/**
 * Middleware de autenticação corrigido
 */
export const authenticateToken = async (req, res, next) => {
    try {
        // Extrair token do header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Token de acesso obrigatório',
                code: 'MISSING_TOKEN'
            });
        }
        
        // Verificar formato do token (Bearer <token>)
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Formato de token inválido. Use: Bearer <token>',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }
        
        const token = authHeader.substring(7).trim();
        
        // Para desenvolvimento, aceitar token "test-token"
        if (process.env.NODE_ENV === 'development' && token === 'test-token') {
            req.user = {
                id: 1,
                userId: 1,
                name: 'Usuário Teste',
                email: 'teste@matchit.com',
                isTestUser: true
            };
            return next();
        }
        
        // Verificar e decodificar JWT
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Falha na validação do token',
                    code: 'TOKEN_VALIDATION_FAILED'
                });
            }
        }
        
        // CORREÇÃO: Aceitar tanto 'id' quanto 'userId' no payload
        const userId = decoded.userId || decoded.id;
        
        if (!userId) {
            console.log('❌ Payload do token:', JSON.stringify(decoded));
            return res.status(401).json({
                success: false,
                error: 'Token inválido - nem userId nem id encontrado',
                code: 'MISSING_USER_IDENTIFIER'
            });
        }
        
        console.log('✅ Token validado, userId extraído:', userId);
        
        // Buscar usuário no banco de dados
        const userResult = await pool.query(
            'SELECT id, name, email, is_active FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = userResult.rows[0];
        
        // Verificar se usuário está ativo
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: 'Conta desativada',
                code: 'ACCOUNT_DISABLED'
            });
        }
        
        // Adicionar informações do usuário à requisição
        req.user = {
            id: user.id,
            userId: user.id, // Para compatibilidade
            name: user.name,
            email: user.email,
            isActive: user.is_active,
            tokenData: decoded
        };
        
        console.log('✅ Token validado para usuário:', user.email);
        next();
        
    } catch (error) {
        console.error('❌ Erro no middleware de autenticação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno de autenticação',
            code: 'AUTH_INTERNAL_ERROR'
        });
    }
};

/**
 * Middleware de autenticação opcional
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }
        
        await authenticateToken(req, res, next);
        
    } catch (error) {
        req.user = null;
        next();
    }
};

export default authenticateToken;
EOF

echo -e "${GREEN}✅ Middleware corrigido para aceitar 'id' e 'userId'${NC}"

echo -e "${BLUE}▶ ETAPA 3: Criar teste final de validação${NC}"

cat > scripts/test-final-completo.sh << 'EOF'
#!/bin/bash
# scripts/test-final-completo.sh - Teste final após correção

API_URL="http://localhost:3000/api"
TEST_EMAIL="final_validation_$(date +%s)@test.com"
TEST_PASSWORD="Test123456"
TEST_NAME="Validação Final"

echo "🧪 TESTE FINAL DE VALIDAÇÃO COMPLETA"
echo ""

# Função de extração corrigida
extract_token() {
    local response="$1"
    echo "$response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}

TOTAL_TESTS=0
PASSED_TESTS=0

test_endpoint() {
    local desc="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local token="$5"
    
    echo -n "🧪 $desc: "
    ((TOTAL_TESTS++))
    
    if [[ "$method" == "POST" ]]; then
        if [[ -n "$token" ]]; then
            status=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" "$url" 2>/dev/null)
        else
            status=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
                -H "Content-Type: application/json" \
                -d "$data" "$url" 2>/dev/null)
        fi
    else
        if [[ -n "$token" ]]; then
            status=$(curl -s -w "%{http_code}" -o /dev/null -X GET \
                -H "Authorization: Bearer $token" \
                "$url" 2>/dev/null)
        else
            status=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$url" 2>/dev/null)
        fi
    fi
    
    if [[ "$status" -ge 200 && "$status" -lt 300 ]]; then
        echo "✅ HTTP $status"
        ((PASSED_TESTS++))
        return 0
    else
        echo "❌ HTTP $status"
        return 1
    fi
}

# 1. Testes básicos
test_endpoint "Health Check" "$API_URL/health" "GET"
test_endpoint "Info API" "$API_URL/info" "GET"

# 2. Autenticação
echo ""
echo "🔐 AUTENTICAÇÃO:"

REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'","name":"'$TEST_NAME'"}'

echo -n "🧪 Registro: "
((TOTAL_TESTS++))
REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$API_URL/auth/register")

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo "✅ HTTP 201"
    ((PASSED_TESTS++))
    TOKEN=$(extract_token "$REGISTER_RESPONSE")
elif echo "$REGISTER_RESPONSE" | grep -q "já existe"; then
    echo "⚠️ Usuário existe, fazendo login..."
    LOGIN_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'"}'
    LOGIN_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA" \
        "$API_URL/auth/login")
    TOKEN=$(extract_token "$LOGIN_RESPONSE")
    if [[ -n "$TOKEN" ]]; then
        echo "✅ Login OK"
        ((PASSED_TESTS++))
    fi
else
    echo "❌ Falha"
fi

# 3. Endpoint /me (PRINCIPAL)
if [[ -n "$TOKEN" ]]; then
    test_endpoint "Endpoint /me" "$API_URL/auth/me" "GET" "" "$TOKEN"
    
    # 4. APIs de perfil
    echo ""
    echo "👤 PERFIL:"
    test_endpoint "Buscar perfil" "$API_URL/profile" "GET" "" "$TOKEN"
    test_endpoint "Buscar preferências" "$API_URL/profile/style-preferences" "GET" "" "$TOKEN"
else
    echo "❌ Sem token para testes autenticados"
    TOTAL_TESTS=$((TOTAL_TESTS + 3))
fi

# 5. APIs públicas
echo ""
echo "🏆 TORNEIOS:"
test_endpoint "Categorias" "$API_URL/tournament/categories" "GET"
test_endpoint "Imagens" "$API_URL/tournament/images" "GET"

# 6. Relatório final
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " 📊 RELATÓRIO FINAL DE VALIDAÇÃO"
echo "════════════════════════════════════════════════════════════════════"

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "📊 RESULTADOS:"
echo "   Sucessos: $PASSED_TESTS/$TOTAL_TESTS"
echo "   Taxa de sucesso: $PERCENTAGE%"
echo ""

if [[ $PERCENTAGE -ge 90 ]]; then
    echo "🎉 SISTEMA EXCELENTE!"
    echo "   MatchIt está funcionando perfeitamente!"
elif [[ $PERCENTAGE -ge 80 ]]; then
    echo "✅ SISTEMA MUITO BOM!"
    echo "   MatchIt está quase perfeito!"
elif [[ $PERCENTAGE -ge 70 ]]; then
    echo "⚠️ SISTEMA BOM"
    echo "   MatchIt funcional com pequenos ajustes"
else
    echo "❌ PRECISA MELHORAR"
    echo "   Mais correções necessárias"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════"
EOF

chmod +x scripts/test-final-completo.sh

echo -e "${GREEN}✅ Teste final completo criado${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ CORREÇÃO APLICADA!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Reiniciar o servidor:${NC}"
echo -e "   ${BLUE}Ctrl+C${NC} (parar servidor)"
echo -e "   ${BLUE}npm run server${NC}"
echo ""
echo -e "${YELLOW}2. Executar teste final:${NC}"
echo -e "   ${BLUE}./scripts/test-final-completo.sh${NC}"
echo ""

echo -e "${GREEN}🎯 CORREÇÃO APLICADA:${NC}"
echo -e "   • Middleware aceita tanto 'id' quanto 'userId'"
echo -e "   • Compatibilidade com formato atual do token"
echo -e "   • Logs melhorados para debug"
echo -e "   • Tratamento de erros aprimorado"
echo ""

echo -e "${YELLOW}💡 RESULTADO ESPERADO:${NC}"
echo -e "   ✅ Endpoint /me: HTTP 200"
echo -e "   ✅ Sistema de autenticação: 100% funcional"
echo -e "   ✅ Taxa de sucesso: 90%+"
echo ""

echo -e "${GREEN}🏆 REINICIE O SERVIDOR E EXECUTE O TESTE FINAL!${NC}"