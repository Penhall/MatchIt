-- scripts/fix/002_create_style_tables.sql - Criação das tabelas de estilo
-- Arquivo: scripts/fix/002_create_style_tables.sql

-- =====================================================
-- CRIAÇÃO DAS TABELAS DE ESTILO - PARTE 2
-- =====================================================

-- Tabela de escolhas de estilo (necessária para o ProfileService)
CREATE TABLE IF NOT EXISTS style_choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    selected_option VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    UNIQUE(user_id, category, question_id)
);

-- Tabela para tokens de sessão
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    privacy_level VARCHAR(20) DEFAULT 'public',
    language VARCHAR(10) DEFAULT 'pt-BR',
    theme VARCHAR(20) DEFAULT 'light',
    settings_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_user_category ON style_choices(user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Triggers para updated_at
CREATE TRIGGER update_style_choices_updated_at 
    BEFORE UPDATE ON style_choices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE style_choices IS 'Tabela que armazena as escolhas de estilo dos usuários';
COMMENT ON COLUMN style_choices.category IS 'Categoria da escolha (Sneakers, Clothing, Colors, Hobbies, Feelings, Interests)';
COMMENT ON COLUMN style_choices.question_id IS 'ID da pergunta/questão de estilo';
COMMENT ON COLUMN style_choices.selected_option IS 'Opção selecionada pelo usuário';

COMMENT ON TABLE user_sessions IS 'Tabela de tokens de sessão dos usuários';
COMMENT ON TABLE user_settings IS 'Tabela de configurações dos usuários';

-- Validações
ALTER TABLE style_choices 
ADD CONSTRAINT valid_categories 
CHECK (category IN ('Sneakers', 'Clothing', 'Colors', 'Hobbies', 'Feelings', 'Interests'));

ALTER TABLE user_settings 
ADD CONSTRAINT valid_privacy_level 
CHECK (privacy_level IN ('public', 'friends', 'private'));

ALTER TABLE user_settings 
ADD CONSTRAINT valid_theme 
CHECK (theme IN ('light', 'dark', 'auto'));

-- Inserir dados de exemplo para teste (opcional)
INSERT INTO style_choices (user_id, category, question_id, selected_option) 
SELECT 
    '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid,
    'Sneakers',
    'sneaker_style_1',
    'casual'
WHERE NOT EXISTS (
    SELECT 1 FROM style_choices 
    WHERE user_id = '1820114c-348a-455d-8fa6-decaf1ef61fb'::uuid 
    AND category = 'Sneakers' 
    AND question_id = 'sneaker_style_1'
);

-- Verificação se as tabelas foram criadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'style_choices') THEN
        RAISE NOTICE 'Tabela style_choices criada com sucesso';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        RAISE NOTICE 'Tabela user_sessions criada com sucesso';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        RAISE NOTICE 'Tabela user_settings criada com sucesso';
    END IF;
END $$;