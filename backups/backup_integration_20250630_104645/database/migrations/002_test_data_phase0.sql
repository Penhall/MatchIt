-- database/migrations/002_test_data_phase0.sql - Dados de teste para Fase 0

BEGIN;

-- Inserir usuário de teste
INSERT INTO users (name, email, age, gender, is_active) 
VALUES ('Usuário Teste', 'teste@matchit.com', 25, 'other', true)
ON CONFLICT (email) DO NOTHING;

-- Buscar ID do usuário de teste
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'teste@matchit.com';
    
    IF test_user_id IS NOT NULL THEN
        -- Inserir configurações padrão
        INSERT INTO user_settings (user_id, theme, notifications_enabled, auto_save_enabled)
        VALUES (test_user_id, 'light', true, true)
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Inserir algumas preferências de exemplo
        INSERT INTO user_style_preferences (user_id, category, preference_data, confidence_score)
        VALUES 
            (test_user_id, 'colors', '{"warm_colors": 0.8, "cool_colors": 0.2, "bright_colors": 0.7, "neutral_colors": 0.5}', 0.85),
            (test_user_id, 'styles', '{"casual": 0.9, "formal": 0.3, "sporty": 0.6, "vintage": 0.4}', 0.75)
        ON CONFLICT (user_id, category) DO NOTHING;
        
        -- Inserir algumas escolhas de exemplo
        INSERT INTO style_choices (user_id, category, question_id, selected_option, response_time_ms, confidence_level)
        VALUES 
            (test_user_id, 'colors', 'warm_vs_cool_1', 'warm_colors', 1500, 4),
            (test_user_id, 'colors', 'bright_vs_neutral_1', 'bright_colors', 2000, 3),
            (test_user_id, 'styles', 'casual_vs_formal_1', 'casual', 1200, 5),
            (test_user_id, 'styles', 'sporty_vs_vintage_1', 'sporty', 1800, 3)
        ON CONFLICT (user_id, category, question_id) DO NOTHING;
    END IF;
END $$;

-- Registrar migração
INSERT INTO schema_migrations (version, filename, description, category, priority)
VALUES ('002', '002_test_data_phase0.sql', 'Dados de teste para Fase 0', 'data', 'low')
ON CONFLICT (version) DO NOTHING;

COMMIT;
