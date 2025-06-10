// server/routes/matches.js - Rotas de matches (APENAS MATCHES)
import express from 'express';

const router = express.Router();

// GET /potential - Buscar matches potenciais
router.get('/potential', async (req, res) => {
  try {
    // Resposta mockada por enquanto
    const mockMatches = [
      {
        id: '1',
        name: 'Ana Silva',
        age: 25,
        city: 'São Paulo',
        compatibility_score: 85,
        avatar_url: 'https://picsum.photos/200/200?random=1'
      },
      {
        id: '2', 
        name: 'Carlos Santos',
        age: 28,
        city: 'Rio de Janeiro',
        compatibility_score: 78,
        avatar_url: 'https://picsum.photos/200/200?random=2'
      }
    ];
    
    res.json(mockMatches);
  } catch (error) {
    console.error('Erro ao buscar matches potenciais:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// GET / - Obter matches existentes
router.get('/', async (req, res) => {
  try {
    // Resposta mockada por enquanto
    const mockMatches = [
      {
        id: 'match_1',
        user_id: '2',
        name: 'Ana Silva',
        status: 'active',
        created_at: new Date(),
        avatar_url: 'https://picsum.photos/200/200?random=1'
      }
    ];
    
    res.json(mockMatches);
  } catch (error) {
    console.error('Erro ao buscar matches:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST / - Criar novo match
router.post('/', async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({ 
        error: 'targetUserId é obrigatório' 
      });
    }
    
    // Resposta mockada
    res.status(201).json({ 
      matchId: `match_${Date.now()}`,
      message: 'Match criado com sucesso (mock)',
      targetUserId
    });
    
  } catch (error) {
    console.error('Erro ao criar match:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;