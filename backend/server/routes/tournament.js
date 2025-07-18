// server/routes/tournament.js - Rotas de torneio corrigidas para MatchIt
import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/tournament/categories
 * Listar categorias disponíveis (rota pública)
 */
router.get('/categories', async (req, res) => {
  try {
    console.log('🏆 Buscando categorias de torneio');
    
    // Categorias básicas do MatchIt
    const categories = [
      { id: 'cores', name: 'Cores', description: 'Escolha suas cores favoritas' },
      { id: 'estilos', name: 'Estilos', description: 'Defina seu estilo pessoal' },
      { id: 'acessorios', name: 'Acessórios', description: 'Selecione acessórios que combinam com você' },
      { id: 'calcados', name: 'Calçados', description: 'Encontre o calçado ideal' },
      { id: 'texturas', name: 'Texturas', description: 'Explore diferentes texturas' }
    ];

    res.json({
      success: true,
      categories: categories,
      total: categories.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar categorias de torneio'
    });
  }
});

/**
 * GET /api/tournament/images
 * Listar imagens disponíveis (rota pública) - VERSÃO CORRIGIDA
 */
router.get('/images', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    console.log('🖼️ Buscando imagens de torneio, categoria:', category || 'todas');
    
    // Query corrigida com todas as colunas que existem
    let query = `
      SELECT 
        id, 
        category, 
        image_url, 
        alt_text, 
        title,
        description,
        upload_date,
        approved
      FROM tournament_images 
      WHERE approved = true
    `;
    
    let params = [];
    
    // Filtro por categoria se fornecido
    if (category && category !== 'all') {
      query += ' AND category = $1';
      params.push(category);
    }
    
    // Ordenação e limite
    query += ` ORDER BY upload_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    console.log('🖼️ Query executada:', query);
    console.log('🖼️ Parâmetros:', params);
    
    const result = await pool.query(query, params);
    
    console.log('✅ Imagens encontradas:', result.rows.length);

    res.json({
      success: true,
      images: result.rows,
      total: result.rows.length,
      category: category || 'all'
    });

  } catch (error) {
    console.error('❌ Erro ao buscar imagens:', error);
    console.error('   Detalhes:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar imagens',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/tournament/start
 * Iniciar novo torneio (requer autenticação)
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { category, tournamentSize = 8 } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Categoria é obrigatória'
      });
    }

    console.log('🏆 Iniciando torneio:', req.user.email, category);

    // Buscar imagens da categoria para o torneio
    const imagesResult = await pool.query(
      'SELECT id, image_url, alt_text FROM tournament_images WHERE category = $1 AND approved = true ORDER BY RANDOM() LIMIT $2',
      [category, tournamentSize]
    );

    if (imagesResult.rows.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Não há imagens suficientes para um torneio nesta categoria'
      });
    }

    // Criar sessão de torneio
    const sessionId = `tournament_${req.user.id}_${category}_${Date.now()}`;
    
    const images = imagesResult.rows;
    const totalRounds = Math.ceil(Math.log2(images.length));

    res.json({
      success: true,
      sessionId: sessionId,
      category: category,
      images: images,
      totalRounds: totalRounds,
      currentRound: 1,
      message: 'Torneio iniciado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar torneio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao iniciar torneio'
    });
  }
});

/**
 * POST /api/tournament/choice
 * Registrar escolha do usuário no torneio (requer autenticação)
 */
router.post('/choice', authenticateToken, async (req, res) => {
  try {
    const { sessionId, selectedImageId, eliminatedImageId, round } = req.body;

    if (!sessionId || !selectedImageId || !eliminatedImageId) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos para registrar escolha'
      });
    }

    console.log('✅ Registrando escolha:', req.user.email, selectedImageId);

    // Por enquanto, retornar sucesso básico
    res.json({
      success: true,
      message: 'Escolha registrada com sucesso',
      sessionId: sessionId,
      selectedImageId: selectedImageId,
      nextRound: round + 1
    });

  } catch (error) {
    console.error('❌ Erro ao registrar escolha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao registrar escolha'
    });
  }
});

export default router;