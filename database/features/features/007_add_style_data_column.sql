-- Migration para adicionar coluna style_data na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN style_data JSONB;

-- Atualiza os registros existentes com os dados das colunas atuais
UPDATE user_profiles
SET style_data = jsonb_build_object(
  'display_name', display_name,
  'city', city,
  'gender', gender,
  'age', age,
  'style_completion_percentage', style_completion_percentage,
  'is_vip', is_vip,
  'bio', COALESCE(bio, '')
);