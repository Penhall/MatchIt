import { Router, Request, Response, NextFunction } from 'express';
import { AdaptiveLearningSystem } from '../recommendation/adaptiveLearning';
import {
  WeightAdjustmentParams,
  EmotionalState,
  EmotionalProfile,
  EmotionalStateSource,
  EmotionalStateInput,
  PaginationParams,
  PaginatedResponse
} from '../recommendation';
import { pool } from '@db';
import { Pool } from 'pg';

// Funções de banco de dados
async function saveEmotionalState(state: EmotionalStateInput): Promise<EmotionalState> {
  const result = await pool.query(
    `INSERT INTO emotional_states
     (user_id, valence, arousal, dominance, source, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [state.userId, state.valence, state.arousal, state.dominance, state.source, state.timestamp || new Date()]
  );
  return result.rows[0];
}

async function getEmotionalProfile(userId: number): Promise<EmotionalProfile> {
  const result = await pool.query(
    `SELECT * FROM emotional_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function getEmotionalHistory(
  userId: number,
  pagination?: PaginationParams
): Promise<PaginatedResponse<EmotionalState>> {
  const limit = pagination?.limit || 30;
  const cursor = pagination?.cursor;
  const direction = pagination?.direction || 'forward';

  let query = `SELECT * FROM emotional_states WHERE user_id = $1`;
  const params: any[] = [userId];

  if (cursor) {
    query += ` AND timestamp ${direction === 'forward' ? '<' : '>'} $2`;
    params.push(new Date(cursor));
  }

  query += ` ORDER BY timestamp ${direction === 'forward' ? 'DESC' : 'ASC'} LIMIT $${params.length + 1}`;
  params.push(limit + 1); // Busca 1 a mais para verificar se há mais itens

  const result = await pool.query(query, params);
  const items = result.rows.slice(0, limit);
  const hasMore = result.rows.length > limit;

  return {
    items,
    nextCursor: items.length > 0 ? items[items.length - 1].timestamp : undefined,
    prevCursor: items.length > 0 ? items[0].timestamp : undefined,
    hasMore
  };
}

interface WeightAdjustmentRequest {
  userId: number;
  algorithm: 'hybrid' | 'content' | 'collaborative';
  adjustment: number | string;
  source: 'explicit' | 'implicit';
}

const recommendationRouter = Router();
const learningSystem = new AdaptiveLearningSystem();

// Middleware para validação
const validateWeightAdjustment = (
  req: Request<{}, {}, Partial<WeightAdjustmentRequest>>,
  res: Response,
  next: NextFunction
): void => {
  const { userId, algorithm, adjustment, source } = req.body;
  
  if (!userId || !algorithm || adjustment === undefined || !source) {
    res.status(400).json({ error: 'Parâmetros inválidos' });
    return;
  }

  next();
};

// Handler para ajuste de pesos
const handleWeightAdjustment = async (
  req: Request<{}, {}, WeightAdjustmentRequest>,
  res: Response
): Promise<void> => {
  try {
    const { userId, algorithm, adjustment, source } = req.body;

    const adjustmentValue = typeof adjustment === 'number' 
      ? adjustment 
      : parseFloat(adjustment as string);

    if (isNaN(adjustmentValue)) {
      res.status(400).json({ error: 'Valor de ajuste inválido' });
      return;
    }

    const adjustmentParams: WeightAdjustmentParams = {
      userId,
      hybridDelta: algorithm === 'hybrid' ? adjustmentValue : 0,
      contentDelta: algorithm === 'content' ? adjustmentValue : 0,
      collaborativeDelta: algorithm === 'collaborative' ? adjustmentValue : 0
    };

    learningSystem.applyAdjustment(adjustmentParams);

    await updateDatabaseWeights(userId, algorithm, adjustmentValue);

    res.json({ 
      success: true,
      newWeights: learningSystem.getWeights(userId)
    });
  } catch (error) {
    console.error('Erro ao ajustar pesos:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Rota com tipagem explícita
recommendationRouter.post<{}, {}, WeightAdjustmentRequest>(
  '/adjust-weights',
  validateWeightAdjustment,
  handleWeightAdjustment
);


// Middleware para validação de estado emocional
const validateEmotionalState = (
  req: Request<{}, {}, Partial<EmotionalStateInput>>,
  res: Response,
  next: NextFunction
): void => {
  const { userId, valence, arousal, dominance, source } = req.body;
  
  if (!userId || valence === undefined || arousal === undefined ||
      dominance === undefined || !source) {
    res.status(400).json({ error: 'Parâmetros inválidos' });
    return;
  }

  next();
};

// Handler para registro de estado emocional
const handleEmotionalState = async (
  req: Request<{}, {}, EmotionalStateInput>,
  res: Response
): Promise<void> => {
  try {
    const { userId, valence, arousal, dominance, source, timestamp } = req.body;

    const emotionalState: EmotionalStateInput = {
      userId,
      valence,
      arousal,
      dominance,
      source,
      timestamp: timestamp || new Date()
    };

    const savedState = await saveEmotionalState({
      ...emotionalState,
      timestamp: emotionalState.timestamp || new Date()
    });

    res.json({
      success: true,
      emotionalState: savedState
    });
  } catch (error) {
    console.error('Erro ao registrar estado emocional:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Handler para obter perfil emocional
const handleGetEmotionalProfile = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'ID de usuário inválido' });
      return;
    }

    const profile = await getEmotionalProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error('Erro ao obter perfil emocional:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Handler para obter histórico emocional
const handleGetEmotionalHistory = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'ID de usuário inválido' });
      return;
    }

    const { limit = '10', cursor, direction = 'forward' } = req.query;
    const pagination: PaginationParams = {
      limit: parseInt(limit as string),
      cursor: cursor as string | undefined,
      direction: direction as 'forward' | 'backward'
    };
    const history = await getEmotionalHistory(userId, pagination);
    res.json(history);
  } catch (error) {
    console.error('Erro ao obter histórico emocional:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Rotas para estados emocionais
recommendationRouter.post<{}, {}, EmotionalStateInput>(
  '/emotional-states',
  validateEmotionalState,
  handleEmotionalState
);

recommendationRouter.get<{ userId: string }>(
  '/emotional-profile/:userId',
  handleGetEmotionalProfile
);

recommendationRouter.get<{ userId: string }>(
  '/emotional-history/:userId',
  handleGetEmotionalHistory
);

async function updateDatabaseWeights(userId: number, algorithm: string, delta: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const query = `
      SELECT safe_adjust_weights(
        $1, 
        CASE WHEN $2 = 'hybrid' THEN $3 ELSE 0 END,
        CASE WHEN $2 = 'content' THEN $3 ELSE 0 END, 
        CASE WHEN $2 = 'collaborative' THEN $3 ELSE 0 END
      )
    `;
    
    await client.query(query, [userId, algorithm, delta]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Handler para invalidação de cache
const handleCacheInvalidation = async (
  req: Request<{}, {}, { userId: number, targetUserId?: number }>,
  res: Response
): Promise<void> => {
  try {
    const { userId, targetUserId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'ID de usuário é obrigatório' });
      return;
    }

    // Disparar evento de invalidação
    learningSystem.invalidateCache({
      userId,
      targetUserId,
      strategy: targetUserId ? 'immediate' : 'delayed',
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Cache invalidado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao invalidar cache:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Rota para invalidação de cache
recommendationRouter.post<{}, {}, { userId: number, targetUserId?: number }>(
  '/invalidate-cache',
  handleCacheInvalidation
);


// Handler para feedback emocional
const handleEmotionalFeedback = async (
  req: Request<{}, {}, { userId: number; emotionalState: EmotionalState }>,
  res: Response
): Promise<void> => {
  try {
    const { userId, emotionalState } = req.body;
    
    const success = await learningSystem.applyEmotionalAdjustments(userId, emotionalState);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Ajuste emocional não aplicado' });
    }
  } catch (error) {
    console.error('Erro ao processar feedback emocional:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Handler para obter perfil emocional
const handleGetEmotionalProfileV2 = async (
  req: Request<{ userId: string }>,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'ID de usuário inválido' });
      return;
    }

    const profile = await learningSystem.getEmotionalContext(userId);
    res.json(profile);
  } catch (error) {
    console.error('Erro ao obter perfil emocional:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Registrar novas rotas
// Middleware para validação de feedback emocional
const validateEmotionalFeedback = (
  req: Request<{}, {}, { userId: number; emotionalState: EmotionalState }>,
  res: Response,
  next: NextFunction
): void => {
  const { userId, emotionalState } = req.body;
  
  if (!userId || !emotionalState ||
      emotionalState.valence === undefined ||
      emotionalState.arousal === undefined ||
      emotionalState.dominance === undefined) {
    res.status(400).json({ error: 'Parâmetros inválidos' });
    return;
  }

  next();
};

// Rotas emocionais
recommendationRouter.post<{}, {}, { userId: number; emotionalState: EmotionalState }>(
  '/emotional/feedback',
  validateEmotionalFeedback,
  handleEmotionalFeedback
);

recommendationRouter.get<{ userId: string }>(
  '/emotional/profile/:userId',
  handleGetEmotionalProfileV2
);

export default recommendationRouter;