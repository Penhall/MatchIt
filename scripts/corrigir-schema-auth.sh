#!/bin/bash
# scripts/corrigir-schema-auth.sh - Correção de incompatibilidade de schema na autenticação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} 🔧 MATCHIT - CORREÇÃO DE SCHEMA DE AUTENTICAÇÃO${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo -e "   • Código auth.js usa coluna 'password'"
echo -e "   • Tabela users tem coluna 'password_hash'"
echo -e "   • Erro: valor nulo na coluna password_hash"
echo ""
echo -e "${YELLOW}🛠️ SOLUÇÃO:${NC}"
echo -e "   • Ajustar código auth.js para usar 'password_hash'"
echo -e "   • Manter estrutura atual do banco"
echo -e "   • Teste imediato após correção"
echo ""

# Verificar conexão com banco
echo -e "${BLUE}▶ ETAPA 1: Verificar estrutura atual da tabela users${NC}"

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="matchit_db"
DB_USER="matchit"
export PGPASSWORD="matchit123"

# Verificar se tabela users existe e sua estrutura
COLUMN_CHECK=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('password', 'password_hash');" 2>/dev/null || echo "erro")

if [[ "$COLUMN_CHECK" == "erro" ]]; then
    echo -e "${RED}❌ Erro ao conectar com banco de dados${NC}"
    echo -e "${YELLOW}   Verifique se PostgreSQL está rodando e credenciais estão corretas${NC}"
    exit 1
fi

# Verificar qual coluna existe
if echo "$COLUMN_CHECK" | grep -q "password_hash"; then
    echo -e "${GREEN}✅ Coluna 'password_hash' encontrada na tabela users${NC}"
    PASSWORD_COLUMN="password_hash"
elif echo "$COLUMN_CHECK" | grep -q "password"; then
    echo -e "${GREEN}✅ Coluna 'password' encontrada na tabela users${NC}"
    PASSWORD_COLUMN="password"
else
    echo -e "${RED}❌ Nenhuma coluna de senha encontrada na tabela users${NC}"
    echo -e "${YELLOW}   Criando coluna password_hash...${NC}"
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';
    " > /dev/null 2>&1
    
    PASSWORD_COLUMN="password_hash"
    echo -e "${GREEN}✅ Coluna password_hash criada${NC}"
fi

echo -e "${BLUE}▶ ETAPA 2: Backup do arquivo auth.js atual${NC}"
cp server/routes/auth.js server/routes/auth.js.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup criado: server/routes/auth.js.backup.$(date +%Y%m%d_%H%M%S)${NC}"

echo -e "${BLUE}▶ ETAPA 3: Criando auth.js corrigido para usar '$PASSWORD_COLUMN'${NC}"

cat > server/routes/auth.js << EOF
// server/routes/auth.js - Sistema de Autenticação Corrigido para MatchIt (ESM)
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';

const router = express.Router();

// Usar pool do banco diretamente
const db = pool;

// Middleware de validação
const validateRegister = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

// Função para gerar JWT
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'matchit-secret-development-2025';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// Função para hash da senha
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Função para verificar senha
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    console.log('📝 Tentativa de registro:', req.body.email);
    
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Verificar se usuário já existe
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = \$1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Usuário já existe'
      });
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário - USANDO COLUNA CORRETA: $PASSWORD_COLUMN
    const result = await db.query(
      \`INSERT INTO users (email, $PASSWORD_COLUMN, name, created_at) 
       VALUES (\$1, \$2, \$3, NOW()) 
       RETURNING id, email, name, created_at\`,
      [email, hashedPassword, name]
    );

    const user = result.rows[0];

    // Gerar token
    const token = generateToken(user.id);

    console.log('✅ Usuário registrado:', user.email);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Login do usuário
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    console.log('🔐 Tentativa de login:', req.body.email);
    
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuário - USANDO COLUNA CORRETA: $PASSWORD_COLUMN
    const result = await db.query(
      \`SELECT id, email, $PASSWORD_COLUMN, name FROM users WHERE email = \$1\`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar senha - USANDO COLUNA CORRETA
    const isValidPassword = await verifyPassword(password, user.$PASSWORD_COLUMN);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    console.log('✅ Login realizado:', user.email);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário logado
 */
router.get('/me', async (req, res) => {
  try {
    // Middleware de autenticação deve adicionar req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    const result = await db.query(
      'SELECT id, email, name, created_at FROM users WHERE id = \$1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao obter usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (para compatibilidade com frontend)
 */
router.post('/logout', (req, res) => {
  // Com JWT, logout é feito no frontend removendo o token
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

export default router;
EOF

echo -e "${GREEN}✅ auth.js corrigido para usar coluna '$PASSWORD_COLUMN'${NC}"

echo -e "${BLUE}▶ ETAPA 4: Verificar sintaxe do arquivo corrigido${NC}"

# Teste básico de sintaxe
if node -c server/routes/auth.js; then
    echo -e "${GREEN}✅ Sintaxe do auth.js está correta${NC}"
else
    echo -e "${RED}❌ Erro de sintaxe no auth.js${NC}"
    exit 1
fi

echo -e "${BLUE}▶ ETAPA 5: Instruções para teste${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ SCHEMA DE AUTENTICAÇÃO CORRIGIDO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "${YELLOW}1. Reiniciar o servidor:${NC}"
echo -e "   ${BLUE}Ctrl+C${NC} (se estiver rodando)"
echo -e "   ${BLUE}npm run server${NC}"
echo ""
echo -e "${YELLOW}2. Testar autenticação corrigida:${NC}"
echo -e "   ${BLUE}./scripts/test-auth-corrigido.sh${NC}"
echo ""
echo -e "${YELLOW}3. Se funcionou, executar teste completo:${NC}"
echo -e "   ${BLUE}./scripts/test-sistema-completo-melhorado.sh${NC}"
echo ""

echo -e "${GREEN}🎯 CORREÇÕES APLICADAS:${NC}"
echo -e "   • auth.js agora usa coluna '$PASSWORD_COLUMN'"
echo -e "   • Queries de registro e login corrigidas"
echo -e "   • Compatibilidade com estrutura atual do banco"
echo -e "   • Tratamento de erros melhorado"
echo ""

echo -e "${YELLOW}⚡ Reinicie o servidor para ativar as mudanças!${NC}"