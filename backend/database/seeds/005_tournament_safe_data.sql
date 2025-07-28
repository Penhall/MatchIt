-- database/seeds/005_tournament_safe_data.sql
-- Dados de exemplo para torneios - versão ultra segura

-- Verificar estrutura atual
DO $$
BEGIN
    RAISE NOTICE 'Inserindo dados na estrutura atual da tabela tournament_images...';
    RAISE NOTICE 'Verificando e corrigindo enum values...';
END $$;

-- Recrear o enum com todos os valores necessários (se necessário)
DO $$
BEGIN
    -- Tentar adicionar todos os valores que precisamos
    BEGIN
        ALTER TYPE tournament_category_enum ADD VALUE IF NOT EXISTS 'cores';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER TYPE tournament_category_enum ADD VALUE IF NOT EXISTS 'estilos';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER TYPE tournament_category_enum ADD VALUE IF NOT EXISTS 'calcados';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER TYPE tournament_category_enum ADD VALUE IF NOT EXISTS 'acessorios';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER TYPE tournament_category_enum ADD VALUE IF NOT EXISTS 'texturas';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER TYPE tournament_category_enum ADD VALUE IF NOT EXISTS 'ambientes';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    RAISE NOTICE 'Enum values verificados/adicionados com sucesso';
END $$;

-- Mostrar valores atuais do enum
DO $$
DECLARE
    enum_value TEXT;
BEGIN
    RAISE NOTICE 'Valores atuais do enum tournament_category_enum:';
    FOR enum_value IN 
        SELECT unnest(enum_range(NULL::tournament_category_enum))::text
    LOOP
        RAISE NOTICE '- %', enum_value;
    END LOOP;
END $$;

-- Limpar dados antigos
DELETE FROM tournament_images;

-- Resetar sequência do ID
ALTER SEQUENCE tournament_images_id_seq RESTART WITH 1;

-- Inserir dados usando CAST explícito para garantir compatibilidade
INSERT INTO tournament_images (category, image_url, image_name, display_order, active, tags, approved, alt_text) VALUES

-- Categoria: cores (16 imagens)
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Vermelho+Vibrante', 'Vermelho Vibrante', 1, true, ARRAY['vermelho', 'energia', 'paixão'], true, 'Paleta de cores vermelhas vibrantes'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Azul+Calmo', 'Azul Serenidade', 2, true, ARRAY['azul', 'calma', 'paz'], true, 'Paleta de cores azuis tranquilas'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Azul+Profundo', 'Azul Profundo', 3, true, ARRAY['azul', 'profundo', 'oceano'], true, 'Tons profundos de azul oceano'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Verde+Natural', 'Verde Natureza', 4, true, ARRAY['verde', 'natureza', 'vida'], true, 'Paleta de verdes naturais'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/FECA57/FFFFFF?text=Amarelo+Solar', 'Amarelo Solar', 5, true, ARRAY['amarelo', 'sol', 'energia'], true, 'Amarelo brilhante como o sol'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF8C00/FFFFFF?text=Laranja+Sunset', 'Laranja Pôr do Sol', 6, true, ARRAY['laranja', 'sunset', 'calor'], true, 'Laranja do pôr do sol'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Roxo+Mistico', 'Roxo Místico', 7, true, ARRAY['roxo', 'místico', 'elegância'], true, 'Roxo místico e elegante'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Rosa+Vibrante', 'Rosa Moderno', 8, true, ARRAY['rosa', 'moderno', 'vibrante'], true, 'Rosa vibrante e moderno'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/795548/FFFFFF?text=Marrom+Terra', 'Marrom Terra', 9, true, ARRAY['marrom', 'terra', 'natural'], true, 'Marrom terroso natural'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/607D8B/FFFFFF?text=Cinza+Elegante', 'Cinza Elegante', 10, true, ARRAY['cinza', 'elegante', 'moderno'], true, 'Cinza sofisticado'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/37474F/FFFFFF?text=Preto+Classico', 'Preto Clássico', 11, true, ARRAY['preto', 'clássico', 'elegante'], true, 'Preto clássico atemporal'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/FAFAFA/333333?text=Branco+Puro', 'Branco Puro', 12, true, ARRAY['branco', 'puro', 'limpo'], true, 'Branco puro e limpo'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/FFC107/FFFFFF?text=Dourado', 'Dourado Luxo', 13, true, ARRAY['dourado', 'luxo', 'sofisticação'], true, 'Dourado luxuoso'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Vermelho+Escuro', 'Vermelho Vinho', 14, true, ARRAY['vermelho', 'vinho', 'profundo'], true, 'Vermelho escuro profundo'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Verde+Esmeralda', 'Verde Esmeralda', 15, true, ARRAY['verde', 'esmeralda', 'brilhante'], true, 'Verde esmeralda vibrante'),
('cores'::tournament_category_enum, 'https://via.placeholder.com/400x300/3498DB/FFFFFF?text=Azul+Ceu', 'Azul Céu', 16, true, ARRAY['azul', 'céu', 'suave'], true, 'Azul claro como o céu'),

-- Categoria: estilos (16 imagens)
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Minimalista', 'Minimalista', 1, true, ARRAY['minimalista', 'limpo', 'simples'], true, 'Estilo minimalista clean'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Boho+Chic', 'Boho Chic', 2, true, ARRAY['boho', 'chic', 'bohemian'], true, 'Estilo boho chic moderno'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Casual+Urbano', 'Casual Urbano', 3, true, ARRAY['casual', 'urbano', 'moderno'], true, 'Estilo casual urbano'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Classico+Elegante', 'Clássico Elegante', 4, true, ARRAY['clássico', 'elegante', 'atemporal'], true, 'Estilo clássico atemporal'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Vintage+Retro', 'Vintage Retrô', 5, true, ARRAY['vintage', 'retrô', 'nostálgico'], true, 'Estilo vintage retrô'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Rock+Alternativo', 'Rock Alternativo', 6, true, ARRAY['rock', 'alternativo', 'ousado'], true, 'Estilo rock alternativo'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Industrial', 'Industrial', 7, true, ARRAY['industrial', 'urbano', 'moderno'], true, 'Estilo industrial moderno'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Artesanal', 'Artesanal', 8, true, ARRAY['artesanal', 'único', 'handmade'], true, 'Estilo artesanal único'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Futurista', 'Futurista', 9, true, ARRAY['futurista', 'tecnológico', 'inovador'], true, 'Estilo futurista inovador'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Romantico', 'Romântico', 10, true, ARRAY['romântico', 'delicado', 'suave'], true, 'Estilo romântico delicado'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Tropical', 'Tropical', 11, true, ARRAY['tropical', 'vibrante', 'colorido'], true, 'Estilo tropical vibrante'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/1ABC9C/FFFFFF?text=Escandinavo', 'Escandinavo', 12, true, ARRAY['escandinavo', 'nórdico', 'clean'], true, 'Estilo escandinavo clean'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/34495E/FFFFFF?text=Executivo', 'Executivo', 13, true, ARRAY['executivo', 'profissional', 'corporativo'], true, 'Estilo executivo profissional'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/95A5A6/FFFFFF?text=Casual+Chic', 'Casual Chic', 14, true, ARRAY['casual', 'chic', 'elegante'], true, 'Estilo casual chic'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Glam+Rock', 'Glam Rock', 15, true, ARRAY['glam', 'rock', 'glamoroso'], true, 'Estilo glam rock ousado'),
('estilos'::tournament_category_enum, 'https://via.placeholder.com/400x300/009688/FFFFFF?text=Etnico', 'Étnico', 16, true, ARRAY['étnico', 'cultural', 'tradicional'], true, 'Estilo étnico cultural'),

-- Categoria: acessorios (16 imagens)
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Relogio+Moderno', 'Relógio Moderno', 1, true, ARRAY['relógio', 'moderno', 'elegante'], true, 'Relógio moderno elegante'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Oculos+Sol', 'Óculos de Sol', 2, true, ARRAY['óculos', 'sol', 'proteção'], true, 'Óculos de sol estilosos'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Bolsa+Elegante', 'Bolsa Elegante', 3, true, ARRAY['bolsa', 'elegante', 'couro'], true, 'Bolsa elegante de couro'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Cinto+Classico', 'Cinto Clássico', 4, true, ARRAY['cinto', 'clássico', 'couro'], true, 'Cinto clássico de couro'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Joia+Delicada', 'Joia Delicada', 5, true, ARRAY['joia', 'delicada', 'fina'], true, 'Joia delicada e fina'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Chapeu+Estilo', 'Chapéu Estiloso', 6, true, ARRAY['chapéu', 'estiloso', 'moderno'], true, 'Chapéu estiloso moderno'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Cachecol+Luxo', 'Cachecol Luxo', 7, true, ARRAY['cachecol', 'luxo', 'sofisticado'], true, 'Cachecol luxuoso'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Pulseira+Designer', 'Pulseira Designer', 8, true, ARRAY['pulseira', 'designer', 'exclusiva'], true, 'Pulseira de designer'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Carteira+Premium', 'Carteira Premium', 9, true, ARRAY['carteira', 'premium', 'qualidade'], true, 'Carteira premium de couro'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Mochila+Urbana', 'Mochila Urbana', 10, true, ARRAY['mochila', 'urbana', 'funcional'], true, 'Mochila urbana funcional'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Gravata+Seda', 'Gravata Seda', 11, true, ARRAY['gravata', 'seda', 'elegante'], true, 'Gravata de seda elegante'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Luvas+Couro', 'Luvas Couro', 12, true, ARRAY['luvas', 'couro', 'elegantes'], true, 'Luvas de couro estilosas'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/95A5A6/FFFFFF?text=Lenco+Seda', 'Lenço Seda', 13, true, ARRAY['lenço', 'seda', 'elegante'], true, 'Lenço de seda sofisticado'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Brinco+Moderno', 'Brinco Moderno', 14, true, ARRAY['brinco', 'moderno', 'estiloso'], true, 'Brinco moderno elegante'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/009688/FFFFFF?text=Colar+Delicado', 'Colar Delicado', 15, true, ARRAY['colar', 'delicado', 'fino'], true, 'Colar delicado'),
('acessorios'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF5722/FFFFFF?text=Anel+Design', 'Anel Design', 16, true, ARRAY['anel', 'design', 'exclusivo'], true, 'Anel de design exclusivo'),

-- Categoria: calcados (16 imagens)
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Tenis+Branco', 'Tênis Branco', 1, true, ARRAY['tênis', 'branco', 'casual'], true, 'Tênis branco clássico'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Bota+Couro', 'Bota Couro', 2, true, ARRAY['bota', 'couro', 'elegante'], true, 'Bota de couro elegante'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Salto+Alto', 'Salto Alto', 3, true, ARRAY['salto', 'alto', 'elegante'], true, 'Salto alto clássico'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Oxford+Classico', 'Oxford Clássico', 4, true, ARRAY['oxford', 'clássico', 'social'], true, 'Oxford clássico masculino'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Sandalia+Elegante', 'Sandália Elegante', 5, true, ARRAY['sandália', 'elegante', 'feminina'], true, 'Sandália elegante feminina'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Mocassim+Couro', 'Mocassim Couro', 6, true, ARRAY['mocassim', 'couro', 'confortável'], true, 'Mocassim de couro'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Bota+Militar', 'Bota Militar', 7, true, ARRAY['bota', 'militar', 'resistente'], true, 'Bota militar resistente'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Sapatilha+Elegante', 'Sapatilha Elegante', 8, true, ARRAY['sapatilha', 'elegante', 'confortável'], true, 'Sapatilha elegante'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Tenis+Esportivo', 'Tênis Esportivo', 9, true, ARRAY['tênis', 'esportivo', 'performance'], true, 'Tênis esportivo performance'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Chinelo+Luxo', 'Chinelo Luxo', 10, true, ARRAY['chinelo', 'luxo', 'sofisticado'], true, 'Chinelo de luxo'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Alpargata+Verao', 'Alpargata Verão', 11, true, ARRAY['alpargata', 'verão', 'leve'], true, 'Alpargata de verão'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Coturno+Rock', 'Coturno Rock', 12, true, ARRAY['coturno', 'rock', 'alternativo'], true, 'Coturno estilo rock'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/95A5A6/FFFFFF?text=Slip+On', 'Slip-On', 13, true, ARRAY['slip-on', 'casual', 'prático'], true, 'Slip-on casual moderno'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Plataforma+Retro', 'Plataforma Retrô', 14, true, ARRAY['plataforma', 'retrô', 'vintage'], true, 'Plataforma retrô estilosa'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/009688/FFFFFF?text=Sapato+Social', 'Sapato Social', 15, true, ARRAY['sapato', 'social', 'elegante'], true, 'Sapato social elegante'),
('calcados'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF5722/FFFFFF?text=Bota+Chelsea', 'Bota Chelsea', 16, true, ARRAY['bota', 'chelsea', 'moderna'], true, 'Bota Chelsea moderna'),

-- Categoria: texturas (16 imagens)
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Madeira+Natural', 'Madeira Natural', 1, true, ARRAY['madeira', 'natural', 'orgânico'], true, 'Textura de madeira natural'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/A0522D/FFFFFF?text=Couro+Rugoso', 'Couro Rugoso', 2, true, ARRAY['couro', 'rugoso', 'táctil'], true, 'Textura de couro rugoso'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/2F4F4F/FFFFFF?text=Metal+Escovado', 'Metal Escovado', 3, true, ARRAY['metal', 'escovado', 'moderno'], true, 'Textura de metal escovado'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/F5F5DC/333333?text=Tecido+Linho', 'Tecido Linho', 4, true, ARRAY['tecido', 'linho', 'natural'], true, 'Textura de tecido linho'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/696969/FFFFFF?text=Pedra+Rustica', 'Pedra Rústica', 5, true, ARRAY['pedra', 'rústica', 'mineral'], true, 'Textura de pedra rústica'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/F0E68C/333333?text=Seda+Lisa', 'Seda Lisa', 6, true, ARRAY['seda', 'lisa', 'suave'], true, 'Textura de seda lisa'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/CD853F/FFFFFF?text=Ceramica+Artesanal', 'Cerâmica Artesanal', 7, true, ARRAY['cerâmica', 'artesanal', 'única'], true, 'Textura cerâmica artesanal'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/B22222/FFFFFF?text=Veludo+Luxo', 'Veludo Luxo', 8, true, ARRAY['veludo', 'luxo', 'aveludada'], true, 'Textura de veludo luxuoso'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/708090/FFFFFF?text=Concreto+Moderno', 'Concreto Moderno', 9, true, ARRAY['concreto', 'moderno', 'industrial'], true, 'Textura de concreto moderno'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/DDA0DD/333333?text=Renda+Delicada', 'Renda Delicada', 10, true, ARRAY['renda', 'delicada', 'elaborada'], true, 'Textura de renda delicada'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/4682B4/FFFFFF?text=Denim+Classic', 'Denim Clássico', 11, true, ARRAY['denim', 'clássico', 'resistente'], true, 'Textura de denim clássico'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/228B22/FFFFFF?text=Algodao+Soft', 'Algodão Macio', 12, true, ARRAY['algodão', 'macio', 'natural'], true, 'Textura de algodão macio'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/800080/FFFFFF?text=Lycra+Stretch', 'Lycra Elástica', 13, true, ARRAY['lycra', 'elástica', 'confortável'], true, 'Textura de lycra elástica'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Tweed+Elegante', 'Tweed Elegante', 14, true, ARRAY['tweed', 'elegante', 'sofisticado'], true, 'Textura de tweed elegante'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/32CD32/FFFFFF?text=Canvas+Resistente', 'Canvas Resistente', 15, true, ARRAY['canvas', 'resistente', 'durável'], true, 'Textura de canvas resistente'),
('texturas'::tournament_category_enum, 'https://via.placeholder.com/400x300/DC143C/FFFFFF?text=Malha+Comfort', 'Malha Confortável', 16, true, ARRAY['malha', 'confortável', 'flexível'], true, 'Textura de malha confortável'),

-- Categoria: ambientes (16 imagens)
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/F5F5F5/333333?text=Sala+Minimalista', 'Sala Minimalista', 1, true, ARRAY['sala', 'minimalista', 'clean'], true, 'Ambiente sala minimalista'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Quarto+Rustico', 'Quarto Rústico', 2, true, ARRAY['quarto', 'rústico', 'aconchegante'], true, 'Ambiente quarto rústico'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/4682B4/FFFFFF?text=Cozinha+Moderna', 'Cozinha Moderna', 3, true, ARRAY['cozinha', 'moderna', 'funcional'], true, 'Ambiente cozinha moderna'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/228B22/FFFFFF?text=Jardim+Zen', 'Jardim Zen', 4, true, ARRAY['jardim', 'zen', 'tranquilidade'], true, 'Ambiente jardim zen'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/800080/FFFFFF?text=Escritorio+Executivo', 'Escritório Executivo', 5, true, ARRAY['escritório', 'executivo', 'profissional'], true, 'Ambiente escritório executivo'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Sala+Jantar+Classica', 'Sala Jantar Clássica', 6, true, ARRAY['sala', 'jantar', 'elegante'], true, 'Ambiente sala de jantar clássica'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/32CD32/FFFFFF?text=Varanda+Tropical', 'Varanda Tropical', 7, true, ARRAY['varanda', 'tropical', 'vibrante'], true, 'Ambiente varanda tropical'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/DC143C/FFFFFF?text=Banheiro+Spa', 'Banheiro Spa', 8, true, ARRAY['banheiro', 'spa', 'relaxamento'], true, 'Ambiente banheiro spa'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF9800/FFFFFF?text=Home+Office', 'Home Office', 9, true, ARRAY['home', 'office', 'produtivo'], true, 'Ambiente home office'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/3F51B5/FFFFFF?text=Quarto+Casal', 'Quarto Casal', 10, true, ARRAY['quarto', 'casal', 'íntimo'], true, 'Ambiente quarto de casal'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/795548/FFFFFF?text=Sala+TV', 'Sala de TV', 11, true, ARRAY['sala', 'tv', 'entretenimento'], true, 'Ambiente sala de TV'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/607D8B/FFFFFF?text=Lavanderia', 'Lavanderia', 12, true, ARRAY['lavanderia', 'funcional', 'prática'], true, 'Ambiente lavanderia'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/9C27B0/FFFFFF?text=Closet+Luxo', 'Closet Luxo', 13, true, ARRAY['closet', 'luxo', 'organizado'], true, 'Ambiente closet de luxo'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Area+Gourmet', 'Área Gourmet', 14, true, ARRAY['área', 'gourmet', 'social'], true, 'Ambiente área gourmet'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/FF5722/FFFFFF?text=Biblioteca', 'Biblioteca', 15, true, ARRAY['biblioteca', 'estudo', 'conhecimento'], true, 'Ambiente biblioteca'),
('ambientes'::tournament_category_enum, 'https://via.placeholder.com/400x300/009688/FFFFFF?text=Atelie+Arte', 'Ateliê de Arte', 16, true, ARRAY['ateliê', 'arte', 'criativo'], true, 'Ambiente ateliê de arte');

-- Confirmar inserção
SELECT 
    category::text as categoria,
    COUNT(*) as total_imagens,
    COUNT(CASE WHEN approved = true AND active = true THEN 1 END) as imagens_ativas
FROM tournament_images 
GROUP BY category 
ORDER BY category;

-- Mostrar estatísticas finais
SELECT 
    'TOTAL' as categoria,
    COUNT(*) as total_imagens,
    COUNT(CASE WHEN approved = true AND active = true THEN 1 END) as imagens_ativas
FROM tournament_images;

-- Verificação final
DO $$
DECLARE
    total_images INTEGER;
    total_categories INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_images FROM tournament_images;
    SELECT COUNT(DISTINCT category) INTO total_categories FROM tournament_images;
    
    RAISE NOTICE 'Dados inseridos com sucesso! Total de % imagens em % categorias.', 
        total_images, total_categories;
END $$;