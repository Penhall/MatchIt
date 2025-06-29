# 🚀 Plano de Implementação Completo - MatchIt
## Roadmap Detalhado para Finalizar Fases 0, 1 e 2

---

## 🎯 **ESTRATÉGIA DE IMPLEMENTAÇÃO**

### **Abordagem Priorizada:**
1. **🔥 Finalizar Fase 0**: Base estável para desenvolvimento
2. **🚀 Implementar Fase 1**: Core do produto (torneios 2x2)
3. **📈 Desenvolver Fase 2**: Diferencial competitivo (IA emocional)

### **Cronograma Estimado:**
- **Fase 0**: 3-5 dias
- **Fase 1**: 14-18 dias  
- **Fase 2**: 10-14 dias
- **Total**: 4-6 semanas para MVP completo

---

## 🔥 **FASE 0: FINALIZAÇÃO CRÍTICA**
### **Prazo**: 3-5 dias | **Prioridade**: 🔴 **CRÍTICA**

### **🎯 Objetivo:** 
Transformar endpoints mockados em funcionalidades reais conectadas ao banco de dados.

### **📋 Tarefas Prioritárias:**

#### **Tarefa 1.1: Endpoints de Perfil Funcionais** (2 dias)
```bash
# Arquivos a implementar/corrigir:
- server/services/profileService.js     # Lógica de negócio real
- server/routes/profile.js              # Endpoints completos  
- database/migrations/004_fix_profile_schema.sql  # Schema atualizado
```

**Implementações específicas:**
```javascript
// server/services/profileService.js - IMPLEMENTAR
export class ProfileService {
    // Salvar preferências reais no banco
    async saveStylePreferences(userId, preferences) {
        // Conectar com PostgreSQL
        // Validar dados de entrada
        // Persistir no banco
        // Retornar resultado
    }
    
    // Carregar preferências do banco
    async getStylePreferences(userId) {
        // Buscar no banco real
        // Formatar dados
        // Aplicar fallbacks
    }
    
    // Atualizar perfil completo
    async updateUserProfile(userId, profileData) {
        // Validação completa
        // Update transacional
        // Log de auditoria
    }
}
```

**Endpoints a corrigir:**
```javascript
// server/routes/profile.js - CORRIGIR
GET    /api/profile                     # Dados reais do banco
GET    /api/profile/style-preferences   # Preferências reais
PUT    /api/profile/style-preferences   # Salvar no banco
POST   /api/profile/style-preferences   # Criar novas preferências
DELETE /api/profile/style-preferences   # Limpar preferências
```

#### **Tarefa 1.2: Schema de Banco Completo** (1 dia)
```sql
-- database/migrations/004_complete_profile_schema.sql
-- Criar/corrigir tabelas necessárias:

-- Tabela de preferências de estilo
CREATE TABLE IF NOT EXISTS user_style_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    preference_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Tabela de escolhas de estilo (para análise)
CREATE TABLE IF NOT EXISTS style_choices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(100),
    option_a_id INTEGER,
    option_b_id INTEGER,
    chosen_option_id INTEGER,
    category VARCHAR(50),
    response_time_ms INTEGER,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_style_prefs_user_id ON user_style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_session_id ON style_choices(session_id);
```

#### **Tarefa 1.3: Validação e Testes** (1-2 dias)
```bash
# Criar scripts de teste
- scripts/test-phase0-complete.sh      # Teste automatizado
- scripts/validate-endpoints.sh       # Validação de API
- scripts/seed-test-data.sh           # Dados de teste
```

**Script de teste completo:**
```bash
#!/bin/bash
# scripts/test-phase0-complete.sh

echo "🧪 Testando Fase 0 Completa..."

# Teste 1: Health checks
curl -s http://localhost:3000/api/health | jq '.status'

# Teste 2: Perfil básico  
curl -s -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer test-token" | jq '.success'

# Teste 3: Salvar preferências
curl -s -X PUT http://localhost:3000/api/profile/style-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "categories": {
      "colors": {"warm": 0.8, "cool": 0.2},
      "styles": {"casual": 0.7, "formal": 0.3}
    }
  }' | jq '.success'

# Teste 4: Carregar preferências
curl -s -X GET http://localhost:3000/api/profile/style-preferences \
  -H "Authorization: Bearer test-token" | jq '.data'

echo "✅ Fase 0 testada!"
```

---

## 🚀 **FASE 1: SISTEMA DE TORNEIOS COMPLETO**
### **Prazo**: 14-18 dias | **Prioridade**: 🔴 **CRÍTICA**

### **🎯 Objetivo:**
Implementar o sistema completo de torneios 2x2 que é o core do produto.

### **📋 Implementação por Etapas:**

#### **Etapa 1.1: Schema de Banco Completo** (2-3 dias)
```sql
-- database/migrations/005_complete_tournament_schema.sql

-- Tabela de imagens para torneios
CREATE TABLE tournament_images (
    id SERIAL PRIMARY KEY,
    category tournament_category_enum NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    approved BOOLEAN DEFAULT false,
    upload_date TIMESTAMP DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES users(id),
    file_size INTEGER,
    dimensions JSONB,
    win_rate DECIMAL(5,2) DEFAULT 0.0,
    total_views INTEGER DEFAULT 0,
    total_selections INTEGER DEFAULT 0
);

-- Tabela de sessões de torneio
CREATE TABLE tournament_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    category tournament_category_enum NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
    tournament_size INTEGER DEFAULT 16,
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER,
    remaining_images INTEGER[] DEFAULT '{}',
    eliminated_images INTEGER[] DEFAULT '{}',
    current_matchup INTEGER[2],
    matchup_sequence INTEGER DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    session_duration_minutes INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- Tabela de escolhas/decisões
CREATE TABLE tournament_choices (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES tournament_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    matchup_sequence INTEGER NOT NULL,
    option_a_id INTEGER REFERENCES tournament_images(id),
    option_b_id INTEGER REFERENCES tournament_images(id),
    winner_id INTEGER REFERENCES tournament_images(id),
    loser_id INTEGER REFERENCES tournament_images(id),
    response_time_ms INTEGER,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    is_speed_bonus BOOLEAN DEFAULT false,
    chosen_at TIMESTAMP DEFAULT NOW(),
    user_id INTEGER REFERENCES users(id) -- Denormalização para queries
);

-- Tabela de resultados finais
CREATE TABLE tournament_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES tournament_sessions(id),
    user_id INTEGER REFERENCES users(id),
    category tournament_category_enum,
    champion_id INTEGER REFERENCES tournament_images(id),
    finalist_id INTEGER REFERENCES tournament_images(id),
    semifinalists INTEGER[] DEFAULT '{}',
    top_choices INTEGER[] DEFAULT '{}',
    elimination_order INTEGER[] DEFAULT '{}',
    preference_strength DECIMAL(3,2),
    consistency_score DECIMAL(3,2),
    decision_speed_avg INTEGER,
    total_choices_made INTEGER,
    rounds_completed INTEGER,
    session_duration_minutes INTEGER,
    completion_rate DECIMAL(3,2),
    style_profile JSONB,
    dominant_preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enum para categorias
CREATE TYPE tournament_category_enum AS ENUM (
    'colors', 'styles', 'accessories', 'shoes', 'patterns',
    'casual_wear', 'formal_wear', 'party_wear', 'jewelry', 'bags'
);

-- Índices para performance
CREATE INDEX idx_tournament_images_category_active ON tournament_images(category, active, approved);
CREATE INDEX idx_tournament_sessions_user_status ON tournament_sessions(user_id, status);
CREATE INDEX idx_tournament_choices_session ON tournament_choices(session_id, round_number);
CREATE INDEX idx_tournament_results_user_category ON tournament_results(user_id, category);
```

#### **Etapa 1.2: TournamentEngine Completo** (4-5 dias)
```javascript
// server/services/TournamentEngine.js - IMPLEMENTAÇÃO COMPLETA
import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class TournamentEngine {
    
    constructor() {
        this.activeSessions = new Map();
        this.categories = [
            'colors', 'styles', 'accessories', 'shoes', 'patterns',
            'casual_wear', 'formal_wear', 'party_wear', 'jewelry', 'bags'
        ];
    }
    
    /**
     * Iniciar novo torneio com imagens reais do banco
     */
    async startTournament(userId, category, tournamentSize = 16) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Verificar sessão ativa existente
            const existingSession = await this.getActiveSession(userId, category);
            if (existingSession) {
                await client.query('ROLLBACK');
                return { 
                    sessionId: existingSession.id, 
                    resumed: true,
                    currentMatch: await this.getCurrentMatchup(existingSession.id)
                };
            }
            
            // 2. Buscar imagens aprovadas da categoria
            const imageQuery = `
                SELECT id, image_url, thumbnail_url, title, description, tags
                FROM tournament_images 
                WHERE category = $1 AND active = true AND approved = true
                ORDER BY RANDOM()
                LIMIT $2
            `;
            const imagesResult = await client.query(imageQuery, [category, tournamentSize]);
            
            if (imagesResult.rows.length < tournamentSize) {
                throw new Error(`Insuficientes imagens aprovadas para categoria ${category}. Necessário: ${tournamentSize}, Disponível: ${imagesResult.rows.length}`);
            }
            
            // 3. Criar sessão de torneio
            const sessionId = `tournament_${userId}_${Date.now()}_${uuidv4().slice(0, 8)}`;
            const images = imagesResult.rows;
            const totalRounds = Math.log2(tournamentSize);
            
            const sessionQuery = `
                INSERT INTO tournament_sessions (
                    id, user_id, category, tournament_size, total_rounds,
                    remaining_images, status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
                RETURNING *
            `;
            
            const remainingImageIds = images.map(img => img.id);
            const sessionResult = await client.query(sessionQuery, [
                sessionId, userId, category, tournamentSize, totalRounds,
                remainingImageIds
            ]);
            
            // 4. Gerar primeiro confronto
            const firstMatchup = this.generateMatchup(images);
            
            await client.query(`
                UPDATE tournament_sessions 
                SET current_matchup = $1, last_activity = NOW()
                WHERE id = $2
            `, [firstMatchup.ids, sessionId]);
            
            await client.query('COMMIT');
            
            return {
                sessionId,
                category,
                tournamentSize,
                currentRound: 1,
                totalRounds,
                currentMatch: firstMatchup,
                progress: 0
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Processar escolha do usuário
     */
    async processChoice(sessionId, winnerId, responseTime = null) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Buscar sessão ativa
            const sessionQuery = `
                SELECT * FROM tournament_sessions 
                WHERE id = $1 AND status = 'active'
            `;
            const sessionResult = await client.query(sessionQuery, [sessionId]);
            
            if (sessionResult.rows.length === 0) {
                throw new Error('Sessão de torneio não encontrada ou inativa');
            }
            
            const session = sessionResult.rows[0];
            const [optionAId, optionBId] = session.current_matchup;
            const loserId = optionAId === winnerId ? optionBId : optionAId;
            
            // 2. Registrar escolha
            await client.query(`
                INSERT INTO tournament_choices (
                    session_id, round_number, matchup_sequence,
                    option_a_id, option_b_id, winner_id, loser_id,
                    response_time_ms, user_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                sessionId, session.current_round, session.matchup_sequence,
                optionAId, optionBId, winnerId, loserId,
                responseTime, session.user_id
            ]);
            
            // 3. Atualizar listas de imagens
            const newRemaining = session.remaining_images.filter(id => id !== loserId);
            
            // 4. Verificar se acabou o round
            if (newRemaining.length === 1) {
                // Torneio terminado!
                await this.completeTournament(client, session, newRemaining[0]);
                await client.query('COMMIT');
                
                return {
                    completed: true,
                    champion: newRemaining[0],
                    sessionId
                };
            }
            
            // 5. Gerar próximo confronto
            const nextMatchup = await this.generateNextMatchup(client, sessionId, newRemaining, session.current_round);
            
            await client.query('COMMIT');
            
            return {
                completed: false,
                sessionId,
                currentMatch: nextMatchup,
                progress: this.calculateProgress(session.tournament_size, newRemaining.length)
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Gerar confronto inteligente
     */
    generateMatchup(images) {
        if (images.length < 2) {
            throw new Error('Insuficientes imagens para confronto');
        }
        
        // Algoritmo de pareamento inteligente
        // Priorizar imagens com win_rate similar para confrontos equilibrados
        const sorted = [...images].sort((a, b) => (a.win_rate || 0) - (b.win_rate || 0));
        
        const imageA = sorted[0];
        const imageB = sorted[1];
        
        return {
            ids: [imageA.id, imageB.id],
            imageA: {
                id: imageA.id,
                url: imageA.image_url,
                thumbnail: imageA.thumbnail_url,
                title: imageA.title,
                description: imageA.description
            },
            imageB: {
                id: imageB.id,
                url: imageB.image_url,
                thumbnail: imageB.thumbnail_url,
                title: imageB.title,
                description: imageB.description
            }
        };
    }
    
    /**
     * Finalizar torneio e gerar resultados
     */
    async completeTournament(client, session, championId) {
        // 1. Buscar todas as escolhas da sessão
        const choicesQuery = `
            SELECT * FROM tournament_choices 
            WHERE session_id = $1 
            ORDER BY round_number, matchup_sequence
        `;
        const choicesResult = await client.query(choicesQuery, [session.id]);
        const choices = choicesResult.rows;
        
        // 2. Calcular métricas
        const totalChoices = choices.length;
        const avgResponseTime = choices.reduce((sum, choice) => sum + (choice.response_time_ms || 0), 0) / totalChoices;
        const consistencyScore = this.calculateConsistencyScore(choices);
        const preferenceStrength = this.calculatePreferenceStrength(choices);
        
        // 3. Gerar perfil de estilo
        const styleProfile = await this.generateStyleProfile(client, session.user_id, session.category, choices);
        
        // 4. Salvar resultado final
        await client.query(`
            INSERT INTO tournament_results (
                session_id, user_id, category, champion_id,
                preference_strength, consistency_score, decision_speed_avg,
                total_choices_made, rounds_completed, session_duration_minutes,
                completion_rate, style_profile
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
            session.id, session.user_id, session.category, championId,
            preferenceStrength, consistencyScore, avgResponseTime,
            totalChoices, session.current_round, 
            Math.round((Date.now() - new Date(session.started_at)) / 60000),
            1.0, styleProfile
        ]);
        
        // 5. Marcar sessão como completa
        await client.query(`
            UPDATE tournament_sessions 
            SET status = 'completed', completed_at = NOW()
            WHERE id = $1
        `, [session.id]);
        
        // 6. Atualizar estatísticas das imagens
        await this.updateImageStats(client, choices);
    }
    
    // Métodos auxiliares de cálculo...
    calculateProgress(tournamentSize, remaining) {
        return Math.round(((tournamentSize - remaining) / (tournamentSize - 1)) * 100);
    }
    
    calculateConsistencyScore(choices) {
        // Implementar lógica de consistência baseada em padrões de escolha
        return Math.random() * 0.5 + 0.5; // Placeholder
    }
    
    calculatePreferenceStrength(choices) {
        // Implementar lógica de força de preferência baseada em tempo de resposta
        return Math.random() * 0.5 + 0.5; // Placeholder  
    }
    
    async generateStyleProfile(client, userId, category, choices) {
        // Implementar geração de perfil baseada nas escolhas
        return {
            category,
            dominantTags: [],
            preferenceVector: {},
            confidence: 0.8
        };
    }
    
    async updateImageStats(client, choices) {
        // Atualizar win_rate, total_views, total_selections das imagens
        for (const choice of choices) {
            // Incrementar views para ambas as imagens
            await client.query(`
                UPDATE tournament_images 
                SET total_views = total_views + 1
                WHERE id IN ($1, $2)
            `, [choice.option_a_id, choice.option_b_id]);
            
            // Incrementar selections para vencedora
            await client.query(`
                UPDATE tournament_images 
                SET total_selections = total_selections + 1,
                    win_rate = (total_selections::float / GREATEST(total_views, 1)) * 100
                WHERE id = $1
            `, [choice.winner_id]);
        }
    }
}
```

#### **Etapa 1.3: Endpoints de Torneio Completos** (2-3 dias)
```javascript
// server/routes/tournament.js - IMPLEMENTAÇÃO COMPLETA
import express from 'express';
import { TournamentEngine } from '../services/TournamentEngine.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const tournamentEngine = new TournamentEngine();

/**
 * GET /api/tournament/categories
 * Listar categorias disponíveis com estatísticas
 */
router.get('/categories', async (req, res) => {
    try {
        const categoriesQuery = `
            SELECT 
                category,
                COUNT(*) as total_images,
                COUNT(CASE WHEN approved = true THEN 1 END) as approved_images,
                AVG(win_rate) as avg_win_rate
            FROM tournament_images 
            WHERE active = true
            GROUP BY category
            ORDER BY category
        `;
        
        const result = await pool.query(categoriesQuery);
        
        res.json({
            success: true,
            categories: result.rows,
            total: result.rows.length
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
        
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Categoria é obrigatória'
            });
        }
        
        const result = await tournamentEngine.startTournament(userId, category, tournamentSize);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar torneio:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/tournament/choice
 * Processar escolha do usuário
 */
router.post('/choice', authMiddleware, async (req, res) => {
    try {
        const { sessionId, winnerId, responseTime } = req.body;
        
        if (!sessionId || !winnerId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId e winnerId são obrigatórios'
            });
        }
        
        const result = await tournamentEngine.processChoice(sessionId, winnerId, responseTime);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar escolha:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tournament/results/:sessionId
 * Buscar resultados de torneio
 */
router.get('/results/:sessionId', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        const resultQuery = `
            SELECT tr.*, ti.image_url as champion_image, ti.title as champion_title
            FROM tournament_results tr
            LEFT JOIN tournament_images ti ON tr.champion_id = ti.id
            WHERE tr.session_id = $1 AND tr.user_id = $2
        `;
        
        const result = await pool.query(resultQuery, [sessionId, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Resultado de torneio não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar resultado:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar resultado do torneio'
        });
    }
});

/**
 * GET /api/tournament/history
 * Histórico de torneios do usuário
 */
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, limit = 10, offset = 0 } = req.query;
        
        let historyQuery = `
            SELECT 
                ts.id, ts.category, ts.status, ts.started_at, ts.completed_at,
                tr.champion_id, ti.image_url as champion_image, ti.title as champion_title,
                tr.preference_strength, tr.consistency_score
            FROM tournament_sessions ts
            LEFT JOIN tournament_results tr ON ts.id = tr.session_id
            LEFT JOIN tournament_images ti ON tr.champion_id = ti.id
            WHERE ts.user_id = $1
        `;
        
        const params = [userId];
        
        if (category) {
            historyQuery += ` AND ts.category = $${params.length + 1}`;
            params.push(category);
        }
        
        historyQuery += ` ORDER BY ts.started_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const result = await pool.query(historyQuery, params);
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: result.rows.length
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar histórico de torneios'
        });
    }
});

export default router;
```

#### **Etapa 1.4: Interface Frontend Gamificada** (4-5 dias)
```typescript
// screens/TournamentScreen.tsx - INTERFACE 2x2 COMPLETA
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { useTournament } from '../hooks/useTournament';

interface TournamentMatch {
    imageA: {
        id: number;
        url: string;
        title: string;
        description: string;
    };
    imageB: {
        id: number;
        url: string;
        title: string;
        description: string;
    };
}

export const TournamentScreen: React.FC = () => {
    const {
        currentMatch,
        progress,
        isLoading,
        makeChoice,
        startTournament,
        tournamentResult
    } = useTournament();
    
    const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);
    const [animationValue] = useState(new Animated.Value(0));
    const [responseStartTime, setResponseStartTime] = useState<number>(Date.now());
    
    // Animação de entrada das imagens
    useEffect(() => {
        if (currentMatch) {
            setResponseStartTime(Date.now());
            Animated.spring(animationValue, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8
            }).start();
        }
    }, [currentMatch]);
    
    const handleChoice = async (side: 'A' | 'B') => {
        if (selectedSide || !currentMatch) return;
        
        setSelectedSide(side);
        const responseTime = Date.now() - responseStartTime;
        const winnerId = side === 'A' ? currentMatch.imageA.id : currentMatch.imageB.id;
        
        // Animação de escolha
        Animated.sequence([
            Animated.timing(animationValue, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(animationValue, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => {
            setSelectedSide(null);
            animationValue.setValue(0);
        });
        
        try {
            await makeChoice(winnerId, responseTime);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível processar sua escolha. Tente novamente.');
            setSelectedSide(null);
        }
    };
    
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Preparando torneio...</Text>
            </View>
        );
    }
    
    if (tournamentResult) {
        return (
            <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>🏆 Torneio Concluído!</Text>
                <Image source={{ uri: tournamentResult.championImage }} style={styles.championImage} />
                <Text style={styles.championTitle}>{tournamentResult.championTitle}</Text>
                <Text style={styles.resultStats}>
                    Força de Preferência: {(tournamentResult.preferenceStrength * 100).toFixed(1)}%
                </Text>
                <Text style={styles.resultStats}>
                    Consistência: {(tournamentResult.consistencyScore * 100).toFixed(1)}%
                </Text>
                <TouchableOpacity
                    style={styles.newTournamentButton}
                    onPress={() => startTournament('colors')}
                >
                    <Text style={styles.newTournamentButtonText}>Novo Torneio</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    if (!currentMatch) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Escolha uma categoria:</Text>
                {/* Implementar seleção de categoria */}
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            {/* Barra de Progresso */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Progresso: {progress}%</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>
            
            {/* Título da Batalha */}
            <Text style={styles.battleTitle}>Qual você prefere?</Text>
            
            {/* Container das Imagens 2x2 */}
            <Animated.View
                style={[
                    styles.matchContainer,
                    {
                        opacity: animationValue,
                        transform: [
                            {
                                scale: animationValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1]
                                })
                            }
                        ]
                    }
                ]}
            >
                {/* Lado A */}
                <TouchableOpacity
                    style={[
                        styles.imageContainer,
                        styles.imageA,
                        selectedSide === 'A' && styles.selectedContainer
                    ]}
                    onPress={() => handleChoice('A')}
                    activeOpacity={0.8}
                >
                    <Image
                        source={{ uri: currentMatch.imageA.url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                        <Text style={styles.imageTitle}>{currentMatch.imageA.title}</Text>
                    </View>
                    {selectedSide === 'A' && (
                        <View style={styles.selectionIndicator}>
                            <Text style={styles.selectionText}>✓</Text>
                        </View>
                    )}
                </TouchableOpacity>
                
                {/* VS */}
                <View style={styles.vsContainer}>
                    <Text style={styles.vsText}>VS</Text>
                </View>
                
                {/* Lado B */}
                <TouchableOpacity
                    style={[
                        styles.imageContainer,
                        styles.imageB,
                        selectedSide === 'B' && styles.selectedContainer
                    ]}
                    onPress={() => handleChoice('B')}
                    activeOpacity={0.8}
                >
                    <Image
                        source={{ uri: currentMatch.imageB.url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                        <Text style={styles.imageTitle}>{currentMatch.imageB.title}</Text>
                    </View>
                    {selectedSide === 'B' && (
                        <View style={styles.selectionIndicator}>
                            <Text style={styles.selectionText}>✓</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
            
            {/* Instruções */}
            <Text style={styles.instructions}>
                Toque na imagem que mais combina com seu estilo
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20
    },
    progressContainer: {
        marginBottom: 20
    },
    progressText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007bff',
        borderRadius: 4
    },
    battleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 30
    },
    matchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    imageContainer: {
        width: '42%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        position: 'relative'
    },
    imageA: {
        marginRight: 8
    },
    imageB: {
        marginLeft: 8
    },
    selectedContainer: {
        borderWidth: 3,
        borderColor: '#007bff'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12
    },
    imageTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    },
    selectionIndicator: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#007bff',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectionText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    vsContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '14%'
    },
    vsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6c757d'
    },
    instructions: {
        fontSize: 16,
        textAlign: 'center',
        color: '#6c757d',
        marginTop: 20
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    loadingText: {
        fontSize: 18,
        color: '#6c757d'
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30
    },
    championImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 20
    },
    championTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center'
    },
    resultStats: {
        fontSize: 16,
        color: '#6c757d',
        marginBottom: 8
    },
    newTournamentButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 30
    },
    newTournamentButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
```

#### **Etapa 1.5: Admin Panel para Imagens** (2-3 dias)
```typescript
// screens/AdminTournamentPanel.tsx - PAINEL ADMINISTRATIVO
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { useAdminTournament } from '../hooks/useAdminTournament';

export const AdminTournamentPanel: React.FC = () => {
    const {
        images,
        categories,
        uploadImage,
        approveImage,
        deleteImage,
        updateImage,
        loadImages
    } = useAdminTournament();
    
    const [selectedCategory, setSelectedCategory] = useState<string>('colors');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
    
    useEffect(() => {
        loadImages(selectedCategory, filter);
    }, [selectedCategory, filter]);
    
    const handleApprove = async (imageId: number) => {
        try {
            await approveImage(imageId);
            Alert.alert('Sucesso', 'Imagem aprovada!');
            loadImages(selectedCategory, filter);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível aprovar a imagem');
        }
    };
    
    const handleDelete = (imageId: number) => {
        Alert.alert(
            'Confirmar',
            'Tem certeza que deseja deletar esta imagem?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Deletar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteImage(imageId);
                            Alert.alert('Sucesso', 'Imagem deletada!');
                            loadImages(selectedCategory, filter);
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível deletar a imagem');
                        }
                    }
                }
            ]
        );
    };
    
    const renderImage = ({ item }: { item: any }) => (
        <View style={styles.imageCard}>
            <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
            <View style={styles.imageInfo}>
                <Text style={styles.imageTitle}>{item.title}</Text>
                <Text style={styles.imageStatus}>
                    Status: {item.approved ? '✅ Aprovada' : '⏳ Pendente'}
                </Text>
                <Text style={styles.imageStats}>
                    Views: {item.total_views} | Seleções: {item.total_selections}
                </Text>
                <Text style={styles.imageStats}>
                    Win Rate: {(item.win_rate || 0).toFixed(1)}%
                </Text>
            </View>
            <View style={styles.imageActions}>
                {!item.approved && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApprove(item.id)}
                    >
                        <Text style={styles.actionButtonText}>Aprovar</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Text style={styles.actionButtonText}>Deletar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
    
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin - Gerenciar Imagens</Text>
            
            {/* Filtros */}
            <View style={styles.filtersContainer}>
                <View style={styles.categorySelector}>
                    {categories.map(category => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category && styles.categoryButtonActive
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.categoryButtonText,
                                selectedCategory === category && styles.categoryButtonTextActive
                            ]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                <View style={styles.statusFilter}>
                    {['all', 'pending', 'approved'].map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterButton,
                                filter === status && styles.filterButtonActive
                            ]}
                            onPress={() => setFilter(status as any)}
                        >
                            <Text style={styles.filterButtonText}>
                                {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendentes' : 'Aprovadas'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            
            {/* Upload Button */}
            <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => {/* Implementar upload */}}
            >
                <Text style={styles.uploadButtonText}>+ Adicionar Imagens</Text>
            </TouchableOpacity>
            
            {/* Lista de Imagens */}
            <FlatList
                data={images}
                renderItem={renderImage}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.imagesList}
            />
        </View>
    );
};

// Styles...
const styles = StyleSheet.create({
    // Implementar estilos completos
});
```

---

## 📈 **FASE 2: PERFIL EMOCIONAL E IA**
### **Prazo**: 10-14 dias | **Prioridade**: 🟡 **ALTA**

### **🎯 Objetivo:**
Implementar sistema completo de compatibilidade emocional para diferencial competitivo.

### **📋 Implementação:**

#### **Etapa 2.1: Schema Completo Perfil Emocional** (2 dias)
```sql
-- database/migrations/006_complete_emotional_profile.sql
-- (Schema já existe, revisar e otimizar)
```

#### **Etapa 2.2: Questionário Emocional** (3-4 dias)
```typescript
// screens/EmotionalProfileScreen.tsx
// Implementar questionário interativo com 25-30 perguntas
```

#### **Etapa 2.3: Motor de Compatibilidade Emocional** (4-5 dias)
```javascript
// server/services/EmotionalCompatibilityEngine.js
// Algoritmo de compatibilidade baseado em vetores emocionais
```

#### **Etapa 2.4: Integração com Recomendações** (2-3 dias)
```javascript
// Integrar score emocional no motor principal de recomendações
```

---

## 🧪 **FASE DE TESTES E VALIDAÇÃO**
### **Prazo**: 5-7 dias | **Prioridade**: 🟡 **IMPORTANTE**

### **📋 Testes a Implementar:**

#### **Testes Automatizados:**
```bash
# scripts/test-complete-system.sh
- Testes de unidade para TournamentEngine
- Testes de integração para API
- Testes de performance para banco de dados
- Testes de UI para componentes críticos
```

#### **Testes Manuais:**
```bash
# Cenários de teste completos
- Fluxo completo de torneio
- Múltiplos usuários simultâneos
- Upload e aprovação de imagens
- Geração de perfis de estilo
- Compatibilidade emocional
```

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Fase 0 - Critérios de Aceitação:**
- [ ] ✅ Todos os endpoints retornam dados reais do banco
- [ ] ✅ Tempo de resposta < 500ms para todas as APIs
- [ ] ✅ Dados persistem corretamente no PostgreSQL
- [ ] ✅ Tratamento de erros implementado
- [ ] ✅ Validação de input funcionando

### **Fase 1 - Critérios de Aceitação:**
- [ ] ✅ Torneio completo 16→8→4→2→1 funciona
- [ ] ✅ Interface 2x2 responsiva e intuitiva
- [ ] ✅ Admin pode fazer upload e aprovar imagens
- [ ] ✅ Resultados geram perfil de estilo válido
- [ ] ✅ Sistema suporta múltiplas categorias
- [ ] ✅ Estatísticas de imagens atualizadas corretamente

### **Fase 2 - Critérios de Aceitação:**
- [ ] ✅ Questionário emocional completo (25+ perguntas)
- [ ] ✅ Score de compatibilidade emocional calculado
- [ ] ✅ Integração com recomendações funcionando
- [ ] ✅ Perfil emocional visualizado no app
- [ ] ✅ Analytics de compatibilidade disponíveis

---

## 🚀 **PRÓXIMOS PASSOS IMEDIATOS**

### **Esta Semana (Dias 1-7):**
1. 🔥 **Finalizar Fase 0** - Endpoints funcionais
2. 🔥 **Iniciar schema torneios** - Banco de dados
3. 🔥 **Configurar CDN básico** - Sistema de imagens

### **Próxima Semana (Dias 8-14):**
1. 🚀 **TournamentEngine completo** - Lógica principal
2. 🚀 **Interface 2x2 básica** - Frontend funcional
3. 🚀 **Admin panel básico** - Gestão de imagens

### **Terceira Semana (Dias 15-21):**
1. 📈 **Finalizar sistema torneios** - Testes e otimizações
2. 📈 **Iniciar perfil emocional** - Schema e questionário
3. 📈 **Integração frontend-backend** - Fluxos completos

---

## 💡 **RECOMENDAÇÕES FINAIS**

### **Para Garantir Sucesso:**
1. **Foco na Fase 0**: Não avançar até ter base sólida
2. **Testes contínuos**: Testar cada etapa antes de avançar
3. **Documentação**: Documentar APIs conforme implementa
4. **Backup**: Fazer backup antes de mudanças grandes
5. **Monitoramento**: Implementar logs e métricas desde o início

### **Riscos a Mitigar:**
1. **Scope creep**: Manter foco nas funcionalidades essenciais
2. **Performance**: Otimizar banco e queries desde o início
3. **UX**: Testar interface com usuários reais
4. **Escalabilidade**: Pensar em crescimento desde o design

**🎯 Meta**: Sistema MatchIt funcional e diferenciado em 4-6 semanas!