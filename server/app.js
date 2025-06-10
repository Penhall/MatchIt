// server/routes/auth.js - Rotas de autenticação (APENAS AUTH)
import express from 'express';

const router = express.Router();

// POST /api/auth/register - Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, displayName, city, gender, age } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, senha e nome são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Por enquanto, resposta mockada até implementar AuthService
    res.status(201).json({
      message: 'Usuário registrado com sucesso (mock)',
      user: {
        email,
        name,
        displayName: displayName || name,
        city: city || 'Unknown'
      },
      token: 'mock_jwt_token'
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// POST /api/auth/login - Login de usuário
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Por enquanto, resposta mockada
    res.json({
      message: 'Login realizado com sucesso (mock)',
      user: {
        email,
        name: 'Mock User'
      },
      token: 'mock_jwt_token'
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'LOGIN_ERROR'
    });
  }
});

export default router;