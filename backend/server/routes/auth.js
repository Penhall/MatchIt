// server/routes/auth.js - Sistema de Autenticação com Middleware para MatchIt
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
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

// Função para gerar JWT - MESMO SECRET USADO NO MIDDLEWARE
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET; // Removido o valor padrão hardcoded
  console.log('🔑 JWT_SECRET (generateToken):', secret); // Adicionado para depuração
  console.log('ℹ️ userId para JWT:', userId, 'Tipo:', typeof userId); // Adicionado para depuração
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' }); // Alterado payload para { id: userId }
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
      `INSERT INTO users (email, password_hash, name, created_at, is_active) 
       VALUES ($1, $2, $3, NOW(), true) 
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
      `SELECT id, email, password_hash, name FROM users WHERE email = $1`,
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
    const isValidPassword = await verifyPassword(password, user.password_hash);
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
 * Obter dados do usuário logado - COM MIDDLEWARE DE AUTENTICAÇÃO
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    console.log('👤 Solicitação /me para usuário:', req.user.email);
    
    // req.user já foi validado pelo middleware
    const result = await db.query(
      'SELECT id, email, name, created_at, is_active FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        is_active: user.is_active
      }
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
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

export default router;
