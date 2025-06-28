// server/routes/tournament.js - Rotas completas do sistema de torneios
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { TournamentEngine } from '../services/TournamentEngine.js';
import { pool } from '../config/database.js';

const router = express.Router();
const tournamentEngine = new TournamentEngine();

// =====================================================
// MIDDLEWARE CONFIGURATION
// =====================================================

// Middleware de autenticação simplificado (substitua pela sua implementação)
const authMiddleware = (req, res, next) => {
  // TODO: Implementar autenticação real
  const userId = req.headers['user-id'] || req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação requerido'
    });
  }
  
  req.user = { 
    id: parseInt(userId),
    isAdmin: req.headers['x-user-role'] === 'admin' // Simplificado para demo
  };
  next();
};

// Middleware para verificar admin
const adminMiddleware = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas administradores.'
    });
  }
  next();
};

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'tournaments');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `tournament-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 10 // Máximo 10 arquivos por vez
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens JPEG, PNG e WebP são permitidas'));
    }
  }
});

// =====================================================
// PUBLIC TOURNAMENT ROUTES
// =====================================================

/**
 * GET /api/tournament/categories
 * Listar categorias disponíveis com estatísticas
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await tournamentEngine.getCategories();
    
    res.json({
      success: true,
      data: categories,
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
 * POST /api/tournament/start
 * Iniciar novo torneio ou retomar existente
 */
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { category, tournamentSize = 16 } = req.body;
    const userId = req.user.id;

    // Validações
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Categoria é obrigatória'
      });
    }

    const validSizes = [8, 16, 32, 64];
    if (!validSizes.includes(tournamentSize)) {
      return res.status(400).json({
        success: false,
        error: 'Tamanho de torneio inválido. Permitidos: 8, 16, 32, 64'
      });
    }

    const result = await tournamentEngine.startTournament(userId, category, tournamentSize);
    
    res.json({
      success: true,
      data: result,
      message: result.resumed ? 'Torneio retomado com sucesso' : 'Torneio iniciado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar torneio:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao iniciar torneio'
    });
  }
});

/**
 * GET /api/tournament/session/:sessionId
 * Buscar dados da sessão atual
 */
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await tournamentEngine.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sessão não encontrada'
      });
    }

    // Verificar se o usuário é dono da sessão
    if (session.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a esta sessão'
      });
    }

    const matchup = await tournamentEngine.getCurrentMatchup(sessionId);
    
    res.json({
      success: true,
      data: {
        session,
        matchup
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar sessão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/tournament/choice
 * Processar escolha do usuário no torneio
 */
router.post('/choice', authMiddleware, async (req, res) => {
  try {
    const { sessionId, winnerId, loserId, responseTimeMs } = req.body;

    // Validações
    if (!sessionId || !winnerId || !loserId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, winnerId e loserId são obrigatórios'
      });
    }

    if (winnerId === loserId) {
      return res.status(400).json({
        success: false,
        error: 'winnerId e loserId devem ser diferentes'
      });
    }

    const responseTime = Math.max(0, parseInt(responseTimeMs) || 0);

    // Verificar se o usuário é dono da sessão
    const session = await tournamentEngine.getSessionById(sessionId);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Sessão não encontrada ou acesso negado'
      });
    }

    const result = await tournamentEngine.processChoice(
      sessionId, 
      winnerId, 
      loserId, 
      responseTime
    );
    
    res.json({
      success: true,
      data: result,
      message: result.finished ? 'Torneio finalizado!' : 'Escolha processada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao processar escolha:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao processar escolha'
    });
  }
});

/**
 * GET /api/tournament/result/:sessionId
 * Buscar resultado de torneio específico
 */
router.get('/result/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const resultQuery = `
      SELECT tr.*, ti.image_url as champion_image_url, ti.title as champion_title
      FROM tournament_results tr
      LEFT JOIN tournament_images ti ON tr.champion_id = ti.id
      WHERE tr.session_id = $1
    `;
    
    const result = await pool.query(resultQuery, [sessionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resultado não encontrado'
      });
    }

    const tournamentResult = result.rows[0];
    
    // Verificar se o usuário é dono do resultado
    if (tournamentResult.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a este resultado'
      });
    }

    res.json({
      success: true,
      data: {
        ...tournamentResult,
        style_profile: JSON.parse(tournamentResult.style_profile || '{}'),
        dominant_preferences: JSON.parse(tournamentResult.dominant_preferences || '{}')
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/tournament/history
 * Buscar histórico de torneios do usuário
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, limit = 20, offset = 0 } = req.query;
    
    let historyQuery = `
      SELECT 
        tr.*,
        ti.image_url as champion_image_url,
        ti.title as champion_title,
        ti.tags as champion_tags
      FROM tournament_results tr
      LEFT JOIN tournament_images ti ON tr.champion_id = ti.id
      WHERE tr.user_id = $1
    `;
    
    const queryParams = [userId];
    
    if (category) {
      historyQuery += ' AND tr.category = $2';
      queryParams.push(category);
    }
    
    historyQuery += ' ORDER BY tr.completed_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(historyQuery, queryParams);
    
    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) as total FROM tournament_results WHERE user_id = $1';
    const countParams = [userId];
    
    if (category) {
      countQuery += ' AND category = $2';
      countParams.push(category);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        style_profile: JSON.parse(row.style_profile || '{}'),
        dominant_preferences: JSON.parse(row.dominant_preferences || '{}')
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/tournament/active-sessions
 * Buscar sessões ativas do usuário
 */
router.get('/active-sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await tournamentEngine.getUserActiveSessions(userId);
    
    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('❌ Erro ao buscar sessões ativas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/tournament/session/:sessionId
 * Cancelar sessão ativa
 */
router.delete('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Verificar se a sessão existe e pertence ao usuário
    const session = await tournamentEngine.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sessão não encontrada'
      });
    }
    
    if (session.user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a esta sessão'
      });
    }
    
    // Cancelar sessão
    const cancelQuery = `
      UPDATE tournament_sessions 
      SET status = 'cancelled', updated_at = NOW() 
      WHERE id = $1
    `;
    
    await pool.query(cancelQuery, [sessionId]);
    
    res.json({
      success: true,
      message: 'Sessão cancelada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao cancelar sessão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ADMIN ROUTES
// =====================================================

/**
 * GET /api/tournament/admin/stats
 * Estatísticas gerais para admin
 */
router.get('/admin/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const stats = await tournamentEngine.getAdminStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/tournament/admin/images
 * Listar todas as imagens com filtros
 */
router.get('/admin/images', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { 
      category, 
      status = 'all', 
      search, 
      sortBy = 'upload_date', 
      sortOrder = 'desc',
      page = 1,
      limit = 20 
    } = req.query;
    
    let query = `
      SELECT 
        ti.*,
        u1.username as created_by_username,
        u2.username as approved_by_username
      FROM tournament_images ti
      LEFT JOIN users u1 ON ti.created_by = u1.id
      LEFT JOIN users u2 ON ti.approved_by = u2.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Filtros
    if (category) {
      query += ` AND ti.category = $${paramIndex++}`;
      queryParams.push(category);
    }
    
    if (status !== 'all') {
      switch (status) {
        case 'pending':
          query += ` AND ti.approved = false`;
          break;
        case 'approved':
          query += ` AND ti.approved = true`;
          break;
        case 'active':
          query += ` AND ti.active = true AND ti.approved = true`;
          break;
        case 'inactive':
          query += ` AND ti.active = false`;
          break;
      }
    }
    
    if (search) {
      query += ` AND (ti.title ILIKE $${paramIndex++} OR ti.description ILIKE $${paramIndex} OR $${paramIndex} = ANY(ti.tags))`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, search);
    }
    
    // Ordenação
    const validSortFields = ['upload_date', 'title', 'win_rate', 'total_views', 'total_selections'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'upload_date';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ti.${sortField} ${order}`;
    
    // Paginação
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limitNum, offset);
    
    const result = await pool.query(query, queryParams);
    
    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM tournament_images ti WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (category) {
      countQuery += ` AND ti.category = $${countParamIndex++}`;
      countParams.push(category);
    }
    
    if (status !== 'all') {
      switch (status) {
        case 'pending':
          countQuery += ` AND ti.approved = false`;
          break;
        case 'approved':
          countQuery += ` AND ti.approved = true`;
          break;
        case 'active':
          countQuery += ` AND ti.active = true AND ti.approved = true`;
          break;
        case 'inactive':
          countQuery += ` AND ti.active = false`;
          break;
      }
    }
    
    if (search) {
      countQuery += ` AND (ti.title ILIKE $${countParamIndex++} OR ti.description ILIKE $${countParamIndex} OR $${countParamIndex} = ANY(ti.tags))`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, search);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar imagens admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/tournament/admin/images/upload
 * Upload de múltiplas imagens
 */
router.post('/admin/images/upload', [authMiddleware, adminMiddleware], upload.array('images', 10), async (req, res) => {
  try {
    const { category, titles, descriptions, tags } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada'
      });
    }
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Categoria é obrigatória'
      });
    }

    const results = [];
    const titlesArray = Array.isArray(titles) ? titles : [titles];
    const descriptionsArray = Array.isArray(descriptions) ? descriptions : [descriptions];
    const tagsArray = Array.isArray(tags) ? tags : [tags];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = titlesArray[i] || `Imagem ${i + 1}`;
      const description = descriptionsArray[i] || '';
      const imageTags = tagsArray[i] ? tagsArray[i].split(',').map(tag => tag.trim()) : [];
      
      // Gerar URLs (ajuste conforme sua configuração de static files)
      const imageUrl = `/uploads/tournaments/${file.filename}`;
      const thumbnailUrl = imageUrl; // TODO: Implementar geração de thumbnails
      
      const insertQuery = `
        INSERT INTO tournament_images (
          category, image_url, thumbnail_url, title, description, tags,
          created_by, file_size, image_width, image_height, mime_type,
          upload_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        category, imageUrl, thumbnailUrl, title, description, imageTags,
        req.user.id, file.size, null, null, file.mimetype
      ]);
      
      results.push(result.rows[0]);
    }

    res.json({
      success: true,
      data: results,
      message: `${results.length} imagem(ns) enviada(s) com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/tournament/admin/images/:id/approve
 * Aprovar imagem
 */
router.put('/admin/images/:id/approve', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    
    const updateQuery = `
      UPDATE tournament_images 
      SET approved = true, approved_by = $1, approved_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [req.user.id, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Imagem não encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Imagem aprovada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao aprovar imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/tournament/admin/images/:id
 * Atualizar dados da imagem
 */
router.put('/admin/images/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, active, approved } = req.body;
    
    const updateQuery = `
      UPDATE tournament_images 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        tags = COALESCE($3, tags),
        active = COALESCE($4, active),
        approved = COALESCE($5, approved),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      title, description, tags, active, approved, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Imagem não encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Imagem atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/tournament/admin/images/:id
 * Deletar imagem
 */
router.delete('/admin/images/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar dados da imagem antes de deletar
    const selectQuery = 'SELECT * FROM tournament_images WHERE id = $1';
    const selectResult = await pool.query(selectQuery, [id]);
    
    if (selectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Imagem não encontrada'
      });
    }
    
    const image = selectResult.rows[0];
    
    // Deletar do banco
    const deleteQuery = 'DELETE FROM tournament_images WHERE id = $1';
    await pool.query(deleteQuery, [id]);
    
    // TODO: Deletar arquivo físico do disco
    // try {
    //   const filePath = path.join(process.cwd(), image.image_url);
    //   await fs.unlink(filePath);
    // } catch (fileError) {
    //   console.warn('⚠️ Erro ao deletar arquivo físico:', fileError);
    // }

    res.json({
      success: true,
      message: 'Imagem deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/tournament/admin/images/bulk-action
 * Ações em lote para imagens
 */
router.post('/admin/images/bulk-action', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { imageIds, action } = req.body;
    
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de IDs de imagens é obrigatória'
      });
    }
    
    if (!['approve', 'reject', 'activate', 'deactivate', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Ação inválida'
      });
    }

    let query;
    let params;
    
    switch (action) {
      case 'approve':
        query = `
          UPDATE tournament_images 
          SET approved = true, approved_by = $1, approved_at = NOW()
          WHERE id = ANY($2)
        `;
        params = [req.user.id, imageIds];
        break;
        
      case 'reject':
        query = `
          UPDATE tournament_images 
          SET approved = false, approved_by = NULL, approved_at = NULL
          WHERE id = ANY($1)
        `;
        params = [imageIds];
        break;
        
      case 'activate':
        query = `UPDATE tournament_images SET active = true WHERE id = ANY($1)`;
        params = [imageIds];
        break;
        
      case 'deactivate':
        query = `UPDATE tournament_images SET active = false WHERE id = ANY($1)`;
        params = [imageIds];
        break;
        
      case 'delete':
        query = `DELETE FROM tournament_images WHERE id = ANY($1)`;
        params = [imageIds];
        break;
    }
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      message: `Ação '${action}' aplicada a ${result.rowCount} imagem(ns)`,
      affectedRows: result.rowCount
    });

  } catch (error) {
    console.error('❌ Erro na ação em lote:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ERROR HANDLER
// =====================================================

router.use((error, req, res, next) => {
  console.error('❌ Erro nas rotas de torneio:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo muito grande. Limite: 5MB por imagem'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Muitos arquivos. Limite: 10 imagens por vez'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

export default router;