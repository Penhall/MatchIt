-- database/seeds/002_corrected_initial_data.sql - Dados iniciais corrigidos

BEGIN;

-- Inserir usuário admin de teste (apenas se não existir)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at)
SELECT 'Admin Test', 'admin@matchit.com', '$2b$10$example_hash', 25, 'male', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@matchit.com');

-- Inserir usuários de teste (apenas se não existirem)
INSERT INTO users (name, email, password, age, gender, is_admin, created_at, updated_at)
SELECT * FROM (VALUES 
    ('Maria Silva', 'maria@test.com', '$2b$10$example_hash', 28, 'female', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('João Santos', 'joao@test.com', '$2b$10$example_hash', 32, 'male', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Ana Costa', 'ana@test.com', '$2b$10$example_hash', 24, 'female', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
) AS t(name, email, password, age, gender, is_admin, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = t.email);

-- Inserir mais imagens para torneios se necessário
INSERT INTO tournament_images (category, image_url, alt_text, approved, upload_date)
SELECT * FROM (VALUES 
    ('colors', '/api/images/colors/azul.jpg', 'Tom azul sereno', true, CURRENT_TIMESTAMP),
    ('colors', '/api/images/colors/verde.jpg', 'Verde natural', true, CURRENT_TIMESTAMP),
    ('colors', '/api/images/colors/vermelho.jpg', 'Vermelho vibrante', true, CURRENT_TIMESTAMP),
    ('styles', '/api/images/styles/casual.jpg', 'Look casual confortável', true, CURRENT_TIMESTAMP),
    ('styles', '/api/images/styles/formal.jpg', 'Elegância formal', true, CURRENT_TIMESTAMP),
    ('accessories', '/api/images/accessories/watch.jpg', 'Relógio clássico', true, CURRENT_TIMESTAMP),
    ('accessories', '/api/images/accessories/bag.jpg', 'Bolsa moderna', true, CURRENT_TIMESTAMP),
    ('shoes', '/api/images/shoes/sneaker.jpg', 'Tênis esportivo', true, CURRENT_TIMESTAMP),
    ('shoes', '/api/images/shoes/formal.jpg', 'Sapato social', true, CURRENT_TIMESTAMP)
) AS t(category, image_url, alt_text, approved, upload_date)
WHERE NOT EXISTS (SELECT 1 FROM tournament_images WHERE image_url = t.image_url);

COMMIT;
