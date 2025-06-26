-- database/seeds/001_initial_data.sql - Dados iniciais para desenvolvimento

BEGIN;

-- Inserir usuário admin de desenvolvimento (senha: admin123)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at) 
VALUES (
    'Admin MatchIt',
    'admin@matchit.com',
    '$2b$10$rGy7/PQDq7OlNf7fMTfbLOr8Yz.RcXcPqOjW8zGK4GXUOZVKHrqAa', -- senha: admin123
    30,
    'other',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário de teste (senha: test123)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at) 
VALUES (
    'Usuário Teste',
    'test@matchit.com',
    '$2b$10$Xu8JoFqHLJ7/V7zYKJGYcOXlgJ9kX8QGc9FZdKLCk9MkY3xX0Grg6', -- senha: test123
    25,
    'female',
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir imagens de exemplo para torneios
INSERT INTO tournament_images (category, image_url, thumbnail_url, title, description, tags, active, approved, created_by) VALUES
    -- Cores
    ('cores', 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Vermelho+Coral', 'https://via.placeholder.com/150x150/FF6B6B', 'Vermelho Coral', 'Tom quente e vibrante', ARRAY['quente', 'vibrante', 'coral'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Azul+Turquesa', 'https://via.placeholder.com/150x150/4ECDC4', 'Azul Turquesa', 'Tom frio e refrescante', ARRAY['frio', 'azul', 'turquesa'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=Azul+Oceano', 'https://via.placeholder.com/150x150/45B7D1', 'Azul Oceano', 'Profundidade do mar', ARRAY['azul', 'oceano', 'profundo'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/F39C12/FFFFFF?text=Laranja+Solar', 'https://via.placeholder.com/150x150/F39C12', 'Laranja Solar', 'Energia do sol', ARRAY['laranja', 'solar', 'energia'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/9B59B6/FFFFFF?text=Roxo+Real', 'https://via.placeholder.com/150x150/9B59B6', 'Roxo Real', 'Elegância real', ARRAY['roxo', 'elegante', 'real'], true, true, 1),
    ('cores', 'https://via.placeholder.com/400x400/27AE60/FFFFFF?text=Verde+Natureza', 'https://via.placeholder.com/150x150/27AE60', 'Verde Natureza', 'Frescor natural', ARRAY['verde', 'natureza', 'frescor'], true, true, 1),
    
    -- Estilos
    ('estilos', 'https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Casual+Moderno', 'https://via.placeholder.com/150x150/2C3E50', 'Casual Moderno', 'Conforto com estilo', ARRAY['casual', 'moderno', 'conforto'], true, true, 1),
    ('estilos', 'https://via.placeholder.com/400x400/8E44AD/FFFFFF?text=Elegante+Formal', 'https://via.placeholder.com/150x150/8E44AD', 'Elegante Formal', 'Sofisticação máxima', ARRAY['elegante', 'formal', 'sofisticado'], true, true, 1),
    ('estilos', 'https://via.placeholder.com/400x400/E67E22/FFFFFF?text=Boho+Chic', 'https://via.placeholder.com/150x150/E67E22', 'Boho Chic', 'Liberdade criativa', ARRAY['boho', 'chic', 'criativo'], true, true, 1),
    ('estilos', 'https://via.placeholder.com/400x400/16A085/FFFFFF?text=Minimalista', 'https://via.placeholder.com/150x150/16A085', 'Minimalista', 'Menos é mais', ARRAY['minimalista', 'clean', 'simples'], true, true, 1),
    
    -- Calçados
    ('calcados', 'https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=Tênis+Casual', 'https://via.placeholder.com/150x150/E74C3C', 'Tênis Casual', 'Conforto no dia a dia', ARRAY['tênis', 'casual', 'conforto'], true, true, 1),
    ('calcados', 'https://via.placeholder.com/400x400/3498DB/FFFFFF?text=Sapato+Social', 'https://via.placeholder.com/150x150/3498DB', 'Sapato Social', 'Elegância profissional', ARRAY['social', 'elegante', 'trabalho'], true, true, 1),
    ('calcados', 'https://via.placeholder.com/400x400/9B59B6/FFFFFF?text=Bota+Estilo', 'https://via.placeholder.com/150x150/9B59B6', 'Bota Estilosa', 'Atitude e personalidade', ARRAY['bota', 'estilo', 'personalidade'], true, true, 1),
    ('calcados', 'https://via.placeholder.com/400x400/F39C12/FFFFFF?text=Sandália+Chic', 'https://via.placeholder.com/150x150/F39C12', 'Sandália Chic', 'Leveza e elegância', ARRAY['sandália', 'chic', 'leve'], true, true, 1)
ON CONFLICT DO NOTHING;

COMMIT;
