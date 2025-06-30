-- database/migrations/003_fix_schema_errors.sql - Correção de erros de schema

BEGIN;

-- 1. Adicionar coluna 'age' na tabela users se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;

-- 2. Adicionar coluna 'approved' na tabela tournament_images se não existir
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 3. Adicionar outras colunas que podem estar faltando
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Corrigir tabela tournament_images se necessário
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS dimensions JSONB;

-- 5. Criar índices em campos aprovados se não existirem
CREATE INDEX IF NOT EXISTS idx_tournament_images_approved ON tournament_images(approved);
CREATE INDEX IF NOT EXISTS idx_tournament_images_category_approved ON tournament_images(category, approved);

-- 6. Inserir dados de teste se tabela estiver vazia
INSERT INTO tournament_images (category, image_url, alt_text, approved) 
SELECT * FROM (VALUES 
    ('colors', '/api/images/sample/color1.jpg', 'Cor vibrante azul', true),
    ('colors', '/api/images/sample/color2.jpg', 'Cor quente vermelha', true),
    ('styles', '/api/images/sample/style1.jpg', 'Estilo casual moderno', true),
    ('styles', '/api/images/sample/style2.jpg', 'Estilo elegante formal', true),
    ('accessories', '/api/images/sample/acc1.jpg', 'Acessório minimalista', true),
    ('accessories', '/api/images/sample/acc2.jpg', 'Acessório vintage', true)
) AS t(category, image_url, alt_text, approved)
WHERE NOT EXISTS (SELECT 1 FROM tournament_images LIMIT 1);

COMMIT;
