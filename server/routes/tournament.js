// server/routes/tournament.js - Endpoints completos para sistema de torneios
const express = require('express');
const router = express.Router();
const tournamentEngine = require('../services/TournamentEngine');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tournament-images/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // máximo 10 arquivos por vez
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use: JPEG, PNG ou WebP'), false);
    }
  }
});

// =====================================================
// ENDPOINTS PRINCIPAIS DO TORNEIO
// =====================================================

// POST /api/tournament/start - Iniciar novo torneio
router.post('/start', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, tournamentSize = 32 } = req.body;

    // Validação de entrada
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Campo "category" é obrigatório'
      });
    }

    const validCategories = [
      'cores', 'estilos', 'calcados', 'acessorios', 'texturas',
      'roupas_casuais', 'roupas_formais', 'roupas_festa', 'joias', 'bolsas'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Categoria inválida',
        validCategories
      });
    }

    if (![4, 8, 16, 32, 64, 128].includes(tournamentSize)) {
      return res.status(400).json({
        success: false,
        message: 'Tamanho do torneio deve ser: 4, 8, 16, 32, 64 ou 128'
      });
    }

    const session = await tournamentEngine.startTournament(userId, category, tournamentSize);

    res.json({
      success: true,
      message: 'Torneio iniciado com sucesso',
      data: session
    });

  } catch (error) {
    console.error('Erro ao iniciar torneio:', error);
    
    if (error.message.includes('já existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('não possui imagens suficientes')) {
      return res.status(422).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/tournament/active/:category - Buscar sessão ativa
router.get('/active/:category', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.params;

    const session = await tournamentEngine.getActiveSession(userId, category);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma sessão ativa encontrada para esta categoria'
      });
    }

    res.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Erro ao buscar sessão ativa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/tournament/matchup/:sessionId - Obter próximo confronto
router.get('/matchup/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verificar se a sessão pertence ao usuário
    const session = await tournamentEngine.getActiveSession(userId, null);
    if (!session || session.id !== sessionId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a esta sessão de torneio'
      });
    }

    const matchup = await tournamentEngine.generateNextMatchup(sessionId);

    if (!matchup) {
      return res.status(404).json({
        success: false,
        message: 'Torneio finalizado ou não há mais confrontos'
      });
    }

    res.json({
      success: true,
      data: matchup
    });

  } catch (error) {
    console.error('Erro ao gerar confronto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/tournament/choice - Processar escolha do usuário
router.post('/choice', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, winnerId, responseTimeMs, confidenceLevel } = req.body;

    // Validação de entrada
    if (!sessionId || !winnerId || responseTimeMs === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: sessionId, winnerId, responseTimeMs'
      });
    }

    if (typeof winnerId !== 'number' || winnerId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'winnerId deve ser um número positivo'
      });
    }

    if (typeof responseTimeMs !== 'number' || responseTimeMs < 0) {
      return res.status(400).json({
        success: false,
        message: 'responseTimeMs deve ser um número não-negativo'
      });
    }

    if (confidenceLevel && (confidenceLevel < 1 || confidenceLevel > 5)) {
      return res.status(400).json({
        success: false,
        message: 'confidenceLevel deve estar entre 1 e 5'
      });
    }

    // Verificar se a sessão pertence ao usuário
    const currentSession = await tournamentEngine.getActiveSession(userId, null);
    if (!currentSession || currentSession.id !== sessionId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a esta sessão de torneio'
      });
    }

    const updatedSession = await tournamentEngine.processChoice(
      sessionId, 
      winnerId, 
      responseTimeMs, 
      confidenceLevel
    );

    res.json({
      success: true,
      message: 'Escolha processada com sucesso',
      data: updatedSession
    });

  } catch (error) {
    console.error('Erro ao processar escolha:', error);
    
    if (error.message.includes('não corresponde')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/tournament/result/:sessionId - Obter resultado do torneio
router.get('/result/:sessionId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const result = await tournamentEngine.getTournamentResult(sessionId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Resultado do torneio não encontrado'
      });
    }

    // Verificar se o resultado pertence ao usuário
    if (result.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este resultado'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/tournament/history - Histórico de torneios do usuário
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT tr.*, ti.title as champion_title, ti.image_url as champion_image_url,
             ts.tournament_size, ts.started_at as session_started_at
      FROM tournament_results tr
      JOIN tournament_sessions ts ON tr.session_id = ts.id
      LEFT JOIN tournament_images ti ON tr.champion_id = ti.id
      WHERE tr.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND tr.category = $${paramCount}`;
      params.push(category);
    }

    query += ` ORDER BY tr.completed_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Buscar contagem total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tournament_results tr
      WHERE tr.user_id = $1
    `;
    const countParams = [userId];

    if (category) {
      countQuery += ` AND tr.category = $2`;
      countParams.push(category);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        tournaments: result.rows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// ENDPOINTS DE IMAGENS
// =====================================================

// GET /api/tournament/images/:category - Listar imagens de uma categoria
router.get('/images/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50, active = 'true' } = req.query;

    const images = await tournamentEngine.getImagesForCategory(category, parseInt(limit));

    res.json({
      success: true,
      data: images,
      count: images.length
    });

  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/tournament/categories - Listar categorias disponíveis
router.get('/categories', async (req, res) => {
  try {
    const categories = {
      cores: {
        name: 'Cores',
        description: 'Paletas e combinações de cores',
        icon: '🎨'
      },
      estilos: {
        name: 'Estilos',
        description: 'Estilos de vestimenta e looks',
        icon: '👗'
      },
      calcados: {
        name: 'Calçados',
        description: 'Sapatos, tênis e sandálias',
        icon: '👠'
      },
      acessorios: {
        name: 'Acessórios',
        description: 'Bolsas, joias e complementos',
        icon: '💍'
      },
      texturas: {
        name: 'Texturas',
        description: 'Materiais e acabamentos',
        icon: '🧵'
      },
      roupas_casuais: {
        name: 'Roupas Casuais',
        description: 'Looks para o dia a dia',
        icon: '👕'
      },
      roupas_formais: {
        name: 'Roupas Formais',
        description: 'Trajes sociais e elegantes',
        icon: '🤵'
      },
      roupas_festa: {
        name: 'Roupas de Festa',
        description: 'Looks para ocasiões especiais',
        icon: '🎉'
      },
      joias: {
        name: 'Joias',
        description: 'Anéis, colares e pulseiras',
        icon: '💎'
      },
      bolsas: {
        name: 'Bolsas',
        description: 'Bolsas, mochilas e carteiras',
        icon: '👜'
      }
    };

    // Buscar contagem de imagens por categoria
    const countResult = await pool.query(`
      SELECT category, COUNT(*) as image_count
      FROM tournament_images 
      WHERE active = true AND approved = true
      GROUP BY category
    `);

    // Adicionar contagens às categorias
    countResult.rows.forEach(row => {
      if (categories[row.category]) {
        categories[row.category].imageCount = parseInt(row.image_count);
        categories[row.category].available = row.image_count >= 4;
      }
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// ENDPOINTS ADMINISTRATIVOS
// =====================================================

// POST /api/tournament/admin/images - Upload de imagens (apenas admins)
router.post('/admin/images', upload.array('images', 10), async (req, res) => {
  try {
    // Verificar se usuário é admin (implementar verificação real)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem fazer upload de imagens.'
      });
    }

    const { category, titles, descriptions, tags } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma imagem foi enviada'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Campo "category" é obrigatório'
      });
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = Array.isArray(titles) ? titles[i] : titles || `Imagem ${i + 1}`;
      const description = Array.isArray(descriptions) ? descriptions[i] : descriptions || '';
      const imageTags = Array.isArray(tags) ? tags[i] : tags || '';

      // Inserir no banco de dados
      const result = await pool.query(`
        INSERT INTO tournament_images 
        (category, image_url, thumbnail_url, title, description, tags, 
         active, approved, created_by, upload_date)
        VALUES ($1, $2, $3, $4, $5, $6, true, false, $7, NOW())
        RETURNING *
      `, [
        category,
        `/uploads/tournament-images/${file.filename}`,
        `/uploads/tournament-images/${file.filename}`, // Usar mesma imagem como thumbnail
        title,
        description,
        imageTags.split(',').map(tag => tag.trim()),
        req.user.id
      ]);

      uploadedImages.push(result.rows[0]);
    }

    res.json({
      success: true,
      message: `${uploadedImages.length} imagem(ns) enviada(s) com sucesso`,
      data: uploadedImages
    });

  } catch (error) {
    console.error('Erro no upload de imagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/tournament/admin/images/:imageId/approve - Aprovar imagem
router.put('/admin/images/:imageId/approve', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado.'
      });
    }

    const { imageId } = req.params;
    const { approved = true } = req.body;

    const result = await pool.query(`
      UPDATE tournament_images 
      SET approved = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [approved, req.user.id, imageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    res.json({
      success: true,
      message: `Imagem ${approved ? 'aprovada' : 'rejeitada'} com sucesso`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao aprovar imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/tournament/admin/analytics - Analytics do sistema
router.get('/admin/analytics', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado.'
      });
    }

    const { startDate, endDate, category } = req.query;

    let query = `
      SELECT date, category, total_sessions, completed_sessions, abandoned_sessions,
             average_completion_rate, average_session_duration_minutes, 
             average_choice_time_ms, unique_users
      FROM tournament_analytics
      WHERE date >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND date <= COALESCE($2::date, CURRENT_DATE)
    `;

    const params = [startDate, endDate];

    if (category) {
      query += ` AND category = $3`;
      params.push(category);
    }

    query += ` ORDER BY date DESC, category`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;