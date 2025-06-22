#!/bin/bash
# scripts/fix/complete_final_fix.sh - Correção final dos problemas encontrados
# Arquivo: scripts/fix/complete_final_fix.sh

# =====================================================
# CORREÇÃO FINAL COMPLETA DOS PROBLEMAS
# =====================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxODIwMTE0Yy0zNDhhLTQ1NWQtOGZhNi1kZWNhZjFlZjYxZmIiLCJlbWFpbCI6ImZpbmFsdGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc1MDQ0NjMzMCwiZXhwIjoxNzUzMDM4MzMwfQ.5JjYitbMG4xJKJY4A8Kc3nqM4MCHFqPimY9W7wqEuL0"
USER_ID="1820114c-348a-455d-8fa6-decaf1ef61fb"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   MATCHIT - CORREÇÃO FINAL COMPLETA${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Função para backup de arquivos
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ Backup criado: ${file}.backup.$(date +%Y%m%d_%H%M%S)${NC}"
    fi
}

# Etapa 1: Backup dos arquivos que serão modificados
echo -e "${YELLOW}1. Criando backups dos arquivos...${NC}"
backup_file "server/routes/profile.js"
backup_file "server/middleware/auth.js"
echo ""

# Etapa 2: Atualizar middleware de autenticação
echo -e "${YELLOW}2. Atualizando middleware de autenticação...${NC}"
cat > "server/middleware/auth.js" << 'EOF'
// server/middleware/auth.js - Middleware de autenticação corrigido
import jwt from "jsonwebtoken";
import { config } from "../config/environment.js";

const authenticateToken = (req, res, next) => {
  console.log(`[Auth] ${req.method} ${req.path} - Verificando autenticação`);
  
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log(`[Auth] Token não fornecido para ${req.method} ${req.path}`);
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      console.log(`[Auth] Erro na verificação do token:`, err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    
    console.log(`[Auth] Token válido. Dados do usuário:`, user);
    
    // Normalizar dados do usuário (compatibilidade com diferentes estruturas)
    req.user = {
      id: user.id || user.userId,
      userId: user.userId || user.id,
      email: user.email,
      ...user
    };
    
    console.log(`[Auth] req.user definido:`, { id: req.user.id, userId: req.user.userId, email: req.user.email });
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = {
        id: user.id || user.userId,
        userId: user.userId || user.id,
        email: user.email,
        ...user
      };
    }
    next();
  });
};

export { authenticateToken, optionalAuth };
EOF

echo -e "${GREEN}✅ Middleware de autenticação atualizado${NC}"
echo ""

# Etapa 3: Corrigir rotas de perfil
echo -e "${YELLOW}3. Corrigindo rotas de perfil...${NC}"
cat > "server/routes/profile.js" << 'EOF'
// server/routes/profile.js - Rotas de perfil corrigidas
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ProfileService } from '../services/profileService.js';
import { logger } from '../utils/helpers.js';

const router = express.Router();
const profileService = new ProfileService();

const profileController = {
  getProfile: async (req, res) => {
    try {
      const userIdToFetch = req.params.userId || req.user?.id;
      if (!userIdToFetch) {
        return res.status(401).json({ message: 'Usuário não autenticado ou ID do perfil não especificado.' });
      }
      
      logger.info(`[ProfileRoutes] Buscando perfil para userId: ${userIdToFetch}`);
      const profile = await profileService.getProfileByUserId(userIdToFetch);

      if (!profile) {
        return res.status(404).json({ message: 'Perfil não encontrado.' });
      }
      
      res.json(profile);
    } catch (error) {
      logger.error(`[ProfileRoutes] Erro na rota getProfile: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar perfil.', error: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        logger.error(`[ProfileRoutes] Usuário não autenticado - req.user:`, req.user);
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      logger.info(`[ProfileRoutes] Atualizando perfil para userId: ${userId}`, req.body);
      const updatedProfile = await profileService.updateUserProfile(userId, req.body);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: 'Perfil não encontrado após tentativa de atualização.' });
      }
      res.json({ message: 'Perfil atualizado com sucesso.', data: updatedProfile });
    } catch (error) {
      logger.error(`[ProfileRoutes] Erro na rota updateProfile: ${error.message}`);
      res.status(500).json({ message: 'Erro ao atualizar perfil.', error: error.message });
    }
  },

  getStylePreferences: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        logger.error(`[ProfileRoutes] Usuário não autenticado em getStylePreferences - req.user:`, req.user);
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      logger.info(`[ProfileRoutes] Buscando preferências de estilo para userId: ${userId}`);
      const stylePreferences = await profileService.getStyleChoicesByUserId(userId);
      
      res.json(stylePreferences);
    } catch (error) {
      logger.error(`[ProfileRoutes] Erro ao buscar preferências de estilo: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar preferências de estilo.', error: error.message });
    }
  },

  updateStylePreference: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        logger.error(`[ProfileRoutes] Usuário não autenticado em updateStylePreference - req.user:`, req.user);
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      const { category, questionId, selectedOption } = req.body;
      if (!category || !questionId || selectedOption === undefined) {
        return res.status(400).json({ message: 'Dados incompletos: category, questionId e selectedOption são obrigatórios.' });
      }

      logger.info(`[ProfileRoutes] Atualizando preferência de estilo para userId: ${userId}`, { category, questionId, selectedOption });
      const updatedPreference = await profileService.updateStyleChoice(userId, { category, questionId, selectedOption });
      
      res.json({ message: 'Preferência de estilo atualizada com sucesso.', data: updatedPreference });
    } catch (error) {
      logger.error(`[ProfileRoutes] Erro ao atualizar preferência de estilo: ${error.message}`);
      res.status(500).json({ message: 'Erro ao atualizar preferência de estilo.', error: error.message });
    }
  }
};

// ORDEM CRÍTICA: Rotas específicas ANTES das rotas com parâmetros
router.get('/style-preferences', authenticateToken, profileController.getStylePreferences);
router.put('/style-preferences', authenticateToken, profileController.updateStylePreference);
router.put('/', authenticateToken, profileController.updateProfile);
router.get('/:userId?', authenticateToken, profileController.getProfile);

export default router;
EOF

echo -e "${GREEN}✅ Rotas de perfil corrigidas${NC}"
echo ""

# Etapa 4: Verificar se o servidor precisa ser reiniciado
echo -e "${YELLOW}4. Verificando status do servidor...${NC}"

if curl -s "$API_URL/" > /dev/null 2>&1 || curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor está rodando${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Reinicie o servidor para aplicar as correções${NC}"
    echo ""
    echo "Para reiniciar:"
    echo "• Se usando npm: Ctrl+C e depois 'npm run dev'"
    echo "• Se usando docker: 'docker-compose restart backend'"
    echo ""
    echo -e "${BLUE}Pressione ENTER quando tiver reiniciado o servidor...${NC}"
    read -r
else
    echo -e "${RED}❌ Servidor não está acessível${NC}"
    echo "Inicie o servidor antes de continuar"
    exit 1
fi

# Etapa 5: Testar correções
echo -e "${YELLOW}5. Testando correções...${NC}"

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=${5:-200}
    
    echo -e "${BLUE}Testando: ${description}${NC}"
    
    local response_file="/tmp/test_final.json"
    local curl_cmd="curl -s -w \"%{http_code}\" -X $method"
    curl_cmd="$curl_cmd -H \"Authorization: Bearer $TOKEN\""
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\""
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd \"$API_URL$endpoint\" -o \"$response_file\""
    
    local http_code=$(eval $curl_cmd 2>/dev/null)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Sucesso (HTTP $http_code)${NC}"
        if [ -f "$response_file" ] && [ -s "$response_file" ]; then
            echo -e "${BLUE}Resposta:${NC}"
            if command -v jq &> /dev/null; then
                cat "$response_file" | jq . 2>/dev/null || cat "$response_file"
            else
                cat "$response_file"
            fi
        fi
    else
        echo -e "${RED}❌ Falha (HTTP $http_code, esperado $expected_status)${NC}"
        if [ -f "$response_file" ] && [ -s "$response_file" ]; then
            echo -e "${RED}Erro:${NC}"
            cat "$response_file"
        fi
    fi
    
    echo ""
    rm -f "$response_file"
}

# Testes das correções
test_endpoint "GET" "/api/profile/style-preferences" "Buscar preferências de estilo (problema 1)"
test_endpoint "PUT" "/api/profile" "Atualizar perfil (problema 2)" '{"displayName":"Nome Corrigido","city":"São Paulo"}'
test_endpoint "PUT" "/api/profile/style-preferences" "Atualizar preferência (problema 3)" '{"category":"Clothing","questionId":"clothing_test","selectedOption":"corrected"}'
test_endpoint "GET" "/api/profile/$USER_ID" "Verificar perfil completo"

# Etapa 6: Resumo final
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   RESUMO DA CORREÇÃO${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

echo -e "${GREEN}Problemas corrigidos:${NC}"
echo "1. ✅ Ordem das rotas corrigida"
echo "2. ✅ Middleware de autenticação melhorado"
echo "3. ✅ Normalização de dados do usuário"
echo "4. ✅ Logs de debug adicionados"
echo ""

echo -e "${YELLOW}Para desabilitar os logs de debug:${NC}"
echo "• Remova os console.log do arquivo server/middleware/auth.js"
echo ""

echo -e "${GREEN}Comandos para testar manualmente:${NC}"
echo ""
echo "# Buscar preferências:"
echo "curl -H \"Authorization: Bearer $TOKEN\" $API_URL/api/profile/style-preferences"
echo ""
echo "# Atualizar perfil:"
echo "curl -X PUT -H \"Authorization: Bearer $TOKEN\" -H \"Content-Type: application/json\" -d '{\"displayName\":\"Teste Final\"}' $API_URL/api/profile"
echo ""

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}   CORREÇÃO COMPLETA FINALIZADA${NC}"
echo -e "${BLUE}=====================================================${NC}"