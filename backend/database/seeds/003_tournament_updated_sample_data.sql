-- database/seeds/003_tournament_updated_sample_data.sql
-- Dados de exemplo atualizados para o sistema de torneios MatchIt

-- Limpar dados antigos primeiro
DELETE FROM tournament_images;

-- Inserir imagens de exemplo para cada categoria (com nomes atualizados)
INSERT INTO tournament_images (category, image_url, alt_text, title, description, tags, active, approved, upload_date) VALUES

-- Categoria: cores (16 imagens)
('cores', 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Vermelho+Vibrante', 'Paleta de cores vermelhas vibrantes', 'Vermelho Vibrante', 'Tons energéticos de vermelho', ARRAY['vermelho', 'energia', 'paixão'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Azul+Calmo', 'Paleta de cores azuis tranquilas', 'Azul Serenidade', 'Tons tranquilos de azul', ARRAY['azul', 'calma', 'paz'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Azul+Profundo', 'Tons profundos de azul', 'Azul Profundo', 'Azul oceano profundo', ARRAY['azul', 'profundo', 'oceano'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Verde+Natural', 'Paleta de verdes naturais', 'Verde Natureza', 'Tons de verde da natureza', ARRAY['verde', 'natureza', 'vida'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FECA57/FFFFFF?text=Amarelo+Solar', 'Amarelo brilhante como o sol', 'Amarelo Solar', 'Amarelo vibrante e energético', ARRAY['amarelo', 'sol', 'energia'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FF8C00/FFFFFF?text=Laranja+Sunset', 'Laranja do pôr do sol', 'Laranja Pôr do Sol', 'Tons quentes de laranja', ARRAY['laranja', 'sunset', 'calor'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Roxo+Mistico', 'Roxo místico e elegante', 'Roxo Místico', 'Tons profundos de roxo', ARRAY['roxo', 'místico', 'elegância'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Rosa+Vibrante', 'Rosa vibrante e moderno', 'Rosa Moderno', 'Rosa contemporâneo', ARRAY['rosa', 'moderno', 'vibrante'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/795548/FFFFFF?text=Marrom+Terra', 'Marrom terroso natural', 'Marrom Terra', 'Tons terrosos e naturais', ARRAY['marrom', 'terra', 'natural'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/607D8B/FFFFFF?text=Cinza+Elegante', 'Cinza sofisticado', 'Cinza Elegante', 'Cinza moderno e sofisticado', ARRAY['cinza', 'elegante', 'moderno'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/37474F/FFFFFF?text=Preto+Classico', 'Preto clássico atemporal', 'Preto Clássico', 'Preto elegante e atemporal', ARRAY['preto', 'clássico', 'elegante'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FAFAFA/333333?text=Branco+Puro', 'Branco puro e limpo', 'Branco Puro', 'Branco minimalista', ARRAY['branco', 'puro', 'limpo'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/FFC107/FFFFFF?text=Dourado', 'Dourado luxuoso', 'Dourado Luxo', 'Tons dourados sofisticados', ARRAY['dourado', 'luxo', 'sofisticação'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Vermelho+Escuro', 'Vermelho escuro profundo', 'Vermelho Vinho', 'Vermelho profundo como vinho', ARRAY['vermelho', 'vinho', 'profundo'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Verde+Esmeralda', 'Verde esmeralda vibrante', 'Verde Esmeralda', 'Verde brilhante como esmeralda', ARRAY['verde', 'esmeralda', 'brilhante'], true, true, NOW()),
('cores', 'https://via.placeholder.com/400x300/3498DB/FFFFFF?text=Azul+Ceu', 'Azul claro como o céu', 'Azul Céu', 'Azul suave do céu', ARRAY['azul', 'céu', 'suave'], true, true, NOW()),

-- Categoria: estilos (16 imagens)
('estilos', 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Minimalista', 'Estilo minimalista clean', 'Minimalista', 'Estilo limpo e simples', ARRAY['minimalista', 'limpo', 'simples'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Boho+Chic', 'Estilo boho chic moderno', 'Boho Chic', 'Estilo bohemian elegante', ARRAY['boho', 'chic', 'bohemian'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Casual+Urbano', 'Estilo casual urbano', 'Casual Urbano', 'Estilo despojado da cidade', ARRAY['casual', 'urbano', 'moderno'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Classico+Elegante', 'Estilo clássico atemporal', 'Clássico Elegante', 'Elegância atemporal', ARRAY['clássico', 'elegante', 'atemporal'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Vintage+Retr', 'Estilo vintage retrô', 'Vintage Retrô', 'Estilo nostálgico vintage', ARRAY['vintage', 'retrô', 'nostálgico'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Rock+Alternativo', 'Estilo rock alternativo', 'Rock Alternativo', 'Estilo ousado e alternativo', ARRAY['rock', 'alternativo', 'ousado'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Industrial', 'Estilo industrial moderno', 'Industrial', 'Estilo urbano industrial', ARRAY['industrial', 'urbano', 'moderno'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Artesanal', 'Estilo artesanal único', 'Artesanal', 'Estilo feito à mão', ARRAY['artesanal', 'único', 'handmade'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Futurista', 'Estilo futurista inovador', 'Futurista', 'Estilo tecnológico avançado', ARRAY['futurista', 'tecnológico', 'inovador'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Romantico', 'Estilo romântico delicado', 'Romântico', 'Estilo suave e romântico', ARRAY['romântico', 'delicado', 'suave'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Tropical', 'Estilo tropical vibrante', 'Tropical', 'Estilo colorido tropical', ARRAY['tropical', 'vibrante', 'colorido'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/1ABC9C/FFFFFF?text=Escandinavo', 'Estilo escandinavo clean', 'Escandinavo', 'Estilo nórdico minimalista', ARRAY['escandinavo', 'nórdico', 'clean'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/34495E/FFFFFF?text=Executivo', 'Estilo executivo profissional', 'Executivo', 'Estilo corporativo elegante', ARRAY['executivo', 'profissional', 'corporativo'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/95A5A6/FFFFFF?text=Casual+Chic', 'Estilo casual chic', 'Casual Chic', 'Despojado mas elegante', ARRAY['casual', 'chic', 'elegante'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Glam+Rock', 'Estilo glam rock ousado', 'Glam Rock', 'Estilo glamoroso e ousado', ARRAY['glam', 'rock', 'glamoroso'], true, true, NOW()),
('estilos', 'https://via.placeholder.com/400x300/009688/FFFFFF?text=Etnico', 'Estilo étnico cultural', 'Étnico', 'Estilo com influências culturais', ARRAY['étnico', 'cultural', 'tradicional'], true, true, NOW()),

-- Categoria: acessorios (12 imagens)
('acessorios', 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Relogio+Moderno', 'Relógio moderno elegante', 'Relógio Moderno', 'Relógio contemporâneo', ARRAY['relógio', 'moderno', 'elegante'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Oculos+Sol', 'Óculos de sol estilosos', 'Óculos de Sol', 'Óculos modernos de proteção', ARRAY['óculos', 'sol', 'proteção'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Bolsa+Elegante', 'Bolsa elegante de couro', 'Bolsa Elegante', 'Bolsa sofisticada', ARRAY['bolsa', 'elegante', 'couro'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Cinto+Classico', 'Cinto clássico de couro', 'Cinto Clássico', 'Cinto atemporal', ARRAY['cinto', 'clássico', 'couro'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Joia+Delicada', 'Joia delicada e fina', 'Joia Delicada', 'Acessório fino elegante', ARRAY['joia', 'delicada', 'fina'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Chapeu+Estilo', 'Chapéu estiloso moderno', 'Chapéu Estiloso', 'Chapéu com personalidade', ARRAY['chapéu', 'estiloso', 'moderno'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Cachecol+Luxo', 'Cachecol luxuoso', 'Cachecol Luxo', 'Cachecol sofisticado', ARRAY['cachecol', 'luxo', 'sofisticado'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Pulseira+Designer', 'Pulseira de designer', 'Pulseira Designer', 'Pulseira exclusiva', ARRAY['pulseira', 'designer', 'exclusiva'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Carteira+Premium', 'Carteira premium de couro', 'Carteira Premium', 'Carteira de alta qualidade', ARRAY['carteira', 'premium', 'qualidade'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Mochila+Urbana', 'Mochila urbana funcional', 'Mochila Urbana', 'Mochila prática e estilosa', ARRAY['mochila', 'urbana', 'funcional'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Gravata+Seda', 'Gravata de seda elegante', 'Gravata Seda', 'Gravata sofisticada', ARRAY['gravata', 'seda', 'elegante'], true, true, NOW()),
('acessorios', 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Luvas+Couro', 'Luvas de couro estilosas', 'Luvas Couro', 'Luvas elegantes de couro', ARRAY['luvas', 'couro', 'elegantes'], true, true, NOW()),

-- Categoria: calcados (14 imagens)
('calcados', 'https://via.placeholder.com/400x300/2C3E50/FFFFFF?text=Tenis+Branco', 'Tênis branco clássico', 'Tênis Branco', 'Tênis casual versátil', ARRAY['tênis', 'branco', 'casual'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/8E44AD/FFFFFF?text=Bota+Couro', 'Bota de couro elegante', 'Bota Couro', 'Bota sofisticada', ARRAY['bota', 'couro', 'elegante'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/E74C3C/FFFFFF?text=Salto+Alto', 'Salto alto clássico', 'Salto Alto', 'Scarpin elegante', ARRAY['salto', 'alto', 'elegante'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/F39C12/FFFFFF?text=Oxford+Classico', 'Oxford clássico masculino', 'Oxford Clássico', 'Sapato social elegante', ARRAY['oxford', 'clássico', 'social'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/9B59B6/FFFFFF?text=Sandalia+Elegante', 'Sandália elegante feminina', 'Sandália Elegante', 'Sandália sofisticada', ARRAY['sandália', 'elegante', 'feminina'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/16A085/FFFFFF?text=Mocassim+Couro', 'Mocassim de couro', 'Mocassim Couro', 'Sapato confortável', ARRAY['mocassim', 'couro', 'confortável'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/E67E22/FFFFFF?text=Bota+Militar', 'Bota militar resistente', 'Bota Militar', 'Bota robusta e estilosa', ARRAY['bota', 'militar', 'resistente'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/C0392B/FFFFFF?text=Sapatilha+Elegante', 'Sapatilha elegante', 'Sapatilha Elegante', 'Sapatilha confortável e chic', ARRAY['sapatilha', 'elegante', 'confortável'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/2980B9/FFFFFF?text=Tenis+Esportivo', 'Tênis esportivo performance', 'Tênis Esportivo', 'Tênis para atividades', ARRAY['tênis', 'esportivo', 'performance'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/7F8C8D/FFFFFF?text=Chinelo+Luxo', 'Chinelo de luxo', 'Chinelo Luxo', 'Chinelo sofisticado', ARRAY['chinelo', 'luxo', 'sofisticado'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/D35400/FFFFFF?text=Alpargata+Verao', 'Alpargata de verão', 'Alpargata Verão', 'Calçado leve e fresco', ARRAY['alpargata', 'verão', 'leve'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/27AE60/FFFFFF?text=Coturno+Rock', 'Coturno estilo rock', 'Coturno Rock', 'Bota alternativa', ARRAY['coturno', 'rock', 'alternativo'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/95A5A6/FFFFFF?text=Slip+On', 'Slip-on casual moderno', 'Slip-On', 'Sapato prático sem cadarço', ARRAY['slip-on', 'casual', 'prático'], true, true, NOW()),
('calcados', 'https://via.placeholder.com/400x300/E91E63/FFFFFF?text=Plataforma+Retro', 'Plataforma retrô estilosa', 'Plataforma Retrô', 'Sapato vintage com altura', ARRAY['plataforma', 'retrô', 'vintage'], true, true, NOW()),

-- Categoria: texturas (10 imagens)
('texturas', 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Madeira+Natural', 'Textura de madeira natural', 'Madeira Natural', 'Textura orgânica de madeira', ARRAY['madeira', 'natural', 'orgânico'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/A0522D/FFFFFF?text=Couro+Rugoso', 'Textura de couro rugoso', 'Couro Rugoso', 'Textura táctil de couro', ARRAY['couro', 'rugoso', 'táctil'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/2F4F4F/FFFFFF?text=Metal+Escovado', 'Textura de metal escovado', 'Metal Escovado', 'Superfície metálica moderna', ARRAY['metal', 'escovado', 'moderno'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/F5F5DC/333333?text=Tecido+Linho', 'Textura de tecido linho', 'Tecido Linho', 'Textura natural de linho', ARRAY['tecido', 'linho', 'natural'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/696969/FFFFFF?text=Pedra+Rustica', 'Textura de pedra rústica', 'Pedra Rústica', 'Superfície mineral natural', ARRAY['pedra', 'rústica', 'mineral'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/F0E68C/333333?text=Seda+Lisa', 'Textura de seda lisa', 'Seda Lisa', 'Superfície suave e brilhante', ARRAY['seda', 'lisa', 'suave'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/CD853F/FFFFFF?text=Ceramica+Artesanal', 'Textura cerâmica artesanal', 'Cerâmica Artesanal', 'Superfície cerâmica única', ARRAY['cerâmica', 'artesanal', 'única'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/B22222/FFFFFF?text=Veludo+Luxo', 'Textura de veludo luxuoso', 'Veludo Luxo', 'Superfície aveludada rica', ARRAY['veludo', 'luxo', 'aveludada'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/708090/FFFFFF?text=Concreto+Moderno', 'Textura de concreto moderno', 'Concreto Moderno', 'Superfície industrial clean', ARRAY['concreto', 'moderno', 'industrial'], true, true, NOW()),
('texturas', 'https://via.placeholder.com/400x300/DDA0DD/333333?text=Renda+Delicada', 'Textura de renda delicada', 'Renda Delicada', 'Padrão fino e elaborado', ARRAY['renda', 'delicada', 'elaborada'], true, true, NOW()),

-- Categoria: ambientes (8 imagens)
('ambientes', 'https://via.placeholder.com/400x300/F5F5F5/333333?text=Sala+Minimalista', 'Ambiente sala minimalista', 'Sala Minimalista', 'Espaço clean e organizado', ARRAY['sala', 'minimalista', 'clean'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Quarto+Rustico', 'Ambiente quarto rústico', 'Quarto Rústico', 'Espaço aconchegante natural', ARRAY['quarto', 'rústico', 'aconchegante'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/4682B4/FFFFFF?text=Cozinha+Moderna', 'Ambiente cozinha moderna', 'Cozinha Moderna', 'Espaço funcional contemporâneo', ARRAY['cozinha', 'moderna', 'funcional'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/228B22/FFFFFF?text=Jardim+Zen', 'Ambiente jardim zen', 'Jardim Zen', 'Espaço de paz e tranquilidade', ARRAY['jardim', 'zen', 'tranquilidade'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/800080/FFFFFF?text=Escritorio+Executivo', 'Ambiente escritório executivo', 'Escritório Executivo', 'Espaço profissional elegante', ARRAY['escritório', 'executivo', 'profissional'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Sala+Jantar+Classica', 'Ambiente sala de jantar clássica', 'Sala Jantar Clássica', 'Espaço social elegante', ARRAY['sala', 'jantar', 'elegante'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/32CD32/FFFFFF?text=Varanda+Tropical', 'Ambiente varanda tropical', 'Varanda Tropical', 'Espaço ao ar livre vibrante', ARRAY['varanda', 'tropical', 'vibrante'], true, true, NOW()),
('ambientes', 'https://via.placeholder.com/400x300/DC143C/FFFFFF?text=Banheiro+Spa', 'Ambiente banheiro spa', 'Banheiro Spa', 'Espaço de relaxamento', ARRAY['banheiro', 'spa', 'relaxamento'], true, true, NOW());

-- Atualizar estatísticas iniciais
UPDATE tournament_images SET 
    total_views = floor(random() * 100 + 10)::integer,
    total_selections = floor(random() * 50 + 5)::integer,
    win_rate = round((random() * 60 + 20)::numeric, 2)
WHERE total_views IS NULL;

-- Confirmar inserção
SELECT category, COUNT(*) as total_images 
FROM tournament_images 
WHERE approved = true AND active = true 
GROUP BY category 
ORDER BY category;