-- =====================================================
-- MATCHIT DATABASE SETUP - PARTE 2: DADOS INICIAIS
-- =====================================================

-- =====================================================
-- INSERIR USUÁRIOS DE TESTE
-- =====================================================

INSERT INTO users (id, email, password_hash, name, email_verified) VALUES
(uuid_generate_v4(), 'alex.ryder@email.com', '$2b$10$example_hash_1', 'Alex Ryder', true),
(uuid_generate_v4(), 'nova.cyber@email.com', '$2b$10$example_hash_2', 'Nova Chen', true),
(uuid_generate_v4(), 'jax.tech@email.com', '$2b$10$example_hash_3', 'Jax Rivera', true),
(uuid_generate_v4(), 'lyra.art@email.com', '$2b$10$example_hash_4', 'Lyra Moon', true),
(uuid_generate_v4(), 'orion.space@email.com', '$2b$10$example_hash_5', 'Orion Star', true);

-- =====================================================
-- INSERIR PERFIS DOS USUÁRIOS
-- =====================================================

-- Alex Ryder (usuário principal)
INSERT INTO user_profiles (user_id, display_name, city, gender, avatar_url, bio, is_vip, age, style_completion_percentage)
SELECT u.id, 'Alex Ryder', 'Neo Kyoto', 'male', 
       'https://picsum.photos/seed/alexryder/200/200',
       'Explorer of digital frontiers and analog dreams. Seeking connections beyond the surface.',
       true, 28, 85
FROM users u WHERE u.email = 'alex.ryder@email.com';

-- Nova Chen
INSERT INTO user_profiles (user_id, display_name, city, gender, avatar_url, bio, is_vip, age, style_completion_percentage)
SELECT u.id, 'Nova', 'Cyberia', 'female',
       'https://picsum.photos/seed/nova/100/100',
       'Digital artist and retro-futurism enthusiast. Love connecting through shared aesthetics.',
       false, 25, 92
FROM users u WHERE u.email = 'nova.cyber@email.com';

-- Jax Rivera
INSERT INTO user_profiles (user_id, display_name, city, gender, avatar_url, bio, is_vip, age, style_completion_percentage)
SELECT u.id, 'Jax', 'Tech Haven', 'male',
       'https://picsum.photos/seed/jax/100/100',
       'Tech entrepreneur by day, urban explorer by night. Always looking for the next adventure.',
       true, 31, 78
FROM users u WHERE u.email = 'jax.tech@email.com';

-- Lyra Moon
INSERT INTO user_profiles (user_id, display_name, city, gender, avatar_url, bio, is_vip, age, style_completion_percentage)
SELECT u.id, 'Lyra', 'Aethelburg', 'female',
       'https://picsum.photos/seed/lyra/100/100',
       'Fashion designer with a passion for sustainable style. Creating beauty that matters.',
       false, 29, 88
FROM users u WHERE u.email = 'lyra.art@email.com';

-- Orion Star
INSERT INTO user_profiles (user_id, display_name, city, gender, avatar_url, bio, is_vip, age, style_completion_percentage)
SELECT u.id, 'Orion', 'Neo Kyoto', 'other',
       'https://picsum.photos/seed/orion/100/100',
       'Music producer and visual artist. Believer in authentic connections through creative expression.',
       false, 27, 76
FROM users u WHERE u.email = 'orion.space@email.com';

-- =====================================================
-- INSERIR ESCOLHAS DE ESTILO (Style Choices)
-- =====================================================

-- Alex Ryder's style choices
INSERT INTO style_choices (user_id, category, question_id, selected_option)
SELECT u.id, 'Sneakers', 'sneakers1', 'adidas' FROM users u WHERE u.email = 'alex.ryder@email.com'
UNION ALL
SELECT u.id, 'Clothing', 'clothing1', 'casual' FROM users u WHERE u.email = 'alex.ryder@email.com'
UNION ALL
SELECT u.id, 'Colors', 'colors1', 'dark' FROM users u WHERE u.email = 'alex.ryder@email.com'
UNION ALL
SELECT u.id, 'Hobbies', 'hobbies1', 'gaming' FROM users u WHERE u.email = 'alex.ryder@email.com'
UNION ALL
SELECT u.id, 'Feelings', 'feelings1', 'calm' FROM users u WHERE u.email = 'alex.ryder@email.com';

-- Nova's style choices (similar to Alex for high compatibility)
INSERT INTO style_choices (user_id, category, question_id, selected_option)
SELECT u.id, 'Sneakers', 'sneakers1', 'adidas' FROM users u WHERE u.email = 'nova.cyber@email.com'
UNION ALL
SELECT u.id, 'Clothing', 'clothing1', 'casual' FROM users u WHERE u.email = 'nova.cyber@email.com'
UNION ALL
SELECT u.id, 'Colors', 'colors1', 'bright' FROM users u WHERE u.email = 'nova.cyber@email.com'
UNION ALL
SELECT u.id, 'Hobbies', 'hobbies1', 'gaming' FROM users u WHERE u.email = 'nova.cyber@email.com'
UNION ALL
SELECT u.id, 'Feelings', 'feelings1', 'energetic' FROM users u WHERE u.email = 'nova.cyber@email.com';

-- Jax's style choices
INSERT INTO style_choices (user_id, category, question_id, selected_option)
SELECT u.id, 'Sneakers', 'sneakers1', 'nike' FROM users u WHERE u.email = 'jax.tech@email.com'
UNION ALL
SELECT u.id, 'Clothing', 'clothing1', 'formal' FROM users u WHERE u.email = 'jax.tech@email.com'
UNION ALL
SELECT u.id, 'Colors', 'colors1', 'dark' FROM users u WHERE u.email = 'jax.tech@email.com'
UNION ALL
SELECT u.id, 'Hobbies', 'hobbies1', 'outdoors' FROM users u WHERE u.email = 'jax.tech@email.com'
UNION ALL
SELECT u.id, 'Feelings', 'feelings1', 'energetic' FROM users u WHERE u.email = 'jax.tech@email.com';

-- Lyra's style choices
INSERT INTO style_choices (user_id, category, question_id, selected_option)
SELECT u.id, 'Sneakers', 'sneakers1', 'nike' FROM users u WHERE u.email = 'lyra.art@email.com'
UNION ALL
SELECT u.id, 'Clothing', 'clothing1', 'formal' FROM users u WHERE u.email = 'lyra.art@email.com'
UNION ALL
SELECT u.id, 'Colors', 'colors1', 'bright' FROM users u WHERE u.email = 'lyra.art@email.com'
UNION ALL
SELECT u.id, 'Hobbies', 'hobbies1', 'outdoors' FROM users u WHERE u.email = 'lyra.art@email.com'
UNION ALL
SELECT u.id, 'Feelings', 'feelings1', 'calm' FROM users u WHERE u.email = 'lyra.art@email.com';

-- Orion's style choices
INSERT INTO style_choices (user_id, category, question_id, selected_option)
SELECT u.id, 'Sneakers', 'sneakers1', 'adidas' FROM users u WHERE u.email = 'orion.space@email.com'
UNION ALL
SELECT u.id, 'Clothing', 'clothing1', 'casual' FROM users u WHERE u.email = 'orion.space@email.com'
UNION ALL
SELECT u.id, 'Colors', 'colors1', 'bright' FROM users u WHERE u.email = 'orion.space@email.com'
UNION ALL
SELECT u.id, 'Hobbies', 'hobbies1', 'gaming' FROM users u WHERE u.email = 'orion.space@email.com'
UNION ALL
SELECT u.id, 'Feelings', 'feelings1', 'calm' FROM users u WHERE u.email = 'orion.space@email.com';

-- =====================================================
-- INSERIR MATCHES BASEADOS NA COMPATIBILIDADE
-- =====================================================

-- Match Alex & Nova (alta compatibilidade)
INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
SELECT 
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com'),
    (SELECT id FROM users WHERE email = 'nova.cyber@email.com'),
    92, 'accepted';

-- Match Alex & Jax
INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
SELECT 
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com'),
    (SELECT id FROM users WHERE email = 'jax.tech@email.com'),
    88, 'pending';

-- Match Alex & Lyra
INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
SELECT 
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com'),
    (SELECT id FROM users WHERE email = 'lyra.art@email.com'),
    85, 'pending';

-- Match Alex & Orion
INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
SELECT 
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com'),
    (SELECT id FROM users WHERE email = 'orion.space@email.com'),
    78, 'pending';

-- =====================================================
-- INSERIR MENSAGENS DE CHAT
-- =====================================================

-- Mensagens entre Alex e Nova
INSERT INTO chat_messages (match_id, sender_id, message_text, created_at)
SELECT 
    m.id,
    (SELECT id FROM users WHERE email = 'nova.cyber@email.com'),
    'Hey Alex! Saw we matched, 92% is pretty high! 😄',
    CURRENT_TIMESTAMP - INTERVAL '5 minutes'
FROM matches m 
WHERE m.user1_id = (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
AND m.user2_id = (SELECT id FROM users WHERE email = 'nova.cyber@email.com');

INSERT INTO chat_messages (match_id, sender_id, message_text, created_at)
SELECT 
    m.id,
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com'),
    'Nova! Hey! Yeah, awesome score. What caught your eye?',
    CURRENT_TIMESTAMP - INTERVAL '4 minutes'
FROM matches m 
WHERE m.user1_id = (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
AND m.user2_id = (SELECT id FROM users WHERE email = 'nova.cyber@email.com');

INSERT INTO chat_messages (match_id, sender_id, message_text, created_at)
SELECT 
    m.id,
    (SELECT id FROM users WHERE email = 'nova.cyber@email.com'),
    'Definitely our shared love for urban classics and digital worlds. You into retro-futurism?',
    CURRENT_TIMESTAMP - INTERVAL '3 minutes'
FROM matches m 
WHERE m.user1_id = (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
AND m.user2_id = (SELECT id FROM users WHERE email = 'nova.cyber@email.com');

INSERT INTO chat_messages (match_id, sender_id, message_text, created_at)
SELECT 
    m.id,
    (SELECT id FROM users WHERE email = 'alex.ryder@email.com'),
    'Absolutely! Currently replaying Chrono Trigger. You?',
    CURRENT_TIMESTAMP - INTERVAL '2 minutes'
FROM matches m 
WHERE m.user1_id = (SELECT id FROM users WHERE email = 'alex.ryder@email.com')
AND m.user2_id = (SELECT id FROM users WHERE email = 'nova.cyber@email.com');