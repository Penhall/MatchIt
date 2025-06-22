-- scripts/fix/005_fix_table_structure.sql - Corrige incompatibilidades da estrutura
-- Arquivo: scripts/fix/005_fix_table_structure.sql

-- =====================================================
-- CORREÇÃO DA ESTRUTURA DAS TABELAS
-- =====================================================

-- Adicionar colunas faltantes na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8), 
ADD COLUMN IF NOT EXISTS style_game_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS style_game_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_style_game_played_at TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna updated_at na tabela style_choices
ALTER TABLE style_choices 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger para updated_at em style_choices (se não existir)
DROP TRIGGER IF EXISTS update_style_choices_updated_at ON style_choices;
CREATE TRIGGER update_style_choices_updated_at 
    BEFORE UPDATE ON style_choices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Atualizar dados existentes para ter valores padrão
UPDATE user_profiles 
SET 
    interests = ARRAY['tecnologia', 'musica'] WHERE interests IS NULL,
    style_game_level = 1 WHERE style_game_level IS NULL,
    style_game_xp = 0 WHERE style_game_xp IS NULL;

UPDATE style_choices 
SET updated_at = created_at WHERE updated_at IS NULL;

-- Verificar se as alterações foram aplicadas
DO $$
DECLARE
    interests_exists BOOLEAN;
    location_lat_exists BOOLEAN;
    location_lng_exists BOOLEAN;
    style_level_exists BOOLEAN;
    style_xp_exists BOOLEAN;
    last_played_exists BOOLEAN;
    style_updated_at_exists BOOLEAN;
BEGIN
    -- Verificar user_profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'interests'
    ) INTO interests_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'location_latitude'
    ) INTO location_lat_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'location_longitude'
    ) INTO location_lng_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'style_game_level'
    ) INTO style_level_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'style_game_xp'
    ) INTO style_xp_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'last_style_game_played_at'
    ) INTO last_played_exists;
    
    -- Verificar style_choices
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'style_choices' AND column_name = 'updated_at'
    ) INTO style_updated_at_exists;
    
    -- Reportar resultados
    IF interests_exists THEN
        RAISE NOTICE '✅ Coluna interests adicionada em user_profiles';
    ELSE
        RAISE WARNING '❌ Falha ao adicionar coluna interests';
    END IF;
    
    IF location_lat_exists AND location_lng_exists THEN
        RAISE NOTICE '✅ Colunas de localização adicionadas em user_profiles';
    ELSE
        RAISE WARNING '❌ Falha ao adicionar colunas de localização';
    END IF;
    
    IF style_level_exists AND style_xp_exists AND last_played_exists THEN
        RAISE NOTICE '✅ Colunas de game adicionadas em user_profiles';
    ELSE
        RAISE WARNING '❌ Falha ao adicionar colunas de game';
    END IF;
    
    IF style_updated_at_exists THEN
        RAISE NOTICE '✅ Coluna updated_at adicionada em style_choices';
    ELSE
        RAISE WARNING '❌ Falha ao adicionar coluna updated_at em style_choices';
    END IF;
    
    RAISE NOTICE '📊 Estrutura das tabelas corrigida!';
END $$;