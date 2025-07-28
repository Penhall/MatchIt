-- database/seeds/004_tournament_fixed_sample_data.sql
-- Dados de exemplo para torneios - versão corrigida para estrutura atual

-- Primeiro, verificar quais colunas existem na tabela
DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura da tabela tournament_images...';
    
    -- Mostrar colunas existentes
    FOR rec IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tournament_images' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Coluna: % - Tipo: %', rec.column_name, rec.data_type;
    END LOOP;
END $$;

-- Limpar dados antigos primeiro
DELETE FROM tournament_images;

-- Inserir dados apenas com colunas básicas (que certamente existem)
INSERT INTO tournament_images (category, image_url, description, tags, active, approved, upload_date) VALUES

-- Categoria: cores (16 imagens)
('cores', 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Vermelho+Vibrante', 'Tons energéticos de vermelho', ARRAY['vermelho', 'energia', 'paixão'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Azul+Calmo', 'Tons tranquilos de azul', ARRAY['azul', 'calma', 'paz'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Azul+Profundo', 'Azul oceano profundo', ARRAY['azul', 'profundo', 'oceano'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Verde+Natural', 'Tons de verde da natureza', ARRAY['verde', 'natureza', 'vida'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FECA57/FFFFFF?text=Amarelo+Solar', 'Amarelo vibrante e energético', ARRAY['amarelo', 'sol', 'energia'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FF8C00/FFFFFF?text=Laranja+Sunset', 'Tons quentes de laranja', ARRAY['laranja', 'sunset', 'calor'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Roxo+Mistico', 'Tons profundos de roxo', ARRAY['roxo', 'místico', 'elegância'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Rosa+Vibrante', 'Rosa contemporâneo', ARRAY['rosa', 'moderno', 'vibrante'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/795548/FFFFFF?text=Marrom+Terra', 'Tons terrosos e naturais', ARRAY['marrom', 'terra', 'natural'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/607D8B/FFFFFF?text=Cinza+Elegante', 'Cinza moderno e sofisticado', ARRAY['cinza', 'elegante', 'moderno'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/37474F/FFFFFF?text=Preto+Classico', 'Preto elegante e atemporal', ARRAY['preto', 'clássico', 'elegante'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FAFAFA/333333?text=Branco+Puro', 'Branco minimalista', ARRAY['branco', 'puro', 'limpo'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FFC107/FFFFFF?text=Dourado', 'Tons dourados sofisticados', ARRAY['dourado', 'luxo', 'sofisticação'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Vermelho+Escuro', 'Vermelho profundo como vinho', ARRAY['vermelho', 'vinho', 'profundo'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Verde+Esmeralda', 'Verde brilhante como esmeralda', ARRAY['verde', 'esmeralda', 'brilhante'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/3498DB/FFFFFF?text=Azul+Ceu', 'Azul suave do céu', ARRAY['azul', 'céu', 'suave'], true, true, NOW()),

-- Categoria: estilos (16 imagens)
('estilos', 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Minimalista', 'Estilo limpo e simples', ARRAY['minimalista', 'limpo', 'simples'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Boho+Chic', 'Estilo bohemian elegante', ARRAY['boho', 'chic', 'bohemian'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Casual+Urbano', 'Estilo despojado da cidade', ARRAY['casual', 'urbano', 'moderno'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Classico+Elegante', 'Elegância atemporal', ARRAY['clássico', 'elegante', 'atemporal'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Vintage+Retro', 'Estilo nostálgico vintage', ARRAY['vintage', 'retrô', 'nostálgico'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Rock+Alternativo', 'Estilo ousado e alternativo', ARRAY['rock', 'alternativo', 'ousado'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Industrial', 'Estilo urbano industrial', ARRAY['industrial', 'urbano', 'moderno'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Artesanal', 'Estilo feito à mão', ARRAY['artesanal', 'único', 'handmade'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Futurista', 'Estilo tecnológico avançado', ARRAY['futurista', 'tecnológico', 'inovador'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Romantico', 'Estilo suave e romântico', ARRAY['romântico', 'delicado', 'suave'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Tropical', 'Estilo colorido tropical', ARRAY['tropical', 'vibrante', 'colorido'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/1ABC9C/FFFFFF?text=Escandinavo', 'Estilo nórdico minimalista', ARRAY['escandinavo', 'nórdico', 'clean'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/34495E/FFFFFF?text=Executivo', 'Estilo corporativo elegante', ARRAY['executivo', 'profissional', 'corporativo'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/95A5A6/FFFFFF?text=Casual+Chic', 'Despojado mas elegante', ARRAY['casual', 'chic', 'elegante'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Glam+Rock', 'Estilo glamoroso e ousado', ARRAY['glam', 'rock', 'glamoroso'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/009688/FFFFFF?text=Etnico', 'Estilo com influências culturais', ARRAY['étnico', 'cultural', 'tradicional'], true, true, NOW()),

-- Categoria: acessorios (12 imagens)
('acessorios', 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Relogio+Moderno', 'Relógio contemporâneo', ARRAY['relógio', 'moderno', 'elegante'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Oculos+Sol', 'Óculos modernos de proteção', ARRAY['óculos', 'sol', 'proteção'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Bolsa+Elegante', 'Bolsa sofisticada', ARRAY['bolsa', 'elegante', 'couro'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Cinto+Classico', 'Cinto atemporal', ARRAY['cinto', 'clássico', 'couro'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Joia+Delicada', 'Acessório fino elegante', ARRAY['joia', 'delicada', 'fina'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Chapeu+Estilo', 'Chapéu com personalidade', ARRAY['chapéu', 'estiloso', 'moderno'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Cachecol+Luxo', 'Cachecol sofisticado', ARRAY['cachecol', 'luxo', 'sofisticado'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Pulseira+Designer', 'Pulseira exclusiva', ARRAY['pulseira', 'designer', 'exclusiva'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Carteira+Premium', 'Carteira de alta qualidade', ARRAY['carteira', 'premium', 'qualidade'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Mochila+Urbana', 'Mochila prática e estilosa', ARRAY['mochila', 'urbana', 'funcional'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Gravata+Seda', 'Gravata sofisticada', ARRAY['gravata', 'seda', 'elegante'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Luvas+Couro', 'Luvas elegantes de couro', ARRAY['luvas', 'couro', 'elegantes'], true, true, NOW()),

-- Categoria: calcados (14 imagens)
('calcados', 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Tenis+Branco', 'Tênis casual versátil', ARRAY['tênis', 'branco', 'casual'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Bota+Couro', 'Bota sofisticada', ARRAY['bota', 'couro', 'elegante'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Salto+Alto', 'Scarpin elegante', ARRAY['salto', 'alto', 'elegante'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Oxford+Classico', 'Sapato social elegante', ARRAY['oxford', 'clássico', 'social'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Sandalia+Elegante', 'Sandália sofisticada', ARRAY['sandália', 'elegante', 'feminina'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Mocassim+Couro', 'Sapato confortável', ARRAY['mocassim', 'couro', 'confortável'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Bota+Militar', 'Bota robusta e estilosa', ARRAY['bota', 'militar', 'resistente'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Sapatilha+Elegante', 'Sapatilha confortável e chic', ARRAY['sapatilha', 'elegante', 'confortável'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Tenis+Esportivo', 'Tênis para atividades', ARRAY['tênis', 'esportivo', 'performance'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Chinelo+Luxo', 'Chinelo sofisticado', ARRAY['chinelo', 'luxo', 'sofisticado'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Alpargata+Verao', 'Calçado leve e fresco', ARRAY['alpargata', 'verão', 'leve'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Coturno+Rock', 'Bota alternativa', ARRAY['coturno', 'rock', 'alternativo'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/95A5A6/FFFFFF?text=Slip+On', 'Sapato prático sem cadarço', ARRAY['slip-on', 'casual', 'prático'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Plataforma+Retro', 'Sapato vintage com altura', ARRAY['plataforma', 'retrô', 'vintage'], true, true, NOW()),

-- Categoria: texturas (10 imagens)
('texturas', 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Madeira+Natural', 'Textura orgânica de madeira', ARRAY['madeira', 'natural', 'orgânico'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/A0522D/FFFFFF?text=Couro+Rugoso', 'Textura táctil de couro', ARRAY['couro', 'rugoso', 'táctil'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/2F4F4F/FFFFFF?text=Metal+Escovado', 'Superfície metálica moderna', ARRAY['metal', 'escovado', 'moderno'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/F5F5DC/333333?text=Tecido+Linho', 'Textura natural de linho', ARRAY['tecido', 'linho', 'natural'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/696969/FFFFFF?text=Pedra+Rustica', 'Superfície mineral natural', ARRAY['pedra', 'rústica', 'mineral'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/F0E68C/333333?text=Seda+Lisa', 'Superfície suave e brilhante', ARRAY['seda', 'lisa', 'suave'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/CD853F/FFFFFF?text=Ceramica+Artesanal', 'Superfície cerâmica única', ARRAY['cerâmica', 'artesanal', 'única'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/B22222/FFFFFF?text=Veludo+Luxo', 'Superfície aveludada rica', ARRAY['veludo', 'luxo', 'aveludada'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/708090/FFFFFF?text=Concreto+Moderno', 'Superfície industrial clean', ARRAY['concreto', 'moderno', 'industrial'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/DDA0DD/333333?text=Renda+Delicada', 'Padrão fino e elaborado', ARRAY['renda', 'delicada', 'elaborada'], true, true, NOW()),

-- Categoria: ambientes (8 imagens)
('ambientes', 'https://via.placeholder.com/400x300/F5F5F5/333333?text=Sala+Minimalista', 'Espaço clean e organizado', ARRAY['sala', 'minimalista', 'clean'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Quarto+Rustico', 'Espaço aconchegante natural', ARRAY['quarto', 'rústico', 'aconchegante'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/4682B4/FFFFFF?text=Cozinha+Moderna', 'Espaço funcional contemporâneo', ARRAY['cozinha', 'moderna', 'funcional'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/228B22/FFFFFF?text=Jardim+Zen', 'Espaço de paz e tranquilidade', ARRAY['jardim', 'zen', 'tranquilidade'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/800080/FFFFFF?text=Escritorio+Executivo', 'Espaço profissional elegante', ARRAY['escritório', 'executivo', 'profissional'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Sala+Jantar+Classica', 'Espaço social elegante', ARRAY['sala', 'jantar', 'elegante'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/32CD32/FFFFFF?text=Varanda+Tropical', 'Espaço ao ar livre vibrante', ARRAY['varanda', 'tropical', 'vibrante'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/DC143C/FFFFFF?text=Banheiro+Spa', 'Espaço de relaxamento', ARRAY['banheiro', 'spa', 'relaxamento'], true, true, NOW());

-- Tentar atualizar colunas adicionais se existirem
DO $$
BEGIN
    -- Verificar se a coluna 'title' existe e atualizar
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tournament_images' AND column_name = 'title') THEN
        UPDATE tournament_images SET title = substring(description, 1, 50) WHERE title IS NULL;
        RAISE NOTICE 'Coluna title atualizada com sucesso';
    END IF;
    
    -- Verificar se a coluna 'alt_text' existe e atualizar
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tournament_images' AND column_name = 'alt_text') THEN
        UPDATE tournament_images SET alt_text = description WHERE alt_text IS NULL;
        RAISE NOTICE 'Coluna alt_text atualizada com sucesso';
    END IF;
    
    -- Atualizar estatísticas se as colunas existirem
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tournament_images' AND column_name = 'total_views') THEN
        UPDATE tournament_images SET 
            total_views = floor(random() * 100 + 10)::integer,
            total_selections = floor(random() * 50 + 5)::integer,
            win_rate = round((random() * 60 + 20)::numeric, 2)
        WHERE total_views IS NULL OR total_views = 0;
        RAISE NOTICE 'Estatísticas atualizadas com sucesso';
    END IF;
END $$;

-- Confirmar inserção
SELECT category, COUNT(*) as total_images 
FROM tournament_images 
WHERE approved = true AND active = true 
GROUP BY category 
ORDER BY category;