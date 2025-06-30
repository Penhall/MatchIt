-- database/migrations/011_add_alt_text_to_tournament_images.sql
-- Adiciona a coluna 'alt_text' à tabela 'tournament_images'

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournament_images' 
                   AND column_name = 'alt_text') THEN
        ALTER TABLE tournament_images
        ADD COLUMN alt_text VARCHAR(255);
        
        -- Opcional: Atualizar registros existentes com um valor padrão ou NULL
        -- UPDATE tournament_images SET alt_text = 'Imagem de torneio' WHERE alt_text IS NULL;
    END IF;
END $$;

COMMIT;
