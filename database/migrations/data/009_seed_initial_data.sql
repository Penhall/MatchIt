-- Migration 009: Seed de dados iniciais
-- Executa apenas em ambiente de desenvolvimento (NODE_ENV=development)
-- Para desativar: SET matchit.disable_seeds = true;

DO $$
BEGIN
  -- Verifica se está em desenvolvimento e seeds não estão desativados
  IF current_setting('server_version_num')::int >= 90500
     AND (current_setting('NODE_ENV') = 'development' OR current_setting('matchit.force_seeds') = 'true')
     AND current_setting('matchit.disable_seeds') IS DISTINCT FROM 'true' THEN

    -- Usuário admin
    INSERT INTO users (email, password_hash, name, is_active, is_admin, created_at, updated_at)
    VALUES (
      'admin@example.com',
      '$2a$12$V9qQZ8Z3Z3Z3Z3Z3Z3Z3Z.3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z', -- admin123
      'Admin User',
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO NOTHING;

    -- Usuário de teste
    INSERT INTO users (email, password_hash, name, is_active, is_admin, created_at, updated_at)
    VALUES (
      'test@example.com',
      '$2a$12$V9qQZ8Z3Z3Z3Z3Z3Z3Z3Z.3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z', -- test123
      'Test User',
      true,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO NOTHING;

    -- Perfis de usuário padrão
    INSERT INTO user_profile_types (type_name, description, max_style_choices, can_see_advanced_metrics)
    VALUES
      ('básico', 'Perfil básico com funcionalidades essenciais', 3, false),
      ('intermediário', 'Perfil com mais opções de personalização', 5, true),
      ('avançado', 'Perfil completo com todas funcionalidades', 10, true)
    ON CONFLICT (type_name) DO NOTHING;

    -- Perfil do admin
    INSERT INTO user_profiles (user_id, display_name, avatar_url, style_data, profile_type)
    SELECT
      u.id,
      'Administrador',
      null,
      jsonb_build_object(
        'city', 'São Paulo',
        'gender', 'male',
        'age', 30,
        'style_completion_percentage', 100,
        'bio', 'Usuário administrador do sistema',
        'is_vip', true
      ),
      'avançado'
    FROM users u WHERE u.email = 'admin@example.com'
    ON CONFLICT (user_id) DO NOTHING;

    -- Perfil do usuário teste
    INSERT INTO user_profiles (user_id, display_name, avatar_url, style_data, profile_type)
    SELECT
      u.id,
      'Usuário Teste',
      null,
      jsonb_build_object(
        'city', 'Rio de Janeiro',
        'gender', 'female',
        'age', 25,
        'style_completion_percentage', 50,
        'bio', 'Usuário de teste básico',
        'is_vip', false
      ),
      'básico'
    FROM users u WHERE u.email = 'test@example.com'
    ON CONFLICT (user_id) DO NOTHING;

    -- Configurações padrão do sistema
    INSERT INTO system_settings (setting_key, setting_value, description)
    VALUES 
      ('max_login_attempts', '5', 'Número máximo de tentativas de login'),
      ('password_reset_timeout', '3600', 'Tempo em segundos para expiração do token de reset de senha'),
      ('default_user_role', 'user', 'Papel padrão para novos usuários')
    ON CONFLICT (setting_key) DO NOTHING;

    RAISE NOTICE 'Seed de dados iniciais aplicado com sucesso';
  ELSE
    RAISE NOTICE 'Seed de dados iniciais ignorado (ambiente não é desenvolvimento ou seeds desativados)';
    RAISE NOTICE 'Para forçar execução: SET matchit.force_seeds = true;';
  END IF;
END $$;