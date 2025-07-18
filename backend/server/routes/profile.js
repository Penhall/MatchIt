// server/routes/profile.js - Rotas completas de perfil e preferências de estilo
import { Router } from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ==============================================
// DADOS ESTÁTICOS DE CATEGORIAS E QUESTÕES
// ==============================================

const STYLE_CATEGORIES = {
  cores: {
    name: "Cores",
    description: "Suas preferências de cores favoritas",
    questions: [
      {
        id: "color_preference",
        text: "Quais cores você mais gosta?",
        options: [
          { id: "warm", label: "Cores Quentes", value: "warm", description: "Vermelho, laranja, amarelo" },
          { id: "cool", label: "Cores Frias", value: "cool", description: "Azul, verde, roxo" },
          { id: "neutral", label: "Cores Neutras", value: "neutral", description: "Preto, branco, cinza, bege" },
          { id: "bright", label: "Cores Vibrantes", value: "bright", description: "Cores neon e vibrantes" }
        ]
      },
      {
        id: "accent_colors",
        text: "Que tipo de cor de destaque você prefere?",
        options: [
          { id: "bold", label: "Cores Ousadas", value: "bold", description: "Para chamar atenção" },
          { id: "subtle", label: "Cores Sutis", value: "subtle", description: "Discretas e elegantes" },
          { id: "metallic", label: "Cores Metálicas", value: "metallic", description: "Dourado, prateado, bronze" },
          { id: "pastel", label: "Cores Pastel", value: "pastel", description: "Tons suaves e delicados" }
        ]
      }
    ]
  },
  tenis: {
    name: "Tênis",
    description: "Seus estilos de calçados preferidos",
    questions: [
      {
        id: "sneaker_style",
        text: "Que estilo de tênis você prefere?",
        options: [
          { id: "sporty", label: "Esportivo", value: "sporty", description: "Para atividades físicas" },
          { id: "casual", label: "Casual", value: "casual", description: "Para o dia a dia" },
          { id: "luxury", label: "Luxo", value: "luxury", description: "Marcas premium" },
          { id: "vintage", label: "Vintage", value: "vintage", description: "Estilo retrô" }
        ]
      },
      {
        id: "sneaker_height",
        text: "Altura do tênis que você prefere?",
        options: [
          { id: "low", label: "Baixo", value: "low", description: "Tênis baixo tradicional" },
          { id: "mid", label: "Médio", value: "mid", description: "Cano médio" },
          { id: "high", label: "Alto", value: "high", description: "Cano alto/botinha" },
          { id: "mixed", label: "Vario", value: "mixed", description: "Gosto de todos" }
        ]
      }
    ]
  },
  roupas: {
    name: "Roupas",
    description: "Seu estilo de vestir",
    questions: [
      {
        id: "clothing_style",
        text: "Qual seu estilo de roupa favorito?",
        options: [
          { id: "casual", label: "Casual", value: "casual", description: "Confortável e descontraído" },
          { id: "elegant", label: "Elegante", value: "elegant", description: "Sofisticado e formal" },
          { id: "trendy", label: "Moderno", value: "trendy", description: "Sempre na moda" },
          { id: "unique", label: "Único", value: "unique", description: "Estilo próprio e diferenciado" }
        ]
      },
      {
        id: "fit_preference",
        text: "Como você gosta que suas roupas se ajustem?",
        options: [
          { id: "tight", label: "Ajustado", value: "tight", description: "Marcando o corpo" },
          { id: "regular", label: "Regular", value: "regular", description: "Ajuste padrão" },
          { id: "loose", label: "Folgado", value: "loose", description: "Mais solto e confortável" },
          { id: "oversized", label: "Oversized", value: "oversized", description: "Bem largo e moderno" }
        ]
      }
    ]
  },
  hobbies: {
    name: "Hobbies",
    description: "Suas atividades e interesses",
    questions: [
      {
        id: "activity_type",
        text: "Que tipo de atividade você mais gosta?",
        options: [
          { id: "sports", label: "Esportes", value: "sports", description: "Atividades físicas e competitivas" },
          { id: "arts", label: "Arte", value: "arts", description: "Criatividade e expressão" },
          { id: "tech", label: "Tecnologia", value: "tech", description: "Games, programação, gadgets" },
          { id: "social", label: "Social", value: "social", description: "Interação e relacionamentos" }
        ]
      },
      {
        id: "leisure_preference", 
        text: "Como você prefere relaxar?",
        options: [
          { id: "active", label: "Ativo", value: "active", description: "Fazendo atividades" },
          { id: "peaceful", label: "Tranquilo", value: "peaceful", description: "Meditação, leitura" },
          { id: "creative", label: "Criativo", value: "creative", description: "Projetos e criações" },
          { id: "adventurous", label: "Aventura", value: "adventurous", description: "Explorando lugares novos" }
        ]
      }
    ]
  },
  sentimentos: {
    name: "Sentimentos",
    description: "Como você se expressa emocionalmente",
    questions: [
      {
        id: "emotional_expression",
        text: "Como você costuma expressar seus sentimentos?",
        options: [
          { id: "open", label: "Aberto", value: "open", description: "Expressivo e comunicativo" },
          { id: "reserved", label: "Reservado", value: "reserved", description: "Mais introspectivo" },
          { id: "artistic", label: "Artístico", value: "artistic", description: "Através da arte" },
          { id: "actions", label: "Ações", value: "actions", description: "Mostrando através de atitudes" }
        ]
      },
      {
        id: "mood_style",
        text: "Que estilo reflete melhor seu humor?",
        options: [
          { id: "optimistic", label: "Otimista", value: "optimistic", description: "Sempre positivo" },
          { id: "realistic", label: "Realista", value: "realistic", description: "Equilibrado e prático" },
          { id: "dreamy", label: "Sonhador", value: "dreamy", description: "Idealista e imaginativo" },
          { id: "intense", label: "Intenso", value: "intense", description: "Profundo e apaixonado" }
        ]
      }
    ]
  }
};

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

/**
 * Sanitiza entrada do usuário
 */
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>'"]/g, '');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
};

/**
 * Calcula estatísticas de completude
 */
const calculateCompletionStats = (preferences, userId) => {
  const categories = Object.keys(STYLE_CATEGORIES);
  const stats = {
    totalExpected: 0,
    totalCompleted: 0,
    completionPercentage: 0,
    byCategory: {}
  };

  categories.forEach(category => {
    const questions = STYLE_CATEGORIES[category].questions;
    const expected = questions.length;
    const completed = preferences[category] ? Object.keys(preferences[category]).length : 0;
    const percentage = expected > 0 ? Math.round((completed / expected) * 100) : 0;
    
    stats.totalExpected += expected;
    stats.totalCompleted += completed;
    
    stats.byCategory[category] = {
      expected,
      completed,
      percentage,
      missingQuestions: questions
        .filter(q => !preferences[category] || !preferences[category][q.id])
        .map(q => q.id)
    };
  });

  stats.completionPercentage = stats.totalExpected > 0 
    ? Math.round((stats.totalCompleted / stats.totalExpected) * 100) 
    : 0;

  return stats;
};

// ==============================================
// ENDPOINTS
// ==============================================

/**
 * GET /api/style/categories
 * Retorna todas as categorias e questões de estilo
 */
router.get('/style/categories', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('[StyleCategories] Buscando categorias de estilo');
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: STYLE_CATEGORIES,
      processingTime,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`[StyleCategories] Categorias retornadas em ${processingTime}ms`);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('[StyleCategories] Erro ao buscar categorias:', {
      error: error.message,
      stack: error.stack,
      processingTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'CATEGORIES_FETCH_ERROR',
      processingTime
    });
  }
});

/**
 * GET /api/style-preferences
 * Busca preferências de estilo do usuário
 */
router.get('/style-preferences', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[StylePreferences] Buscando preferências para usuário ${userId}`);
    
    // Buscar escolhas salvas no banco
    const query = `
      SELECT 
        category,
        question_id,
        selected_option,
        created_at,
        updated_at
      FROM style_choices 
      WHERE user_id = $1
      ORDER BY category, question_id
    `;
    
    const result = await pool.query(query, [userId]);
    
    // Organizar dados por categoria
    const preferences = {
      cores: {},
      tenis: {},
      roupas: {},
      hobbies: {},
      sentimentos: {}
    };
    
    result.rows.forEach(row => {
      if (!preferences[row.category]) {
        preferences[row.category] = {};
      }
      
      preferences[row.category][row.question_id] = {
        selectedOption: row.selected_option,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    // Calcular estatísticas de completude
    const completionStats = calculateCompletionStats(preferences, userId);
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        userId,
        preferences,
        completionStats,
        metadata: {
          totalChoices: result.rows.length,
          lastUpdated: result.rows.length > 0 
            ? Math.max(...result.rows.map(r => new Date(r.updated_at).getTime()))
            : null,
          isNewProfile: result.rows.length === 0
        }
      },
      processingTime
    });
    
    logger.info(`[StylePreferences] Preferências retornadas para usuário ${userId} em ${processingTime}ms`, {
      totalChoices: result.rows.length,
      completionPercentage: completionStats.completionPercentage
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('[StylePreferences] Erro ao buscar preferências:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      processingTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'PREFERENCES_FETCH_ERROR',
      processingTime
    });
  }
});

/**
 * PUT /api/style-preferences
 * Atualiza uma preferência de estilo específica
 */
router.put('/style-preferences', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { category, questionId, selectedOption } = sanitizeInput(req.body);
    
    // Validações
    if (!category || !questionId || !selectedOption) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: category, questionId, selectedOption',
        code: 'MISSING_PARAMETERS',
        processingTime: Date.now() - startTime
      });
    }
    
    if (!STYLE_CATEGORIES[category]) {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida',
        code: 'INVALID_CATEGORY',
        processingTime: Date.now() - startTime
      });
    }
    
    logger.info(`[StylePreferences] Atualizando preferência para usuário ${userId}`, {
      category,
      questionId,
      selectedOption
    });
    
    // Inserir ou atualizar no banco
    const query = `
      INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (user_id, category, question_id)
      DO UPDATE SET 
        selected_option = EXCLUDED.selected_option,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, category, questionId, selectedOption]);
    const savedChoice = result.rows[0];
    
    // Buscar todas as preferências atualizadas
    const allPreferencesQuery = `
      SELECT category, question_id, selected_option, created_at, updated_at
      FROM style_choices 
      WHERE user_id = $1
    `;
    
    const allResult = await pool.query(allPreferencesQuery, [userId]);
    
    // Organizar preferências
    const preferences = {
      cores: {},
      tenis: {},
      roupas: {},
      hobbies: {},
      sentimentos: {}
    };
    
    allResult.rows.forEach(row => {
      if (!preferences[row.category]) {
        preferences[row.category] = {};
      }
      
      preferences[row.category][row.question_id] = {
        selectedOption: row.selected_option,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    const completionStats = calculateCompletionStats(preferences, userId);
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        userId,
        savedChoice: {
          category: savedChoice.category,
          questionId: savedChoice.question_id,
          selectedOption: savedChoice.selected_option,
          createdAt: savedChoice.created_at,
          updatedAt: savedChoice.updated_at
        },
        preferences,
        completionStats
      },
      message: 'Preferência salva com sucesso',
      processingTime
    });
    
    logger.info(`[StylePreferences] Preferência salva para usuário ${userId} em ${processingTime}ms`, {
      category,
      questionId,
      newCompletionPercentage: completionStats.completionPercentage
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('[StylePreferences] Erro ao salvar preferência:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      body: req.body,
      processingTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'PREFERENCES_SAVE_ERROR',
      processingTime
    });
  }
});

/**
 * GET /api/style/completion-stats/:userId
 * Busca estatísticas de completude das preferências
 */
router.get('/style/completion-stats/:userId', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = req.user.id;
    
    // Verificar se o usuário pode acessar estes dados
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
        code: 'ACCESS_DENIED',
        processingTime: Date.now() - startTime
      });
    }
    
    logger.info(`[CompletionStats] Buscando estatísticas para usuário ${userId}`);
    
    // Buscar preferências salvas
    const query = `
      SELECT category, question_id, selected_option
      FROM style_choices 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    // Organizar por categoria
    const preferences = {
      cores: {},
      tenis: {},
      roupas: {},
      hobbies: {},
      sentimentos: {}
    };
    
    result.rows.forEach(row => {
      if (!preferences[row.category]) {
        preferences[row.category] = {};
      }
      preferences[row.category][row.question_id] = {
        selectedOption: row.selected_option
      };
    });
    
    const completionStats = calculateCompletionStats(preferences, userId);
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: completionStats,
      metadata: {
        userId,
        totalChoices: result.rows.length,
        calculatedAt: new Date().toISOString()
      },
      processingTime
    });
    
    logger.info(`[CompletionStats] Estatísticas calculadas para usuário ${userId} em ${processingTime}ms`, {
      completionPercentage: completionStats.completionPercentage,
      totalCompleted: completionStats.totalCompleted
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('[CompletionStats] Erro ao calcular estatísticas:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
      processingTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'STATS_CALCULATION_ERROR',
      processingTime
    });
  }
});

/**
 * POST /api/style-preferences/batch
 * Atualiza múltiplas preferências de uma vez
 */
router.post('/style-preferences/batch', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { preferences } = sanitizeInput(req.body);
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Array de preferências é obrigatório',
        code: 'MISSING_PREFERENCES',
        processingTime: Date.now() - startTime
      });
    }
    
    logger.info(`[StylePreferences] Salvamento em lote para usuário ${userId}`, {
      totalPreferences: Object.keys(preferences).length
    });
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const savedChoices = [];
      
      // Processar cada categoria
      for (const [category, questions] of Object.entries(preferences)) {
        if (!STYLE_CATEGORIES[category]) {
          continue; // Pular categorias inválidas
        }
        
        // Processar cada questão da categoria
        for (const [questionId, choice] of Object.entries(questions)) {
          if (choice.selectedOption) {
            const query = `
              INSERT INTO style_choices (user_id, category, question_id, selected_option, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NOW(), NOW())
              ON CONFLICT (user_id, category, question_id)
              DO UPDATE SET 
                selected_option = EXCLUDED.selected_option,
                updated_at = NOW()
              RETURNING *
            `;
            
            const result = await client.query(query, [userId, category, questionId, choice.selectedOption]);
            savedChoices.push(result.rows[0]);
          }
        }
      }
      
      await client.query('COMMIT');
      
      // Buscar preferências completas atualizadas
      const allPreferencesQuery = `
        SELECT category, question_id, selected_option, created_at, updated_at
        FROM style_choices 
        WHERE user_id = $1
      `;
      
      const allResult = await client.query(allPreferencesQuery, [userId]);
      
      // Organizar preferências
      const updatedPreferences = {
        cores: {},
        tenis: {},
        roupas: {},
        hobbies: {},
        sentimentos: {}
      };
      
      allResult.rows.forEach(row => {
        if (!updatedPreferences[row.category]) {
          updatedPreferences[row.category] = {};
        }
        
        updatedPreferences[row.category][row.question_id] = {
          selectedOption: row.selected_option,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });
      
      const completionStats = calculateCompletionStats(updatedPreferences, userId);
      const processingTime = Date.now() - startTime;
      
      res.json({
        success: true,
        data: {
          userId,
          savedChoices: savedChoices.length,
          preferences: updatedPreferences,
          completionStats
        },
        message: `${savedChoices.length} preferências salvas com sucesso`,
        processingTime
      });
      
      logger.info(`[StylePreferences] Salvamento em lote concluído para usuário ${userId} em ${processingTime}ms`, {
        savedChoices: savedChoices.length,
        completionPercentage: completionStats.completionPercentage
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('[StylePreferences] Erro no salvamento em lote:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      processingTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'BATCH_SAVE_ERROR',
      processingTime
    });
  }
});

/**
 * DELETE /api/style-preferences
 * Remove todas as preferências do usuário
 */
router.delete('/style-preferences', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    
    logger.info(`[StylePreferences] Removendo todas as preferências do usuário ${userId}`);
    
    const query = `DELETE FROM style_choices WHERE user_id = $1`;
    const result = await pool.query(query, [userId]);
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: {
        userId,
        deletedCount: result.rowCount,
        preferences: {
          cores: {},
          tenis: {},
          roupas: {},
          hobbies: {},
          sentimentos: {}
        },
        completionStats: calculateCompletionStats({}, userId)
      },
      message: `${result.rowCount} preferências removidas com sucesso`,
      processingTime
    });
    
    logger.info(`[StylePreferences] ${result.rowCount} preferências removidas do usuário ${userId} em ${processingTime}ms`);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('[StylePreferences] Erro ao remover preferências:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      processingTime
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor', 
      code: 'PREFERENCES_DELETE_ERROR',
      processingTime
    });
  }
});

export default router;
