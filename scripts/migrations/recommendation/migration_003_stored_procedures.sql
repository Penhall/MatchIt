-- =====================================================
-- MIGRATION 003: STORED PROCEDURES E FUNÇÕES
-- =====================================================
-- Versão: 1.2.003
-- Autor: Sistema MatchIt
-- Data: 2025-06-06
-- Descrição: Funções e procedures para algoritmos de recomendação

-- =====================================================
-- FUNÇÃO: calculate_style_compatibility
-- Calcula compatibilidade de estilo entre dois usuários
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_style_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    common_choices INTEGER := 0;
    total_categories INTEGER := 5; -- Sneakers, Clothing, Colors, Hobbies, Feelings
    compatibility_score DECIMAL(3,2);
BEGIN
    -- Contar escolhas em comum (mesmo chosen_evaluation_item_id) por categoria.
    -- Esta é uma interpretação de "escolhas em comum".
    -- Poderia ser mais complexo, e.g., se ambos escolheram itens com atributos similares.
    -- Por enquanto, contamos categorias onde ambos escolheram o MESMO item.
    WITH user1_latest_choices AS (
        SELECT DISTINCT ON (category) category, chosen_evaluation_item_id
        FROM style_choices
        WHERE user_id = user1_uuid
        ORDER BY category, created_at DESC
    ),
    user2_latest_choices AS (
        SELECT DISTINCT ON (category) category, chosen_evaluation_item_id
        FROM style_choices
        WHERE user_id = user2_uuid
        ORDER BY category, created_at DESC
    )
    SELECT COUNT(*)
    INTO common_choices
    FROM user1_latest_choices sc1
    INNER JOIN user2_latest_choices sc2 ON sc1.category = sc2.category 
                                 AND sc1.chosen_evaluation_item_id = sc2.chosen_evaluation_item_id;
    
    -- Calcular score de compatibilidade
    -- Se total_categories for 0 (improvável se StyleAdjustment é obrigatório), evitar divisão por zero.
    IF total_categories = 0 THEN
        compatibility_score := 0.5; -- Score neutro
    ELSE
        compatibility_score := (common_choices::DECIMAL / total_categories::DECIMAL);
    END IF;
    
    -- Garantir que está entre 0 e 1
    RETURN GREATEST(0.0, LEAST(1.0, compatibility_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_location_score
-- Calcula score baseado na proximidade geográfica
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_location_score(
    user1_uuid UUID,
    user2_uuid UUID,
    max_distance_km DECIMAL DEFAULT 50.0
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    user1_lat DECIMAL;
    user1_lng DECIMAL;
    user2_lat DECIMAL;
    user2_lng DECIMAL;
    distance_km DECIMAL;
    location_score DECIMAL(3,2);
BEGIN
    -- Buscar coordenadas dos usuários (assumindo que estão em user_profiles)
    SELECT latitude, longitude INTO user1_lat, user1_lng
    FROM user_profiles up1
    WHERE up1.user_id = user1_uuid;
    
    SELECT latitude, longitude INTO user2_lat, user2_lng
    FROM user_profiles up2
    WHERE up2.user_id = user2_uuid;
    
    -- Se não tiver dados de localização, retornar score neutro
    IF user1_lat IS NULL OR user2_lat IS NULL THEN
        RETURN 0.5;
    END IF;
    
    -- Calcular distância usando fórmula de Haversine (simplificada)
    distance_km := 6371 * acos(
        cos(radians(user1_lat)) * cos(radians(user2_lat)) * 
        cos(radians(user2_lng) - radians(user1_lng)) + 
        sin(radians(user1_lat)) * sin(radians(user2_lat))
    );
    
    -- Score decresce exponencialmente com a distância
    location_score := exp(-distance_km / (max_distance_km * 0.5));
    
    RETURN GREATEST(0.0, LEAST(1.0, location_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_vector_similarity (Helper para personalidade e emocional)
-- Calcula similaridade de cosseno entre dois vetores (arrays de decimais)
-- Retorna valor entre 0 e 1 (0 para ortogonal, 1 para idêntico)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_vector_similarity(
    vector1 DECIMAL[],
    vector2 DECIMAL[]
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    dot_product DECIMAL := 0;
    norm1 DECIMAL := 0;
    norm2 DECIMAL := 0;
    similarity DECIMAL(3,2);
    vector_length INTEGER;
BEGIN
    IF array_length(vector1, 1) IS NULL OR array_length(vector2, 1) IS NULL OR array_length(vector1, 1) != array_length(vector2, 1) THEN
        RETURN 0.5; -- Vetores inválidos ou de tamanhos diferentes, score neutro
    END IF;

    vector_length := array_length(vector1, 1);
    IF vector_length = 0 THEN
        RETURN 0.5; -- Vetores vazios, score neutro
    END IF;

    FOR i IN 1..vector_length LOOP
        dot_product := dot_product + (vector1[i] * vector2[i]);
        norm1 := norm1 + (vector1[i] * vector1[i]);
        norm2 := norm2 + (vector2[i] * vector2[i]);
    END LOOP;

    IF norm1 = 0 OR norm2 = 0 THEN
        RETURN 0.0; -- Evitar divisão por zero se um vetor for nulo
    END IF;

    similarity := dot_product / (sqrt(norm1) * sqrt(norm2));
    
    -- Normalizar para 0-1 (similaridade de cosseno já é -1 a 1, mas nossos vetores são >=0, então será 0 a 1)
    RETURN GREATEST(0.0, LEAST(1.0, (similarity + 1.0) / 2.0)); -- Ajuste se cosseno puder ser negativo
    -- Se os vetores são sempre positivos (como scores 0-1), então a similaridade de cosseno já é 0-1.
    -- Para vetores de perfil (0.5 default), a similaridade será positiva.
    -- RETURN GREATEST(0.0, LEAST(1.0, similarity)); -- Usar este se os vetores são sempre positivos.
                                                -- Vamos assumir que os vetores de perfil são >= 0.
    RETURN GREATEST(0.0, LEAST(1.0, similarity));

END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_personality_compatibility
-- Calcula compatibilidade de personalidade entre dois usuários
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_personality_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    profile1 user_extended_profiles%ROWTYPE;
    profile2 user_extended_profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile1 FROM user_extended_profiles WHERE user_id = user1_uuid;
    SELECT * INTO profile2 FROM user_extended_profiles WHERE user_id = user2_uuid;

    IF NOT FOUND OR profile1.personality_vector IS NULL OR profile2.personality_vector IS NULL THEN
        RETURN 0.5; -- Dados insuficientes, score neutro
    END IF;

    RETURN calculate_vector_similarity(profile1.personality_vector, profile2.personality_vector);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: calculate_emotional_compatibility
-- Calcula compatibilidade emocional entre dois usuários
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_emotional_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    profile1 user_extended_profiles%ROWTYPE;
    profile2 user_extended_profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile1 FROM user_extended_profiles WHERE user_id = user1_uuid;
    SELECT * INTO profile2 FROM user_extended_profiles WHERE user_id = user2_uuid;

    IF NOT FOUND OR profile1.emotional_profile IS NULL OR profile2.emotional_profile IS NULL THEN
        RETURN 0.5; -- Dados insuficientes, score neutro
    END IF;

    RETURN calculate_vector_similarity(profile1.emotional_profile, profile2.emotional_profile);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: calculate_jaccard_index (Helper para hobbies)
-- Calcula o índice de Jaccard para dois arrays de texto (listas de hobbies)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_jaccard_index(
    arr1 TEXT[],
    arr2 TEXT[]
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    intersection_count INTEGER;
    union_count INTEGER;
    jaccard_index DECIMAL(3,2);
BEGIN
    IF arr1 IS NULL OR arr2 IS NULL OR array_length(arr1,1) = 0 OR array_length(arr2,1) = 0 THEN
        RETURN 0.0; -- Se um dos arrays for nulo ou vazio, não há sobreposição.
    END IF;

    SELECT COUNT(*) INTO intersection_count
    FROM (
        SELECT unnest(arr1) INTERSECT SELECT unnest(arr2)
    ) AS intersection_set;

    SELECT COUNT(*) INTO union_count
    FROM (
        SELECT unnest(arr1) UNION SELECT unnest(arr2)
    ) AS union_set;

    IF union_count = 0 THEN
        RETURN 1.0; -- Ambos os arrays são vazios (já tratado acima, mas por segurança) ou idênticos e vazios.
                    -- Se ambos são não-vazios e idênticos, Jaccard é 1.
    END IF;
    
    jaccard_index := intersection_count::DECIMAL / union_count::DECIMAL;
    RETURN GREATEST(0.0, LEAST(1.0, jaccard_index));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_hobby_compatibility
-- Calcula compatibilidade de hobbies entre dois usuários
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_hobby_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    profile1 user_extended_profiles%ROWTYPE;
    profile2 user_extended_profiles%ROWTYPE;
    hobbies1 TEXT[];
    hobbies2 TEXT[];
BEGIN
    SELECT * INTO profile1 FROM user_extended_profiles WHERE user_id = user1_uuid;
    SELECT * INTO profile2 FROM user_extended_profiles WHERE user_id = user2_uuid;

    -- Assumindo que hobbies estão em lifestyle_profile -> 'hobbies' como um array de texto
    -- Ex: '{"hobbies": ["reading", "hiking", "music"]}'
    IF NOT FOUND OR profile1.lifestyle_profile->>'hobbies' IS NULL OR profile2.lifestyle_profile->>'hobbies' IS NULL THEN
        RETURN 0.5; -- Dados insuficientes ou formato incorreto, score neutro
    END IF;

    BEGIN
        hobbies1 := ARRAY(SELECT jsonb_array_elements_text(profile1.lifestyle_profile->'hobbies'));
        hobbies2 := ARRAY(SELECT jsonb_array_elements_text(profile2.lifestyle_profile->'hobbies'));
    EXCEPTION WHEN OTHERS THEN
        -- Se o JSONB não estiver no formato esperado (array de texto), retornar score neutro
        RETURN 0.5;
    END;
    
    RETURN calculate_jaccard_index(hobbies1, hobbies2);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: calculate_lifestyle_compatibility
-- Calcula compatibilidade de estilo de vida
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_lifestyle_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    profile1 user_extended_profiles%ROWTYPE;
    profile2 user_extended_profiles%ROWTYPE;
    score_activity DECIMAL(3,2) := 0.5;
    score_social DECIMAL(3,2) := 0.5;
    score_chronotype DECIMAL(3,2) := 0.5; -- morning_person / night_owl
    total_score DECIMAL(3,2) := 0.0;
    num_factors INTEGER := 0;
BEGIN
    SELECT * INTO profile1 FROM user_extended_profiles WHERE user_id = user1_uuid;
    SELECT * INTO profile2 FROM user_extended_profiles WHERE user_id = user2_uuid;

    IF NOT FOUND OR profile1.lifestyle_profile IS NULL OR profile2.lifestyle_profile IS NULL THEN
        RETURN 0.5; -- Dados insuficientes
    END IF;

    -- Activity Level: "low", "medium", "high"
    IF profile1.lifestyle_profile->>'activity_level' IS NOT NULL AND profile2.lifestyle_profile->>'activity_level' IS NOT NULL THEN
        num_factors := num_factors + 1;
        IF profile1.lifestyle_profile->>'activity_level' = profile2.lifestyle_profile->>'activity_level' THEN
            score_activity := 1.0;
        ELSIF (profile1.lifestyle_profile->>'activity_level' = 'medium' AND profile2.lifestyle_profile->>'activity_level' IN ('low', 'high')) OR
              (profile2.lifestyle_profile->>'activity_level' = 'medium' AND profile1.lifestyle_profile->>'activity_level' IN ('low', 'high')) THEN
            score_activity := 0.5;
        ELSE
            score_activity := 0.0;
        END IF;
        total_score := total_score + score_activity;
    END IF;

    -- Social Habits: "introverted", "ambivert", "extroverted"
    IF profile1.lifestyle_profile->>'social_habits' IS NOT NULL AND profile2.lifestyle_profile->>'social_habits' IS NOT NULL THEN
        num_factors := num_factors + 1;
        IF profile1.lifestyle_profile->>'social_habits' = profile2.lifestyle_profile->>'social_habits' THEN
            score_social := 1.0;
        ELSIF (profile1.lifestyle_profile->>'social_habits' = 'ambivert' AND profile2.lifestyle_profile->>'social_habits' IN ('introverted', 'extroverted')) OR
              (profile2.lifestyle_profile->>'social_habits' = 'ambivert' AND profile1.lifestyle_profile->>'social_habits' IN ('introverted', 'extroverted')) THEN
            score_social := 0.6; -- Ambivert é mais flexível
        ELSE
            score_social := 0.0;
        END IF;
        total_score := total_score + score_social;
    END IF;
    
    -- Chronotype (Morning Person / Night Owl)
    DECLARE
        p1_morning BOOLEAN := (profile1.lifestyle_profile->>'morning_person')::BOOLEAN;
        p1_night BOOLEAN   := (profile1.lifestyle_profile->>'night_owl')::BOOLEAN;
        p2_morning BOOLEAN := (profile2.lifestyle_profile->>'morning_person')::BOOLEAN;
        p2_night BOOLEAN   := (profile2.lifestyle_profile->>'night_owl')::BOOLEAN;
    BEGIN
        IF p1_morning IS NOT NULL AND p2_morning IS NOT NULL AND p1_night IS NOT NULL AND p2_night IS NOT NULL THEN
            num_factors := num_factors + 1;
            IF (p1_morning = p2_morning) AND (p1_night = p2_night) THEN
                score_chronotype := 1.0; -- Ambos são iguais (ambos morning, ambos night, ou ambos nenhum)
            ELSIF (p1_morning AND p2_night) OR (p1_night AND p2_morning) THEN
                score_chronotype := 0.0; -- Opostos diretos
            ELSE
                score_chronotype := 0.3; -- Um é algo, o outro é neutro ou diferente mas não oposto direto
            END IF;
            total_score := total_score + score_chronotype;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar erro de conversão de booleano, mantém score_chronotype em 0.5
    END;

    IF num_factors = 0 THEN RETURN 0.5; END IF; -- Nenhum fator comparável
    RETURN GREATEST(0.0, LEAST(1.0, total_score / num_factors));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: calculate_values_compatibility
-- Calcula compatibilidade de valores
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_values_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    profile1 user_extended_profiles%ROWTYPE;
    profile2 user_extended_profiles%ROWTYPE;
    priorities1 TEXT[];
    priorities2 TEXT[];
    score_priorities DECIMAL(3,2) := 0.5;
    score_worldview DECIMAL(3,2) := 0.5;
    total_score DECIMAL(3,2) := 0.0;
    num_factors INTEGER := 0;
BEGIN
    SELECT * INTO profile1 FROM user_extended_profiles WHERE user_id = user1_uuid;
    SELECT * INTO profile2 FROM user_extended_profiles WHERE user_id = user2_uuid;

    IF NOT FOUND THEN RETURN 0.5; END IF; -- Um dos perfis não existe

    -- Priorities (assumindo em matching_preferences -> 'values_profile' -> 'priorities' as TEXT[])
    BEGIN
        IF profile1.matching_preferences->'values_profile'->'priorities' IS NOT NULL AND 
           profile2.matching_preferences->'values_profile'->'priorities' IS NOT NULL THEN
            num_factors := num_factors + 1;
            priorities1 := ARRAY(SELECT jsonb_array_elements_text(profile1.matching_preferences->'values_profile'->'priorities'));
            priorities2 := ARRAY(SELECT jsonb_array_elements_text(profile2.matching_preferences->'values_profile'->'priorities'));
            score_priorities := calculate_jaccard_index(priorities1, priorities2);
            total_score := total_score + score_priorities;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar erro se o formato não for array de texto, mantém score_priorities em 0.5
    END;

    -- Worldview (assumindo em matching_preferences -> 'values_profile' -> 'worldview' as TEXT)
    IF profile1.matching_preferences->'values_profile'->>'worldview' IS NOT NULL AND 
       profile2.matching_preferences->'values_profile'->>'worldview' IS NOT NULL THEN
        num_factors := num_factors + 1;
        IF profile1.matching_preferences->'values_profile'->>'worldview' = profile2.matching_preferences->'values_profile'->>'worldview' THEN
            score_worldview := 1.0;
        ELSIF (profile1.matching_preferences->'values_profile'->>'worldview' = 'realistic' AND profile2.matching_preferences->'values_profile'->>'worldview' IN ('optimistic', 'pessimistic')) OR
              (profile2.matching_preferences->'values_profile'->>'worldview' = 'realistic' AND profile1.matching_preferences->'values_profile'->>'worldview' IN ('optimistic', 'pessimistic')) THEN
            score_worldview := 0.5;
        ELSE
            score_worldview := 0.0; -- optimistic vs pessimistic
        END IF;
        total_score := total_score + score_worldview;
    END IF;

    IF num_factors = 0 THEN RETURN 0.5; END IF;
    RETURN GREATEST(0.0, LEAST(1.0, total_score / num_factors));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: calculate_communication_compatibility
-- Calcula compatibilidade de estilo de comunicação
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_communication_compatibility(
    user1_uuid UUID,
    user2_uuid UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    profile1 user_extended_profiles%ROWTYPE;
    profile2 user_extended_profiles%ROWTYPE;
    comm_type1 TEXT;
    comm_type2 TEXT;
    conflict_res1 TEXT;
    conflict_res2 TEXT;
    score_comm_type DECIMAL(3,2) := 0.5;
    score_conflict_res DECIMAL(3,2) := 0.5;
    total_score DECIMAL(3,2) := 0.0;
    num_factors INTEGER := 0;
BEGIN
    SELECT * INTO profile1 FROM user_extended_profiles WHERE user_id = user1_uuid;
    SELECT * INTO profile2 FROM user_extended_profiles WHERE user_id = user2_uuid;

    IF NOT FOUND THEN RETURN 0.5; END IF;

    -- Communication Type (assumindo em matching_preferences -> 'communication_profile' -> 'communication_type' as TEXT)
    comm_type1 := profile1.matching_preferences->'communication_profile'->>'communication_type';
    comm_type2 := profile2.matching_preferences->'communication_profile'->>'communication_type';
    IF comm_type1 IS NOT NULL AND comm_type2 IS NOT NULL THEN
        num_factors := num_factors + 1;
        IF comm_type1 = comm_type2 THEN
            score_comm_type := 1.0;
        ELSIF (comm_type1 = 'direct' AND comm_type2 = 'analytical') OR (comm_type1 = 'analytical' AND comm_type2 = 'direct') THEN
            score_comm_type := 0.8;
        ELSIF (comm_type1 = 'direct' AND comm_type2 = 'supportive') OR (comm_type1 = 'supportive' AND comm_type2 = 'direct') THEN
            score_comm_type := 0.6;
        ELSIF (comm_type1 = 'direct' AND comm_type2 = 'indirect') OR (comm_type1 = 'indirect' AND comm_type2 = 'direct') THEN
            score_comm_type := 0.2;
        ELSIF (comm_type1 = 'analytical' AND comm_type2 = 'supportive') OR (comm_type1 = 'supportive' AND comm_type2 = 'analytical') THEN
            score_comm_type := 0.5;
        ELSIF (comm_type1 = 'analytical' AND comm_type2 = 'indirect') OR (comm_type1 = 'indirect' AND comm_type2 = 'analytical') THEN
            score_comm_type := 0.4;
        ELSIF (comm_type1 = 'supportive' AND comm_type2 = 'indirect') OR (comm_type1 = 'indirect' AND comm_type2 = 'supportive') THEN
            score_comm_type := 0.7;
        ELSE
            score_comm_type := 0.1; -- Combinações não listadas, muito diferentes
        END IF;
        total_score := total_score + score_comm_type;
    END IF;

    -- Conflict Resolution (assumindo em matching_preferences -> 'communication_profile' -> 'conflict_resolution' as TEXT)
    conflict_res1 := profile1.matching_preferences->'communication_profile'->>'conflict_resolution';
    conflict_res2 := profile2.matching_preferences->'communication_profile'->>'conflict_resolution';
    IF conflict_res1 IS NOT NULL AND conflict_res2 IS NOT NULL THEN
        num_factors := num_factors + 1;
        IF conflict_res1 = conflict_res2 THEN
            score_conflict_res := 1.0;
        ELSIF (conflict_res1 = 'collaborative' OR conflict_res2 = 'collaborative') THEN
            score_conflict_res := 0.6; -- Colaborativo é geralmente bom com outros
        ELSIF (conflict_res1 = 'avoidant' AND conflict_res2 = 'competitive') OR (conflict_res1 = 'competitive' AND conflict_res2 = 'avoidant') THEN
            score_conflict_res := 0.0; -- Combinação ruim
        ELSE
            score_conflict_res := 0.3;
        END IF;
        total_score := total_score + score_conflict_res;
    END IF;

    IF num_factors = 0 THEN RETURN 0.5; END IF;
    RETURN GREATEST(0.0, LEAST(1.0, total_score / num_factors));
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- FUNÇÃO: calculate_overall_compatibility
-- Calcula score geral de compatibilidade usando pesos personalizados
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_overall_compatibility(
    user1_uuid UUID,
    user2_uuid UUID,
    algorithm_name VARCHAR DEFAULT 'hybrid'
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    style_score DECIMAL(3,2);
    location_score DECIMAL(3,2);
    emotional_score DECIMAL(3,2) := 0.5; -- Placeholder
    hobby_score DECIMAL(3,2) := 0.5; -- Placeholder
    personality_score DECIMAL(3,2) := 0.5; -- Placeholder
    
    -- Pesos do algoritmo (buscar pesos personalizados do usuário ou usar padrão)
    weights user_algorithm_weights%ROWTYPE;
    overall_score DECIMAL(3,2);
BEGIN
    -- Buscar pesos personalizados do usuário
    SELECT * INTO weights
    FROM user_algorithm_weights
    WHERE user_id = user1_uuid;
    
    -- Se não existir, usar pesos padrão
    IF NOT FOUND THEN
        weights.style_weight := 0.25;
        weights.emotional_weight := 0.20;
        weights.hobby_weight := 0.20;
        weights.location_weight := 0.15;
        weights.personality_weight := 0.20;
        weights.lifestyle_weight := 0.00;
        weights.values_weight := 0.00;
        weights.communication_weight := 0.00;
    END IF;
    
    -- Calcular scores individuais
    style_score := calculate_style_compatibility(user1_uuid, user2_uuid);
    location_score := calculate_location_score(user1_uuid, user2_uuid);
    emotional_score := calculate_emotional_compatibility(user1_uuid, user2_uuid);
    hobby_score := calculate_hobby_compatibility(user1_uuid, user2_uuid);
    personality_score := calculate_personality_compatibility(user1_uuid, user2_uuid);
    
    -- Chamar as novas funções (que atualmente são placeholders)
    DECLARE
        lifestyle_score DECIMAL(3,2);
        values_score DECIMAL(3,2);
        communication_score DECIMAL(3,2);
    BEGIN
        lifestyle_score := calculate_lifestyle_compatibility(user1_uuid, user2_uuid);
        values_score := calculate_values_compatibility(user1_uuid, user2_uuid);
        communication_score := calculate_communication_compatibility(user1_uuid, user2_uuid);
    
        -- Calcular score final ponderado
        overall_score := (
            style_score * weights.style_weight +
            emotional_score * weights.emotional_weight +
            hobby_score * weights.hobby_weight +
            location_score * weights.location_weight +
            personality_score * weights.personality_weight +
            lifestyle_score * COALESCE(weights.lifestyle_weight, 0) +
            values_score * COALESCE(weights.values_weight, 0) +
            communication_score * COALESCE(weights.communication_weight, 0)
        );
    END;
    
    -- Normalizar novamente caso a soma dos pesos não seja exatamente 1 ou scores fora de [0,1]
    -- Embora os pesos devam somar 1 e scores individuais sejam 0-1.
    -- Mas é uma boa prática para garantir.
    -- Se a soma dos pesos usados for S, e S != 1, então overall_score/S normaliza.
    -- No entanto, a constraint na tabela user_algorithm_weights já garante a soma dos pesos.
    
    RETURN GREATEST(0.0, LEAST(1.0, overall_score));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: find_potential_matches
-- Encontra matches potenciais para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION find_potential_matches(
    target_user_uuid UUID,
    limit_count INTEGER DEFAULT 20,
    min_score DECIMAL DEFAULT 0.3,
    max_distance_km DECIMAL DEFAULT 50.0
) RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR,
    city VARCHAR,
    avatar_url TEXT,
    compatibility_score DECIMAL(3,2),
    is_vip BOOLEAN,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.display_name,
        up.city,
        up.avatar_url,
        calculate_overall_compatibility(target_user_uuid, up.user_id) as compatibility_score,
        up.is_vip,
        6371 * acos(
            cos(radians(target_location.latitude)) * cos(radians(up.latitude)) * 
            cos(radians(up.longitude) - radians(target_location.longitude)) + 
            sin(radians(target_location.latitude)) * sin(radians(up.latitude))
        ) as distance_km
    FROM user_profiles up
    CROSS JOIN (
        SELECT latitude, longitude 
        FROM user_profiles 
        WHERE user_id = target_user_uuid
    ) as target_location
    WHERE up.user_id != target_user_uuid
      AND up.is_active = true
      -- Filtro de distância
      AND 6371 * acos(
          cos(radians(target_location.latitude)) * cos(radians(up.latitude)) * 
          cos(radians(up.longitude) - radians(target_location.longitude)) + 
          sin(radians(target_location.latitude)) * sin(radians(up.latitude))
      ) <= max_distance_km
      -- Excluir usuários já interagidos
      AND up.user_id NOT IN (
          SELECT target_user_id 
          FROM user_interactions 
          WHERE user_id = target_user_uuid
            AND created_at > NOW() - INTERVAL '7 days'
      )
      -- Filtro de qualidade mínima do perfil
      AND EXISTS (
          SELECT 1 FROM user_extended_profiles uep
          WHERE uep.user_id = up.user_id
            AND uep.profile_completeness >= 0.5
      )
    ORDER BY calculate_overall_compatibility(target_user_uuid, up.user_id) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: record_interaction_with_learning
-- Registra interação e atualiza aprendizado do usuário
-- =====================================================
CREATE OR REPLACE FUNCTION record_interaction_with_learning(
    p_user_id UUID,
    p_target_user_id UUID,
    p_action VARCHAR,
    p_context JSONB DEFAULT '{}',
    p_match_score DECIMAL DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
    v_chosen_item_id UUID;
    v_rejected_item_id UUID;
    v_category VARCHAR(50);
    learning_adjustment DECIMAL := 0.02; -- Ajuste pequeno nos pesos
BEGIN
    IF p_action = 'style_preference_chosen' THEN
        -- Extrair dados do contexto para escolhas de estilo
        v_category := p_context->>'category';
        v_chosen_item_id := (p_context->>'chosenItemId')::UUID;
        v_rejected_item_id := (p_context->>'rejectedItemId')::UUID;

        -- Inserir na tabela style_choices
        -- Se uma escolha para o mesmo usuário e mesmos itens já existir, atualiza o timestamp.
        -- Isso permite que a escolha mais recente seja considerada.
        INSERT INTO style_choices (user_id, category, chosen_evaluation_item_id, rejected_evaluation_item_id, context, created_at, updated_at)
        VALUES (p_user_id, v_category, v_chosen_item_id, v_rejected_item_id, p_context, NOW(), NOW())
        ON CONFLICT (user_id, category, chosen_evaluation_item_id, rejected_evaluation_item_id) -- Assumindo que esta constraint será adicionada
        DO UPDATE SET 
            updated_at = NOW(),
            context = p_context -- Atualiza o contexto se necessário (ex: tempo de resposta)
        RETURNING id INTO interaction_id; -- Retorna o ID da style_choice

        -- A lógica de aprendizado de user_algorithm_weights pode ser mais específica aqui
        -- Por exemplo, se a categoria for 'Clothing', talvez ajustar um sub-peso para 'clothing_style_weight'
        -- Por enquanto, mantemos o ajuste genérico do style_weight se quisermos.
        -- Ou podemos remover o ajuste de peso daqui e centralizar em outro processo.
        -- Para este exemplo, vamos manter um ajuste simples no style_weight geral.
        UPDATE user_algorithm_weights
        SET 
            style_weight = LEAST(0.5, style_weight + (learning_adjustment * 0.5)), -- Menor ajuste para preferência de item
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        INSERT INTO user_algorithm_weights (user_id, style_weight)
        VALUES (p_user_id, 0.25 + (learning_adjustment * 0.5)) -- Valor inicial se não existir
        ON CONFLICT (user_id) DO NOTHING;

    ELSE
        -- Lógica original para interações user-user
        -- Inserir a interação
        INSERT INTO user_interactions (
            user_id, target_user_id, action, context, match_score, session_id
        ) VALUES (
            p_user_id, p_target_user_id, p_action, p_context, p_match_score, p_session_id
        ) 
        ON CONFLICT (user_id, target_user_id) 
        DO UPDATE SET 
            action = EXCLUDED.action,
            context = EXCLUDED.context,
            match_score = EXCLUDED.match_score,
            updated_at = NOW()
        RETURNING id INTO interaction_id;
        
        -- Atualizar aprendizado baseado no feedback user-user
        IF p_action IN ('like', 'super_like') THEN
        -- Feedback positivo: aumentar peso das dimensões que contribuíram
        UPDATE user_algorithm_weights
        SET 
            style_weight = LEAST(0.5, style_weight + learning_adjustment),
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Se não existir registro de pesos, criar um
        INSERT INTO user_algorithm_weights (user_id)
        VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
    ELSIF p_action = 'dislike' THEN
        -- Feedback negativo: diminuir levemente os pesos
        UPDATE user_algorithm_weights
        SET 
            style_weight = GREATEST(0.1, style_weight - (learning_adjustment * 0.5)),
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Atualizar perfil de aprendizado
    INSERT INTO user_learning_profile (user_id, total_learning_events, last_learning_update)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_learning_events = user_learning_profile.total_learning_events + 1,
        last_learning_update = NOW(),
        learning_velocity = LEAST(1.0, user_learning_profile.learning_velocity + 0.01);
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: get_user_engagement_metrics
-- Calcula métricas de engajamento para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
    p_user_id UUID,
    p_period_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_sessions INTEGER,
    total_interactions INTEGER,
    average_session_duration INTEGER,
    engagement_rate DECIMAL(5,4),
    match_rate DECIMAL(5,4),
    response_rate DECIMAL(5,4)
) AS $$
DECLARE
    period_start TIMESTAMP := NOW() - (p_period_days || ' days')::INTERVAL;
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT 
            COUNT(DISTINCT session_id) as sessions,
            COUNT(*) as interactions,
            AVG(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) * 1000)::INTEGER as avg_duration
        FROM user_interactions
        WHERE user_id = p_user_id
          AND created_at >= period_start
    ),
    match_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE action IN ('like', 'super_like')) as likes_given,
            COUNT(*) as total_actions
        FROM user_interactions
        WHERE user_id = p_user_id
          AND created_at >= period_start
    )
    SELECT 
        COALESCE(ss.sessions, 0)::INTEGER,
        COALESCE(ss.interactions, 0)::INTEGER,
        COALESCE(ss.avg_duration, 0)::INTEGER,
        CASE 
            WHEN ss.interactions > 0 THEN (ss.interactions::DECIMAL / GREATEST(ss.sessions, 1))
            ELSE 0.0
        END::DECIMAL(5,4),
        CASE 
            WHEN ms.total_actions > 0 THEN (ms.likes_given::DECIMAL / ms.total_actions)
            ELSE 0.0
        END::DECIMAL(5,4),
        0.5::DECIMAL(5,4) -- Placeholder para response_rate
    FROM session_stats ss
    CROSS JOIN match_stats ms;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: cleanup_expired_scores
-- Remove scores expirados para liberar espaço
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_scores()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM match_scores 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO analytics_events (
        event_type, event_name, properties, source
    ) VALUES (
        'system_event', 
        'cleanup_expired_scores',
        jsonb_build_object('deleted_count', deleted_count),
        'background_job'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUTO-UPDATE
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_user_extended_profiles_updated_at 
    BEFORE UPDATE ON user_extended_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_algorithm_weights_updated_at 
    BEFORE UPDATE ON user_algorithm_weights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_interactions_updated_at 
    BEFORE UPDATE ON user_interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_profile_updated_at 
    BEFORE UPDATE ON user_learning_profile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION calculate_style_compatibility IS 'Calcula compatibilidade de estilo entre dois usuários baseado em escolhas comuns';
COMMENT ON FUNCTION calculate_location_score IS 'Calcula score de proximidade geográfica com decaimento exponencial';
COMMENT ON FUNCTION calculate_overall_compatibility IS 'Score principal de compatibilidade usando pesos personalizados';
COMMENT ON FUNCTION find_potential_matches IS 'Encontra candidatos potenciais para recomendação com filtros de qualidade';
COMMENT ON FUNCTION record_interaction_with_learning IS 'Registra interação e atualiza aprendizado automático dos pesos';
COMMENT ON FUNCTION get_user_engagement_metrics IS 'Calcula métricas de engajamento para analytics';
COMMENT ON FUNCTION cleanup_expired_scores IS 'Remove scores expirados para otimização de armazenamento';
    compatibility_score := (common_choices::DECIMAL / total_categories::DECIMAL);
    
    -- Garantir que está entre 0 e 1
    RETURN GREATEST(0.0, LEAST(1.0, compatibility_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_location_score
-- Calcula score baseado na proximidade geográfica
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_location_score(
    user1_uuid UUID,
    user2_uuid UUID,
    max_distance_km DECIMAL DEFAULT 50.0
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    user1_lat DECIMAL;
    user1_lng DECIMAL;
    user2_lat DECIMAL;
    user2_lng DECIMAL;
    distance_km DECIMAL;
    location_score DECIMAL(3,2);
BEGIN
    -- Buscar coordenadas dos usuários (assumindo que estão em user_profiles)
    SELECT latitude, longitude INTO user1_lat, user1_lng
    FROM user_profiles up1
    WHERE up1.user_id = user1_uuid;
    
    SELECT latitude, longitude INTO user2_lat, user2_lng
    FROM user_profiles up2
    WHERE up2.user_id = user2_uuid;
    
    -- Se não tiver dados de localização, retornar score neutro
    IF user1_lat IS NULL OR user2_lat IS NULL THEN
        RETURN 0.5;
    END IF;
    
    -- Calcular distância usando fórmula de Haversine (simplificada)
    distance_km := 6371 * acos(
        cos(radians(user1_lat)) * cos(radians(user2_lat)) * 
        cos(radians(user2_lng) - radians(user1_lng)) + 
        sin(radians(user1_lat)) * sin(radians(user2_lat))
    );
    
    -- Score decresce exponencialmente com a distância
    location_score := exp(-distance_km / (max_distance_km * 0.5));
    
    RETURN GREATEST(0.0, LEAST(1.0, location_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNÇÃO: calculate_overall_compatibility
-- Calcula score geral de compatibilidade usando pesos personalizados
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_overall_compatibility(
    user1_uuid UUID,
    user2_uuid UUID,
    algorithm_name VARCHAR DEFAULT 'hybrid'
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    style_score DECIMAL(3,2);
    location_score DECIMAL(3,2);
    emotional_score DECIMAL(3,2) := 0.5; -- Placeholder
    hobby_score DECIMAL(3,2) := 0.5; -- Placeholder
    personality_score DECIMAL(3,2) := 0.5; -- Placeholder
    
    -- Pesos do algoritmo (buscar pesos personalizados do usuário ou usar padrão)
    weights user_algorithm_weights%ROWTYPE;
    overall_score DECIMAL(3,2);
BEGIN
    -- Buscar pesos personalizados do usuário
    SELECT * INTO weights
    FROM user_algorithm_weights
    WHERE user_id = user1_uuid;
    
    -- Se não existir, usar pesos padrão
    IF NOT FOUND THEN
        weights.style_weight := 0.25;
        weights.emotional_weight := 0.20;
        weights.hobby_weight := 0.20;
        weights.location_weight := 0.15;
        weights.personality_weight := 0.20;
        weights.lifestyle_weight := 0.00;
        weights.values_weight := 0.00;
        weights.communication_weight := 0.00;
    END IF;
    
    -- Calcular scores individuais
    style_score := calculate_style_compatibility(user1_uuid, user2_uuid);
    location_score := calculate_location_score(user1_uuid, user2_uuid);
    
    -- TODO: Implementar cálculos para outras dimensões
    -- emotional_score := calculate_emotional_compatibility(user1_uuid, user2_uuid);
    -- hobby_score := calculate_hobby_compatibility(user1_uuid, user2_uuid);
    -- personality_score := calculate_personality_compatibility(user1_uuid, user2_uuid);
    
    -- Calcular score final ponderado
    overall_score := (
        style_score * weights.style_weight +
        emotional_score * weights.emotional_weight +
        hobby_score * weights.hobby_weight +
        location_score * weights.location_weight +
        personality_score * weights.personality_weight +
        0.5 * weights.lifestyle_weight + -- Placeholder
        0.5 * weights.values_weight + -- Placeholder
        0.5 * weights.communication_weight -- Placeholder
    );
    
    RETURN GREATEST(0.0, LEAST(1.0, overall_score));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: find_potential_matches
-- Encontra matches potenciais para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION find_potential_matches(
    target_user_uuid UUID,
    limit_count INTEGER DEFAULT 20,
    min_score DECIMAL DEFAULT 0.3,
    max_distance_km DECIMAL DEFAULT 50.0
) RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR,
    city VARCHAR,
    avatar_url TEXT,
    compatibility_score DECIMAL(3,2),
    is_vip BOOLEAN,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.display_name,
        up.city,
        up.avatar_url,
        calculate_overall_compatibility(target_user_uuid, up.user_id) as compatibility_score,
        up.is_vip,
        6371 * acos(
            cos(radians(target_location.latitude)) * cos(radians(up.latitude)) * 
            cos(radians(up.longitude) - radians(target_location.longitude)) + 
            sin(radians(target_location.latitude)) * sin(radians(up.latitude))
        ) as distance_km
    FROM user_profiles up
    CROSS JOIN (
        SELECT latitude, longitude 
        FROM user_profiles 
        WHERE user_id = target_user_uuid
    ) as target_location
    WHERE up.user_id != target_user_uuid
      AND up.is_active = true
      -- Filtro de distância
      AND 6371 * acos(
          cos(radians(target_location.latitude)) * cos(radians(up.latitude)) * 
          cos(radians(up.longitude) - radians(target_location.longitude)) + 
          sin(radians(target_location.latitude)) * sin(radians(up.latitude))
      ) <= max_distance_km
      -- Excluir usuários já interagidos
      AND up.user_id NOT IN (
          SELECT target_user_id 
          FROM user_interactions 
          WHERE user_id = target_user_uuid
            AND created_at > NOW() - INTERVAL '7 days'
      )
      -- Filtro de qualidade mínima do perfil
      AND EXISTS (
          SELECT 1 FROM user_extended_profiles uep
          WHERE uep.user_id = up.user_id
            AND uep.profile_completeness >= 0.5
      )
    ORDER BY calculate_overall_compatibility(target_user_uuid, up.user_id) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: record_interaction_with_learning
-- Registra interação e atualiza aprendizado do usuário
-- =====================================================
CREATE OR REPLACE FUNCTION record_interaction_with_learning(
    p_user_id UUID,
    p_target_user_id UUID,
    p_action VARCHAR,
    p_context JSONB DEFAULT '{}',
    p_match_score DECIMAL DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
    v_chosen_item_id UUID;
    v_rejected_item_id UUID;
    v_category VARCHAR(50);
    learning_adjustment DECIMAL := 0.02; -- Ajuste pequeno nos pesos
BEGIN
    IF p_action = 'style_preference_chosen' THEN
        -- Extrair dados do contexto para escolhas de estilo
        v_category := p_context->>'category';
        v_chosen_item_id := (p_context->>'chosenItemId')::UUID;
        v_rejected_item_id := (p_context->>'rejectedItemId')::UUID;

        -- Inserir na tabela style_choices
        -- Se uma escolha para o mesmo usuário e mesmos itens já existir, atualiza o timestamp.
        -- Isso permite que a escolha mais recente seja considerada.
        INSERT INTO style_choices (user_id, category, chosen_evaluation_item_id, rejected_evaluation_item_id, context, created_at, updated_at)
        VALUES (p_user_id, v_category, v_chosen_item_id, v_rejected_item_id, p_context, NOW(), NOW())
        ON CONFLICT (user_id, category, chosen_evaluation_item_id, rejected_evaluation_item_id) -- Assumindo que esta constraint será adicionada
        DO UPDATE SET 
            updated_at = NOW(),
            context = p_context -- Atualiza o contexto se necessário (ex: tempo de resposta)
        RETURNING id INTO interaction_id; -- Retorna o ID da style_choice

        -- A lógica de aprendizado de user_algorithm_weights pode ser mais específica aqui
        -- Por exemplo, se a categoria for 'Clothing', talvez ajustar um sub-peso para 'clothing_style_weight'
        -- Por enquanto, mantemos o ajuste genérico do style_weight se quisermos.
        -- Ou podemos remover o ajuste de peso daqui e centralizar em outro processo.
        -- Para este exemplo, vamos manter um ajuste simples no style_weight geral.
        UPDATE user_algorithm_weights
        SET 
            style_weight = LEAST(0.5, style_weight + (learning_adjustment * 0.5)), -- Menor ajuste para preferência de item
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        INSERT INTO user_algorithm_weights (user_id, style_weight)
        VALUES (p_user_id, 0.25 + (learning_adjustment * 0.5)) -- Valor inicial se não existir
        ON CONFLICT (user_id) DO NOTHING;

    ELSE
        -- Lógica original para interações user-user
        -- Inserir a interação
        INSERT INTO user_interactions (
            user_id, target_user_id, action, context, match_score, session_id
        ) VALUES (
            p_user_id, p_target_user_id, p_action, p_context, p_match_score, p_session_id
        ) 
        ON CONFLICT (user_id, target_user_id) 
        DO UPDATE SET 
            action = EXCLUDED.action,
            context = EXCLUDED.context,
            match_score = EXCLUDED.match_score,
            updated_at = NOW()
        RETURNING id INTO interaction_id;
        
        -- Atualizar aprendizado baseado no feedback user-user
        IF p_action IN ('like', 'super_like') THEN
        -- Feedback positivo: aumentar peso das dimensões que contribuíram
        UPDATE user_algorithm_weights
        SET 
            style_weight = LEAST(0.5, style_weight + learning_adjustment),
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Se não existir registro de pesos, criar um
        INSERT INTO user_algorithm_weights (user_id)
        VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
    ELSIF p_action = 'dislike' THEN
        -- Feedback negativo: diminuir levemente os pesos
        UPDATE user_algorithm_weights
        SET 
            style_weight = GREATEST(0.1, style_weight - (learning_adjustment * 0.5)),
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Atualizar perfil de aprendizado
    INSERT INTO user_learning_profile (user_id, total_learning_events, last_learning_update)
    VALUES (p_user_id, 1, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_learning_events = user_learning_profile.total_learning_events + 1,
        last_learning_update = NOW(),
        learning_velocity = LEAST(1.0, user_learning_profile.learning_velocity + 0.01);
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: get_user_engagement_metrics
-- Calcula métricas de engajamento para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
    p_user_id UUID,
    p_period_days INTEGER DEFAULT 30
) RETURNS TABLE (
    total_sessions INTEGER,
    total_interactions INTEGER,
    average_session_duration INTEGER,
    engagement_rate DECIMAL(5,4),
    match_rate DECIMAL(5,4),
    response_rate DECIMAL(5,4)
) AS $$
DECLARE
    period_start TIMESTAMP := NOW() - (p_period_days || ' days')::INTERVAL;
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT 
            COUNT(DISTINCT session_id) as sessions,
            COUNT(*) as interactions,
            AVG(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) * 1000)::INTEGER as avg_duration
        FROM user_interactions
        WHERE user_id = p_user_id
          AND created_at >= period_start
    ),
    match_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE action IN ('like', 'super_like')) as likes_given,
            COUNT(*) as total_actions
        FROM user_interactions
        WHERE user_id = p_user_id
          AND created_at >= period_start
    )
    SELECT 
        COALESCE(ss.sessions, 0)::INTEGER,
        COALESCE(ss.interactions, 0)::INTEGER,
        COALESCE(ss.avg_duration, 0)::INTEGER,
        CASE 
            WHEN ss.interactions > 0 THEN (ss.interactions::DECIMAL / GREATEST(ss.sessions, 1))
            ELSE 0.0
        END::DECIMAL(5,4),
        CASE 
            WHEN ms.total_actions > 0 THEN (ms.likes_given::DECIMAL / ms.total_actions)
            ELSE 0.0
        END::DECIMAL(5,4),
        0.5::DECIMAL(5,4) -- Placeholder para response_rate
    FROM session_stats ss
    CROSS JOIN match_stats ms;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO: cleanup_expired_scores
-- Remove scores expirados para liberar espaço
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_scores()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM match_scores 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO analytics_events (
        event_type, event_name, properties, source
    ) VALUES (
        'system_event', 
        'cleanup_expired_scores',
        jsonb_build_object('deleted_count', deleted_count),
        'background_job'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUTO-UPDATE
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_user_extended_profiles_updated_at 
    BEFORE UPDATE ON user_extended_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_algorithm_weights_updated_at 
    BEFORE UPDATE ON user_algorithm_weights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_interactions_updated_at 
    BEFORE UPDATE ON user_interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_learning_profile_updated_at 
    BEFORE UPDATE ON user_learning_profile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION calculate_style_compatibility IS 'Calcula compatibilidade de estilo entre dois usuários baseado em escolhas comuns';
COMMENT ON FUNCTION calculate_location_score IS 'Calcula score de proximidade geográfica com decaimento exponencial';
COMMENT ON FUNCTION calculate_overall_compatibility IS 'Score principal de compatibilidade usando pesos personalizados';
COMMENT ON FUNCTION find_potential_matches IS 'Encontra candidatos potenciais para recomendação com filtros de qualidade';
COMMENT ON FUNCTION record_interaction_with_learning IS 'Registra interação e atualiza aprendizado automático dos pesos';
COMMENT ON FUNCTION get_user_engagement_metrics IS 'Calcula métricas de engajamento para analytics';
COMMENT ON FUNCTION cleanup_expired_scores IS 'Remove scores expirados para otimização de armazenamento';
