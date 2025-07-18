-- database/seeds/002_tournament_sample_data.sql - Dados iniciais para torneios

-- Inserir imagens de exemplo para cada categoria
INSERT INTO tournament_images (category, image_url, thumbnail_url, title, description, tags, active, approved, created_by) VALUES

-- Categoria: Colors
('colors', '/uploads/samples/colors/red_palette.jpg', '/uploads/samples/colors/red_palette_thumb.jpg', 'Paleta Vermelha', 'Tons vibrantes de vermelho', ARRAY['vermelho', 'vibrante', 'energia'], true, true, 1),
('colors', '/uploads/samples/colors/blue_palette.jpg', '/uploads/samples/colors/blue_palette_thumb.jpg', 'Paleta Azul', 'Tons tranquilos de azul', ARRAY['azul', 'calma', 'serenidade'], true, true, 1),
('colors', '/uploads/samples/colors/green_palette.jpg', '/uploads/samples/colors/green_palette_thumb.jpg', 'Paleta Verde', 'Tons naturais de verde', ARRAY['verde', 'natureza', 'frescor'], true, true, 1),
('colors', '/uploads/samples/colors/neutral_palette.jpg', '/uploads/samples/colors/neutral_palette_thumb.jpg', 'Paleta Neutra', 'Tons terrosos e neutros', ARRAY['neutro', 'elegante', 'clássico'], true, true, 1),

-- Categoria: Styles  
('styles', '/uploads/samples/styles/casual_chic.jpg', '/uploads/samples/styles/casual_chic_thumb.jpg', 'Casual Chic', 'Estilo despojado e elegante', ARRAY['casual', 'chic', 'moderno'], true, true, 1),
('styles', '/uploads/samples/styles/minimalist.jpg', '/uploads/samples/styles/minimalist_thumb.jpg', 'Minimalista', 'Linhas limpas e simplicidade', ARRAY['minimalista', 'limpo', 'simples'], true, true, 1),
('styles', '/uploads/samples/styles/boho.jpg', '/uploads/samples/styles/boho_thumb.jpg', 'Boho', 'Estilo bohemian livre', ARRAY['boho', 'livre', 'artístico'], true, true, 1),
('styles', '/uploads/samples/styles/classic.jpg', '/uploads/samples/styles/classic_thumb.jpg', 'Clássico', 'Elegância atemporal', ARRAY['clássico', 'elegante', 'atemporal'], true, true, 1),

-- Categoria: Accessories
('accessories', '/uploads/samples/accessories/watch_modern.jpg', '/uploads/samples/accessories/watch_modern_thumb.jpg', 'Relógio Moderno', 'Relógio contemporâneo', ARRAY['relógio', 'moderno', 'tecnológico'], true, true, 1),
('accessories', '/uploads/samples/accessories/scarf_silk.jpg', '/uploads/samples/accessories/scarf_silk_thumb.jpg', 'Lenço de Seda', 'Lenço elegante de seda', ARRAY['lenço', 'seda', 'elegante'], true, true, 1),
('accessories', '/uploads/samples/accessories/belt_leather.jpg', '/uploads/samples/accessories/belt_leather_thumb.jpg', 'Cinto de Couro', 'Cinto clássico de couro', ARRAY['cinto', 'couro', 'clássico'], true, true, 1),
('accessories', '/uploads/samples/accessories/sunglasses.jpg', '/uploads/samples/accessories/sunglasses_thumb.jpg', 'Óculos de Sol', 'Óculos modernos de sol', ARRAY['óculos', 'sol', 'proteção'], true, true, 1),

-- Categoria: Shoes
('shoes', '/uploads/samples/shoes/sneakers_white.jpg', '/uploads/samples/shoes/sneakers_white_thumb.jpg', 'Tênis Branco', 'Tênis casual branco', ARRAY['tênis', 'branco', 'casual'], true, true, 1),
('shoes', '/uploads/samples/shoes/boots_leather.jpg', '/uploads/samples/shoes/boots_leather_thumb.jpg', 'Botas de Couro', 'Botas elegantes de couro', ARRAY['botas', 'couro', 'elegante'], true, true, 1),
('shoes', '/uploads/samples/shoes/heels_classic.jpg', '/uploads/samples/shoes/heels_classic_thumb.jpg', 'Salto Clássico', 'Scarpin clássico de salto', ARRAY['salto', 'clássico', 'elegante'], true, true, 1),
('shoes', '/uploads/samples/shoes/loafers.jpg', '/uploads/samples/shoes/loafers_thumb.jpg', 'Loafers', 'Sapatos loafer modernos', ARRAY['loafer', 'moderno', 'confortável'], true, true, 1),

-- Categoria: Patterns
('patterns', '/uploads/samples/patterns/stripes.jpg', '/uploads/samples/patterns/stripes_thumb.jpg', 'Listras', 'Padrão de listras clássicas', ARRAY['listras', 'clássico', 'linear'], true, true, 1),
('patterns', '/uploads/samples/patterns/floral.jpg', '/uploads/samples/patterns/floral_thumb.jpg', 'Floral', 'Estampa floral delicada', ARRAY['floral', 'delicado', 'feminino'], true, true, 1),
('patterns', '/uploads/samples/patterns/geometric.jpg', '/uploads/samples/patterns/geometric_thumb.jpg', 'Geométrico', 'Padrões geométricos modernos', ARRAY['geométrico', 'moderno', 'estruturado'], true, true, 1),
('patterns', '/uploads/samples/patterns/animal_print.jpg', '/uploads/samples/patterns/animal_print_thumb.jpg', 'Animal Print', 'Estampa animal elegante', ARRAY['animal', 'ousado', 'elegante'], true, true, 1);

-- Atualizar estatísticas iniciais
UPDATE tournament_images SET 
    total_views = floor(random() * 100 + 10),
    total_selections = floor(random() * 50 + 5),
    win_rate = round((random() * 80 + 10)::numeric, 2);

-- Inserir categorias adicionais se necessário
INSERT INTO tournament_images (category, image_url, thumbnail_url, title, description, tags, active, approved, created_by) VALUES

-- Categoria: Casual Wear (expandir para 16+ imagens)
('casual_wear', '/uploads/samples/casual/jeans_basic.jpg', '/uploads/samples/casual/jeans_basic_thumb.jpg', 'Jeans Básico', 'Calça jeans clássica', ARRAY['jeans', 'básico', 'versátil'], true, true, 1),
('casual_wear', '/uploads/samples/casual/tshirt_white.jpg', '/uploads/samples/casual/tshirt_white_thumb.jpg', 'Camiseta Branca', 'Camiseta básica branca', ARRAY['camiseta', 'branco', 'básico'], true, true, 1),
('casual_wear', '/uploads/samples/casual/hoodie_gray.jpg', '/uploads/samples/casual/hoodie_gray_thumb.jpg', 'Moletom Cinza', 'Moletom confortável cinza', ARRAY['moletom', 'cinza', 'conforto'], true, true, 1),
('casual_wear', '/uploads/samples/casual/shorts_denim.jpg', '/uploads/samples/casual/shorts_denim_thumb.jpg', 'Shorts Jeans', 'Shorts jeans despojado', ARRAY['shorts', 'jeans', 'verão'], true, true, 1);

-- Inserir usuário admin se não existir
INSERT INTO users (email, password, name, isAdmin, created_at) 
VALUES ('admin@matchit.com', '$2b$10$hash', 'Administrador', true, NOW())
ON CONFLICT (email) DO NOTHING;

