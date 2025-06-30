// server/routes/auth.js - Sistema de Autenticação Básico para MatchIt (ESM)
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js'; // Importar pool diretamente

const router = express.Router();

// Simular conexão com banco (substituir pela sua conexão real)
let db = pool; // Usar o pool importado diretamente

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
  const secret = process.env.JWT_SECRET || 'default-secret-change-this';
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
      'SELECT id FROM users WHERE email = $1',
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

    // Criar usuário
    const result = await db.query(
      `INSERT INTO users (email, password, name, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, email, name, created_at`,
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

    // Buscar usuário
    const result = await db.query(
      'SELECT id, email, password, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    const user = result.rows[0];

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.password);
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
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
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

// IMPORTANTE: Exportar o router corretamente
export default router;
