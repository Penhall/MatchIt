#!/bin/bash
# scripts/corrigir-jwt-malformed.sh - Correção específica do problema JWT malformed

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 CORREÇÃO: JWT MALFORMED${NC}"
echo ""
echo -e "${YELLOW}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   • Registro funcionando ✅"
echo -e "   • Token sendo gerado ✅"
echo -e "   • JWT_SECRET consistente ✅"
echo -e "   • Erro no /me: 'jwt malformed' ❌"
echo ""
echo -e "${YELLOW}🛠️ CAUSA PROVÁVEL:${NC}"
echo -e "   • Extração incorreta do header Authorization"
echo -e "   • Token com caracteres extras ou truncado"
echo -e "   • Problema na validação do formato Bearer"
echo ""

echo -e "${BLUE}▶ ETAPA 1: Backup do middleware atual${NC}"
cp server/middleware/auth.js server/middleware/auth.js.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup criado${NC}"

echo -e "${BLUE}▶ ETAPA 2: Criando middleware com debug melhorado${NC}"

cat > server/middleware/auth.js << 'EOF'
// server/middleware/auth.js - Middleware com debug melhorado para JWT malformed
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'matchit-secret-development-2025';

/**
 * Middleware de autenticação com debug melhorado
 */
export const authenticateToken = async (req, res, next) => {
    try {
        console.log('🔍 [AUTH DEBUG] Iniciando validação de token...');
        
        // Extrair token do header Authorization
        const authHeader = req.headers.authorization;
        console.log('🔍 [AUTH DEBUG] Header Authorization:', authHeader ? `"${authHeader}"` : 'undefined');
        
        if (!authHeader) {
            console.log('❌ [AUTH DEBUG] Header Authorization não encontrado');
            return res.status(401).json({
                success: false,
                error: 'Token de acesso obrigatório',
                code: 'MISSING_TOKEN'
            });
        }
        
        // Verificar formato do token (Bearer <token>)
        if (!authHeader.startsWith('Bearer ')) {
            console.log('❌ [AUTH DEBUG] Formato inválido, header:', authHeader);
            return res.status(401).json({
                success: false,
                error: 'Formato de token inválido. Use: Bearer <token>',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }
        
        // Extrair token removendo "Bearer "
        const token = authHeader.substring(7).trim(); // Trim para remover espaços extras
        console.log('🔍 [AUTH DEBUG] Token extraído:', `"${token}"`);
        console.log('🔍 [AUTH DEBUG] Token length:', token.length);
        console.log('🔍 [AUTH DEBUG] Token início:', token.substring(0, 20) + '...');
        console.log('🔍 [AUTH DEBUG] Token fim:', '...' + token.substring(token.length - 20));
        
        // Verificar se token não está vazio
        if (!token || token === 'undefined' || token === 'null') {
            console.log('❌ [AUTH DEBUG] Token vazio ou inválido');
            return res.status(401).json({
                success: false,
                error: 'Token vazio',
                code: 'EMPTY_TOKEN'
            });
        }
        
        // Para desenvolvimento, aceitar token "test-token"
        if (process.env.NODE_ENV === 'development' && token === 'test-token') {
            console.log('✅ [AUTH DEBUG] Token de desenvolvimento aceito');
            req.user = {
                id: 1,
                userId: 1,
                name: 'Usuário Teste',
                email: 'teste@matchit.com',
                isTestUser: true
            };
            return next();
        }
        
        // Verificar se o token tem formato JWT básico (3 partes separadas por ponto)
        const tokenParts = token.split('.');
        console.log('🔍 [AUTH DEBUG] Partes do token:', tokenParts.length);
        
        if (tokenParts.length !== 3) {
            console.log('❌ [AUTH DEBUG] Token não tem 3 partes. Partes encontradas:', tokenParts.length);
            console.log('🔍 [AUTH DEBUG] Partes:', tokenParts.map((part, i) => `${i}: ${part.substring(0, 10)}...`));
            return res.status(401).json({
                success: false,
                error: 'Token JWT malformado - partes incorretas',
                code: 'MALFORMED_TOKEN_PARTS'
            });
        }
        
        // Verificar JWT_SECRET
        console.log('🔍 [AUTH DEBUG] JWT_SECRET:', JWT_SECRET);
        
        // Verificar e decodificar JWT
        let decoded;
        try {
            console.log('🔍 [AUTH DEBUG] Tentando verificar JWT...');
            decoded = jwt.verify(token, JWT_SECRET);
            console.log('✅ [AUTH DEBUG] JWT verificado com sucesso');
            console.log('🔍 [AUTH DEBUG] Payload decodificado:', JSON.stringify(decoded, null, 2));
        } catch (jwtError) {
            console.error('❌ [AUTH DEBUG] Erro JWT detalhado:', {
                name: jwtError.name,
                message: jwtError.message,
                stack: jwtError.stack
            });
            
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido: ' + jwtError.message,
                    code: 'INVALID_TOKEN'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Falha na validação do token: ' + jwtError.message,
                    code: 'TOKEN_VALIDATION_FAILED'
                });
            }
        }
        
        // Verificar se temos userId no payload
        if (!decoded.userId) {
            console.log('❌ [AUTH DEBUG] userId não encontrado no payload');
            return res.status(401).json({
                success: false,
                error: 'Token inválido - userId ausente',
                code: 'MISSING_USERID'
            });
        }
        
        console.log('🔍 [AUTH DEBUG] userId do token:', decoded.userId);
        
        // Buscar usuário no banco de dados
        console.log('🔍 [AUTH DEBUG] Buscando usuário no banco...');
        const userResult = await pool.query(
            'SELECT id, name, email, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        if (userResult.rows.length === 0) {
            console.log('❌ [AUTH DEBUG] Usuário não encontrado no banco');
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = userResult.rows[0];
        console.log('✅ [AUTH DEBUG] Usuário encontrado:', user.email);
        
        // Verificar se usuário está ativo
        if (!user.is_active) {
            console.log('❌ [AUTH DEBUG] Usuário inativo');
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
        
        console.log('✅ [AUTH DEBUG] Token validado com sucesso para:', user.email);
        next();
        
    } catch (error) {
        console.error('❌ [AUTH DEBUG] Erro geral no middleware:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno de autenticação',
            code: 'AUTH_INTERNAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

echo -e "${GREEN}✅ Middleware com debug criado${NC}"

echo -e "${BLUE}▶ ETAPA 3: Criando script de teste específico para JWT${NC}"

cat > scripts/test-jwt-debug.sh << 'EOF'
#!/bin/bash
# scripts/test-jwt-debug.sh - Teste específico para debug do JWT

API_URL="http://localhost:3000/api"
TEST_EMAIL="jwt_debug_$(date +%s)@test.com"
TEST_PASSWORD="Test123456"
TEST_NAME="JWT Debug Test"

echo "🔍 TESTE DEBUG JWT"
echo ""

# 1. Registrar usuário
echo "1. Registrando usuário..."
REGISTER_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'","name":"'$TEST_NAME'"}'

REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$API_URL/auth/register")

echo "Resposta do registro:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# 2. Extrair token
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [[ -n "$TOKEN" ]]; then
    echo "✅ Token extraído:"
    echo "   Token: $TOKEN"
    echo "   Length: ${#TOKEN}"
    echo "   Início: ${TOKEN:0:30}..."
    echo "   Fim: ...${TOKEN: -30}"
    echo ""
    
    # 3. Testar endpoint /me com debug
    echo "2. Testando /me com token..."
    echo "   Authorization header: 'Bearer $TOKEN'"
    echo ""
    
    ME_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/auth/me")
    
    echo "Resposta do /me:"
    echo "$ME_RESPONSE" | jq . 2>/dev/null || echo "$ME_RESPONSE"
    
else
    echo "❌ Token não encontrado na resposta"
    
    # Tentar login
    echo ""
    echo "Tentando login..."
    LOGIN_DATA='{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'"}'
    
    LOGIN_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA" \
        "$API_URL/auth/login")
    
    echo "Resposta do login:"
    echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [[ -n "$TOKEN" ]]; then
        echo ""
        echo "✅ Token do login:"
        echo "   Token: $TOKEN"
        echo ""
        
        ME_RESPONSE=$(curl -s -X GET \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL/auth/me")
        
        echo "Resposta do /me:"
        echo "$ME_RESPONSE" | jq . 2>/dev/null || echo "$ME_RESPONSE"
    fi
fi
EOF

chmod +x scripts/test-jwt-debug.sh

echo -e "${GREEN}✅ Script de debug JWT criado${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ DEBUG JWT PREPARADO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Reiniciar o servidor para ativar debug:${NC}"
echo -e "   ${BLUE}Ctrl+C${NC} (parar servidor)"
echo -e "   ${BLUE}npm run server${NC}"
echo ""
echo -e "${YELLOW}2. Executar teste de debug:${NC}"
echo -e "   ${BLUE}./scripts/test-jwt-debug.sh${NC}"
echo ""
echo -e "${YELLOW}3. Analisar logs detalhados no console do servidor${NC}"
echo ""

echo -e "${GREEN}🎯 O QUE O DEBUG VAI MOSTRAR:${NC}"
echo -e "   • Como o token está sendo extraído"
echo -e "   • Se o token tem 3 partes (JWT válido)"
echo -e "   • Qual erro específico está ocorrendo"
echo -e "   • Payload decodificado do JWT"
echo ""

echo -e "${YELLOW}⚡ Reinicie o servidor e execute o debug!${NC}"