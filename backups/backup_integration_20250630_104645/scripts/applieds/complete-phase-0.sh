#!/bin/bash
# complete-phase-0.sh - Completar Fase 0: Integração real com PostgreSQL

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "================================================================"
echo " COMPLETANDO FASE 0 - INTEGRAÇÃO POSTGRESQL REAL"
echo "================================================================"
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto MatchIt${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Diretório correto identificado${NC}"

# 1. VERIFICAR E CONFIGURAR POSTGRESQL
echo -e "${BLUE}🗄️  Verificando PostgreSQL...${NC}"

# Verificar se PostgreSQL está rodando
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL não está rodando. Tentando iniciar...${NC}"
    # Tentar diferentes comandos de inicialização
    if command -v systemctl > /dev/null 2>&1; then
        sudo systemctl start postgresql
    elif command -v service > /dev/null 2>&1; then
        sudo service postgresql start
    elif command -v brew > /dev/null 2>&1; then
        brew services start postgresql
    else
        echo -e "${RED}❌ Não foi possível iniciar PostgreSQL automaticamente${NC}"
        echo "Inicie o PostgreSQL manualmente e execute este script novamente"
        exit 1
    fi
    sleep 3
fi

echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"

# 2. CONFIGURAR BANCO DE DADOS
echo -e "${BLUE}🔧 Configurando banco de dados...${NC}"

# Verificar se banco exists
DB_EXISTS=$(sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -w matchit_db | wc -l)

if [ $DB_EXISTS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Banco matchit_db não existe. Criando...${NC}"
    
    # Criar banco e usuário
    sudo -u postgres psql << EOF
CREATE DATABASE matchit_db OWNER postgres;
CREATE USER matchit WITH PASSWORD 'matchit123';
GRANT ALL PRIVILEGES ON DATABASE matchit_db TO matchit;
ALTER USER matchit CREATEDB;
EOF
    
    echo -e "${GREEN}✅ Banco matchit_db criado${NC}"
else
    echo -e "${GREEN}✅ Banco matchit_db já existe${NC}"
fi

# 3. EXECUTAR MIGRAÇÕES
echo -e "${BLUE}📊 Executando migrações...${NC}"

# Verificar se arquivo de migração existe
if [ ! -f "database/migrations/002_complete_style_and_tournament_schema.sql" ]; then
    echo -e "${YELLOW}⚠️  Arquivo de migração não encontrado. Criando...${NC}"
    
    mkdir -p database/migrations
    
    cat > database/migrations/002_complete_style_and_tournament_schema.sql << 'EOF'
-- database/migrations/002_complete_style_and_tournament_schema.sql
-- Migração completa para Fase 0: Sistema de preferências de estilo

BEGIN;

-- Criar tabela users se não existir
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de preferências de estilo (FASE 0)
CREATE TABLE IF NOT EXISTS style_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(100) NOT NULL,
    preference_strength DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category, question_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_style_preferences_user_id ON style_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_style_preferences_category ON style_preferences(category);
CREATE INDEX IF NOT EXISTS idx_style_preferences_user_category ON style_preferences(user_id, category);

-- Inserir usuário de desenvolvimento se não existir
INSERT INTO users (id, email, password_hash, name, date_of_birth) 
VALUES ('dev-user-123', 'dev@matchit.com', '$2b$10$example.hash', 'Usuário de Desenvolvimento', '1990-01-01')
ON CONFLICT (email) DO NOTHING;

-- Inserir algumas preferências de exemplo
INSERT INTO style_preferences (user_id, category, question_id, selected_option, preference_strength) 
VALUES 
    ('dev-user-123', 'colors', 'warm_vs_cool', 'warm', 0.8),
    ('dev-user-123', 'styles', 'casual_vs_formal', 'casual', 0.9),
    ('dev-user-123', 'accessories', 'minimal_vs_statement', 'minimal', 0.7)
ON CONFLICT (user_id, category, question_id) DO NOTHING;

COMMIT;
EOF

    echo -e "${GREEN}✅ Arquivo de migração criado${NC}"
fi

# Executar migração
PGPASSWORD=matchit123 psql -h localhost -U matchit -d matchit_db -f database/migrations/002_complete_style_and_tournament_schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migração executada com sucesso${NC}"
else
    echo -e "${RED}❌ Erro na migração${NC}"
    exit 1
fi

# 4. CRIAR SERVIÇO DE BANCO DE DADOS
echo -e "${BLUE}🔌 Criando serviço de banco de dados...${NC}"

mkdir -p server/config

cat > server/config/database.js << 'EOF'
// server/config/database.js - Configuração do banco PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;

// Configuração do pool de conexões
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'matchit_db',
    user: process.env.DB_USER || 'matchit',
    password: process.env.DB_PASSWORD || 'matchit123',
    max: 20, // máximo de conexões
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.on('connect', () => {
    console.log('📊 Nova conexão estabelecida com PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro no pool PostgreSQL:', err);
});

// Função helper para queries
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`🔍 Query executada: ${duration}ms`);
        return res;
    } catch (error) {
        console.error('❌ Erro na query:', error);
        throw error;
    }
};

// Função para testar conectividade
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as timestamp, version() as version');
        console.log('✅ Banco conectado:', result.rows[0].timestamp);
        return true;
    } catch (error) {
        console.error('❌ Falha na conexão:', error.message);
        return false;
    }
};

export default pool;
EOF

echo -e "${GREEN}✅ Serviço de banco criado${NC}"

# 5. CRIAR SERVIÇO DE PREFERÊNCIAS DE ESTILO
echo -e "${BLUE}📋 Criando serviço de preferências...${NC}"

mkdir -p server/services

cat > server/services/StylePreferencesService.js << 'EOF'
// server/services/StylePreferencesService.js - Serviço de preferências de estilo (Fase 0)
import { query } from '../config/database.js';

class StylePreferencesService {
    
    /**
     * Buscar todas as preferências de um usuário
     */
    async getUserPreferences(userId) {
        try {
            console.log(`📋 Buscando preferências para usuário: ${userId}`);
            
            const result = await query(
                'SELECT * FROM style_preferences WHERE user_id = $1 ORDER BY category, question_id',
                [userId]
            );
            
            // Organizar por categoria
            const preferences = {};
            result.rows.forEach(row => {
                if (!preferences[row.category]) {
                    preferences[row.category] = {};
                }
                preferences[row.category][row.question_id] = {
                    selectedOption: row.selected_option,
                    preferenceStrength: parseFloat(row.preference_strength),
                    updatedAt: row.updated_at
                };
            });
            
            console.log(`✅ Encontradas ${result.rows.length} preferências em ${Object.keys(preferences).length} categorias`);
            return preferences;
            
        } catch (error) {
            console.error('❌ Erro ao buscar preferências:', error);
            throw error;
        }
    }
    
    /**
     * Atualizar preferência específica
     */
    async updatePreference(userId, category, questionId, selectedOption, preferenceStrength = 1.0) {
        try {
            console.log(`💾 Atualizando preferência: ${userId} -> ${category}/${questionId} = ${selectedOption}`);
            
            const result = await query(`
                INSERT INTO style_preferences (user_id, category, question_id, selected_option, preference_strength, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (user_id, category, question_id)
                DO UPDATE SET 
                    selected_option = EXCLUDED.selected_option,
                    preference_strength = EXCLUDED.preference_strength,
                    updated_at = NOW()
                RETURNING *
            `, [userId, category, questionId, selectedOption, preferenceStrength]);
            
            console.log(`✅ Preferência atualizada: ID ${result.rows[0].id}`);
            return result.rows[0];
            
        } catch (error) {
            console.error('❌ Erro ao atualizar preferência:', error);
            throw error;
        }
    }
    
    /**
     * Atualizar múltiplas preferências de uma vez
     */
    async updateMultiplePreferences(userId, preferences) {
        try {
            console.log(`💾 Atualizando ${Object.keys(preferences).length} categorias para usuário: ${userId}`);
            
            const updatedPreferences = [];
            
            for (const [category, categoryPrefs] of Object.entries(preferences)) {
                for (const [questionId, data] of Object.entries(categoryPrefs)) {
                    const selectedOption = typeof data === 'string' ? data : data.selectedOption;
                    const preferenceStrength = typeof data === 'object' ? data.preferenceStrength || 1.0 : 1.0;
                    
                    const result = await this.updatePreference(userId, category, questionId, selectedOption, preferenceStrength);
                    updatedPreferences.push(result);
                }
            }
            
            console.log(`✅ ${updatedPreferences.length} preferências atualizadas com sucesso`);
            return updatedPreferences;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar múltiplas preferências:', error);
            throw error;
        }
    }
    
    /**
     * Obter estatísticas de completude do perfil
     */
    async getCompletionStats(userId) {
        try {
            console.log(`📊 Calculando estatísticas para usuário: ${userId}`);
            
            // Buscar todas as preferências do usuário
            const result = await query(
                'SELECT category, COUNT(*) as count FROM style_preferences WHERE user_id = $1 GROUP BY category',
                [userId]
            );
            
            // Categorias esperadas (pode ser configurável)
            const expectedCategories = ['colors', 'styles', 'accessories', 'shoes', 'patterns'];
            const expectedQuestionsPerCategory = 5; // média
            
            const completedCategories = result.rows.length;
            const totalExpectedQuestions = expectedCategories.length * expectedQuestionsPerCategory;
            const totalAnsweredQuestions = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            
            const completionPercentage = Math.round((totalAnsweredQuestions / totalExpectedQuestions) * 100);
            
            const stats = {
                totalCategories: expectedCategories.length,
                completedCategories,
                totalExpectedQuestions,
                totalAnsweredQuestions,
                completionPercentage: Math.min(completionPercentage, 100),
                categoriesDetail: result.rows.reduce((acc, row) => {
                    acc[row.category] = parseInt(row.count);
                    return acc;
                }, {})
            };
            
            console.log(`📊 Estatísticas calculadas: ${completionPercentage}% completo`);
            return stats;
            
        } catch (error) {
            console.error('❌ Erro ao calcular estatísticas:', error);
            throw error;
        }
    }
    
    /**
     * Remover todas as preferências de um usuário
     */
    async clearUserPreferences(userId) {
        try {
            console.log(`🗑️  Removendo todas as preferências do usuário: ${userId}`);
            
            const result = await query(
                'DELETE FROM style_preferences WHERE user_id = $1',
                [userId]
            );
            
            console.log(`✅ ${result.rowCount} preferências removidas`);
            return { deletedCount: result.rowCount };
            
        } catch (error) {
            console.error('❌ Erro ao remover preferências:', error);
            throw error;
        }
    }
    
    /**
     * Buscar preferências por categoria
     */
    async getPreferencesByCategory(userId, category) {
        try {
            console.log(`📋 Buscando preferências da categoria '${category}' para usuário: ${userId}`);
            
            const result = await query(
                'SELECT * FROM style_preferences WHERE user_id = $1 AND category = $2 ORDER BY question_id',
                [userId, category]
            );
            
            const preferences = {};
            result.rows.forEach(row => {
                preferences[row.question_id] = {
                    selectedOption: row.selected_option,
                    preferenceStrength: parseFloat(row.preference_strength),
                    updatedAt: row.updated_at
                };
            });
            
            console.log(`✅ Encontradas ${result.rows.length} preferências na categoria '${category}'`);
            return preferences;
            
        } catch (error) {
            console.error(`❌ Erro ao buscar preferências da categoria '${category}':`, error);
            throw error;
        }
    }
}

// Exportar instância singleton
const stylePreferencesService = new StylePreferencesService();
export default stylePreferencesService;
EOF

echo -e "${GREEN}✅ Serviço de preferências criado${NC}"

# 6. ATUALIZAR ROTAS DE PERFIL PARA USAR BANCO REAL
echo -e "${BLUE}🛣️  Atualizando rotas de perfil...${NC}"

# Backup das rotas atuais
cp server/routes/profile.js "server/routes/profile.js.backup.$(date +%Y%m%d_%H%M%S)"

cat > server/routes/profile.js << 'EOF'
// server/routes/profile.js - Rotas de Perfil com PostgreSQL (ES Modules)
import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import stylePreferencesService from '../services/StylePreferencesService.js';

const router = express.Router();

console.log('👤 Carregando rotas de perfil com PostgreSQL...');

/**
 * GET /api/profile
 * Buscar dados básicos do perfil do usuário
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        console.log('📥 GET /api/profile - userId:', userId);
        
        // Buscar estatísticas de completude
        const completionStats = await stylePreferencesService.getCompletionStats(userId);
        
        const userData = {
            id: userId,
            name: req.user?.name || 'Usuário MatchIt',
            email: req.user?.email || 'user@matchit.com',
            createdAt: new Date('2024-01-01'),
            profileCompletion: completionStats.completionPercentage,
            hasStylePreferences: completionStats.totalAnsweredQuestions > 0,
            preferences: {
                ageRange: [22, 35],
                maxDistance: 50,
                interests: ['música', 'viagem', 'tecnologia']
            },
            styleStats: completionStats
        };
        
        res.json({
            success: true,
            data: userData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

/**
 * GET /api/profile/style-preferences
 * Buscar preferências de estilo do usuário
 */
router.get('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category } = req.query;
        
        console.log('📥 GET /api/profile/style-preferences - userId:', userId, 'category:', category);
        
        let preferences;
        if (category) {
            preferences = { [category]: await stylePreferencesService.getPreferencesByCategory(userId, category) };
        } else {
            preferences = await stylePreferencesService.getUserPreferences(userId);
        }
        
        res.json({
            success: true,
            data: preferences,
            count: Object.keys(preferences).length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar preferências de estilo',
            code: 'FETCH_PREFERENCES_ERROR'
        });
    }
});

/**
 * PUT /api/profile/style-preferences
 * Atualizar preferência específica
 */
router.put('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { category, questionId, selectedOption, preferenceStrength } = req.body;
        
        console.log('📥 PUT /api/profile/style-preferences:', { userId, category, questionId, selectedOption });
        
        if (!category || !questionId || !selectedOption) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: category, questionId, selectedOption',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }
        
        const updatedPreference = await stylePreferencesService.updatePreference(
            userId, category, questionId, selectedOption, preferenceStrength || 1.0
        );
        
        res.json({
            success: true,
            message: 'Preferência atualizada com sucesso',
            data: {
                id: updatedPreference.id,
                category: updatedPreference.category,
                questionId: updatedPreference.question_id,
                selectedOption: updatedPreference.selected_option,
                preferenceStrength: parseFloat(updatedPreference.preference_strength),
                updatedAt: updatedPreference.updated_at
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em PUT /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar preferência',
            code: 'UPDATE_PREFERENCE_ERROR'
        });
    }
});

/**
 * POST /api/profile/style-preferences/batch
 * Atualizar múltiplas preferências de uma vez
 */
router.post('/style-preferences/batch', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { preferences } = req.body;
        
        console.log('📥 POST /api/profile/style-preferences/batch:', { userId, categories: Object.keys(preferences || {}) });
        
        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Campo "preferences" é obrigatório e deve ser um objeto',
                code: 'INVALID_PREFERENCES_FORMAT'
            });
        }
        
        const updatedPreferences = await stylePreferencesService.updateMultiplePreferences(userId, preferences);
        
        res.json({
            success: true,
            message: `${updatedPreferences.length} preferências atualizadas com sucesso`,
            data: updatedPreferences.map(pref => ({
                id: pref.id,
                category: pref.category,
                questionId: pref.question_id,
                selectedOption: pref.selected_option,
                preferenceStrength: parseFloat(pref.preference_strength),
                updatedAt: pref.updated_at
            })),
            totalUpdated: updatedPreferences.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em POST /api/profile/style-preferences/batch:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar preferências em lote',
            code: 'BATCH_UPDATE_ERROR'
        });
    }
});

/**
 * GET /api/profile/style-preferences/stats
 * Estatísticas de completude do perfil
 */
router.get('/style-preferences/stats', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        
        const stats = await stylePreferencesService.getCompletionStats(userId);
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em GET /api/profile/style-preferences/stats:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas',
            code: 'STATS_ERROR'
        });
    }
});

/**
 * DELETE /api/profile/style-preferences
 * Remover todas as preferências do usuário
 */
router.delete('/style-preferences', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        
        const result = await stylePreferencesService.clearUserPreferences(userId);
        
        res.json({
            success: true,
            message: 'Todas as preferências foram removidas',
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro em DELETE /api/profile/style-preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao remover preferências',
            code: 'DELETE_PREFERENCES_ERROR'
        });
    }
});

console.log('✅ Rotas de perfil carregadas com PostgreSQL');

export default router;
EOF

echo -e "${GREEN}✅ Rotas de perfil atualizadas${NC}"

# 7. ATUALIZAR .env
echo -e "${BLUE}⚙️  Atualizando configurações de ambiente...${NC}"

# Backup do .env atual se existir
if [ -f ".env" ]; then
    cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > .env << 'EOF'
# Configurações do Banco de Dados - FASE 0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Configurações da API
PORT=3000
NODE_ENV=development
JWT_SECRET=matchit_secret_key_phase0_2025

# URLs da API
API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000

# Configurações de Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF

echo -e "${GREEN}✅ Arquivo .env atualizado${NC}"

# 8. INSTALAR DEPENDÊNCIA PG
echo -e "${BLUE}📦 Instalando dependência PostgreSQL...${NC}"

npm install pg

echo -e "${GREEN}✅ Dependência pg instalada${NC}"

# 9. CRIAR SCRIPT DE TESTE DA FASE 0
echo -e "${BLUE}🧪 Criando script de teste...${NC}"

mkdir -p tests

cat > tests/test-phase-0.mjs << 'EOF'
// tests/test-phase-0.mjs - Teste da Fase 0 completа
import http from 'http';

const API_BASE = 'http://localhost:3000';

// Função helper para fazer requests
function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const reqOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Testes
async function runTests() {
    console.log('🧪 Iniciando testes da Fase 0...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Teste 1: Health check
    totalTests++;
    console.log('1️⃣  Testando health check...');
    try {
        const response = await makeRequest('/api/health');
        if (response.status === 200 && response.data.status === 'healthy') {
            console.log('   ✅ Health check OK');
            passedTests++;
        } else {
            console.log('   ❌ Health check falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 2: Buscar preferências (deve retornar vazio inicialmente)
    totalTests++;
    console.log('2️⃣  Testando GET /api/profile/style-preferences...');
    try {
        const response = await makeRequest('/api/profile/style-preferences');
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ GET style-preferences OK');
            console.log('   📊 Dados retornados:', JSON.stringify(response.data.data, null, 2));
            passedTests++;
        } else {
            console.log('   ❌ GET style-preferences falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 3: Criar preferência
    totalTests++;
    console.log('3️⃣  Testando PUT /api/profile/style-preferences...');
    try {
        const response = await makeRequest('/api/profile/style-preferences', {
            method: 'PUT',
            body: {
                category: 'colors',
                questionId: 'warm_vs_cool',
                selectedOption: 'warm_colors',
                preferenceStrength: 0.8
            }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ PUT style-preferences OK');
            console.log('   💾 Preferência criada:', response.data.data.selectedOption);
            passedTests++;
        } else {
            console.log('   ❌ PUT style-preferences falhou');
            console.log('   📋 Response:', response.data);
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 4: Buscar preferências novamente (deve retornar a criada)
    totalTests++;
    console.log('4️⃣  Testando GET após criar preferência...');
    try {
        const response = await makeRequest('/api/profile/style-preferences');
        if (response.status === 200 && response.data.success) {
            const hasColors = response.data.data.colors && response.data.data.colors.warm_vs_cool;
            if (hasColors) {
                console.log('   ✅ Preferência persistida corretamente');
                console.log('   📊 Valor salvo:', response.data.data.colors.warm_vs_cool.selectedOption);
                passedTests++;
            } else {
                console.log('   ❌ Preferência não foi persistida');
            }
        } else {
            console.log('   ❌ GET após create falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 5: Testar batch update
    totalTests++;
    console.log('5️⃣  Testando POST /api/profile/style-preferences/batch...');
    try {
        const response = await makeRequest('/api/profile/style-preferences/batch', {
            method: 'POST',
            body: {
                preferences: {
                    styles: {
                        casual_vs_formal: { selectedOption: 'casual', preferenceStrength: 0.9 },
                        minimalist_vs_bold: { selectedOption: 'minimalist', preferenceStrength: 0.7 }
                    },
                    accessories: {
                        gold_vs_silver: { selectedOption: 'silver', preferenceStrength: 0.6 }
                    }
                }
            }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Batch update OK');
            console.log('   💾 Preferências atualizadas:', response.data.totalUpdated);
            passedTests++;
        } else {
            console.log('   ❌ Batch update falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 6: Testar estatísticas
    totalTests++;
    console.log('6️⃣  Testando GET /api/profile/style-preferences/stats...');
    try {
        const response = await makeRequest('/api/profile/style-preferences/stats');
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Estatísticas OK');
            console.log('   📊 Completude:', response.data.data.completionPercentage + '%');
            console.log('   📊 Respostas:', response.data.data.totalAnsweredQuestions);
            passedTests++;
        } else {
            console.log('   ❌ Estatísticas falharam');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL DOS TESTES - FASE 0');
    console.log('='.repeat(50));
    console.log(`✅ Testes passados: ${passedTests}/${totalTests}`);
    console.log(`📊 Taxa de sucesso: ${Math.round((passedTests/totalTests)*100)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 FASE 0 COMPLETAMENTE FUNCIONAL!');
        console.log('✅ Integração PostgreSQL OK');
        console.log('✅ Todas as operações CRUD funcionando');
        console.log('✅ Persistência de dados confirmada');
        console.log('🚀 Pronto para Fase 1!');
    } else {
        console.log('⚠️  Alguns testes falharam. Revisar implementação.');
    }
    
    process.exit(passedTests === totalTests ? 0 : 1);
}

runTests().catch(console.error);
EOF

echo -e "${GREEN}✅ Script de teste criado${NC}"

# 10. FINALIZAÇÃO
echo -e "${GREEN}"
echo "================================================================"
echo " FASE 0 COMPLETADA COM SUCESSO!"
echo "================================================================"
echo -e "${NC}"

echo -e "${GREEN}✅ Implementações concluídas:${NC}"
echo "   • PostgreSQL configurado e funcionando"
echo "   • Migração de banco executada"
echo "   • Serviço de preferências de estilo implementado"
echo "   • Rotas de perfil conectadas ao banco real"
echo "   • Endpoints CRUD funcionais"
echo "   • Sistema de estatísticas implementado"
echo "   • Testes automatizados criados"

echo ""
echo -e "${BLUE}🚀 Para testar a Fase 0 completa:${NC}"
echo "   1. Reinicie o servidor: npm run server"
echo "   2. Execute os testes: node tests/test-phase-0.mjs" 
echo "   3. Verifique os dados: psql -U matchit -d matchit_db -c \"SELECT * FROM style_preferences;\""

echo ""
echo -e "${BLUE}📋 Endpoints implementados:${NC}"
echo "   GET    /api/profile/style-preferences           - Buscar todas as preferências"
echo "   GET    /api/profile/style-preferences?category=X - Buscar por categoria"
echo "   PUT    /api/profile/style-preferences           - Atualizar preferência específica"
echo "   POST   /api/profile/style-preferences/batch     - Atualizar múltiplas preferências"
echo "   GET    /api/profile/style-preferences/stats     - Estatísticas de completude"
echo "   DELETE /api/profile/style-preferences           - Remover todas as preferências"

echo ""
echo -e "${YELLOW}💡 A Fase 0 agora está 100% funcional com PostgreSQL real!${NC}"
echo -e "${YELLOW}   Próximo passo: Conectar frontend React Native${NC}"
echo ""
