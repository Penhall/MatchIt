-- =====================================================
-- MIGRATION 005: TABELA style_choices
-- =====================================================
-- Versão: 1.0.0
-- Autor: Cline
-- Data: 2025-06-11
-- Descrição: Criação da tabela para armazenar as escolhas de estilo dos usuários
--            feitas na tela de "Style Adjustment".

-- Extensão para UUID (caso não exista, embora já deva existir de MIGRATION 001)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: style_choices
-- Armazena as escolhas de estilo feitas pelo usuário.
-- Cada linha representa uma escolha em uma categoria específica.
-- =====================================================
CREATE TABLE IF NOT EXISTS style_choices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Categoria da escolha (ex: 'Clothing', 'Colors', 'Hobbies', 'Feelings', 'Sneakers')
    -- Idealmente, isso seria um ENUM ou FK para uma tabela de categorias, mas VARCHAR é flexível.
    category VARCHAR(50) NOT NULL, 
    
    -- ID do EvaluationItem que foi escolhido pelo usuário
    chosen_evaluation_item_id UUID NOT NULL REFERENCES evaluation_items(id) ON DELETE CASCADE,
    
    -- ID do EvaluationItem que foi rejeitado/não escolhido na mesma pergunta/par
    rejected_evaluation_item_id UUID NOT NULL REFERENCES evaluation_items(id) ON DELETE CASCADE,
    
    -- Contexto adicional da escolha, se necessário (ex: ID da pergunta, tempo de resposta)
    context JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Para registrar se a escolha foi 'refeita'
    
    -- Constraint para evitar escolhas idênticas (mesmo usuário, mesma categoria, mesmos itens)
    -- No entanto, um usuário pode refazer escolhas, então uma constraint de unicidade aqui
    -- pode ser muito restritiva. A lógica de "última escolha" pode ser gerenciada pela aplicação.
    -- Por ora, vamos permitir múltiplas entradas e a SP `calculate_style_compatibility`
    -- pode pegar a mais recente ou a mais frequente.
    -- UNIQUE(user_id, category, chosen_evaluation_item_id, rejected_evaluation_item_id) -- Comentado por enquanto
    -- Adicionando a constraint UNIQUE para que o ON CONFLICT na SP record_interaction_with_learning funcione.
    -- Isso significa que para um mesmo usuário, mesma categoria e mesmo par de itens (escolhido e rejeitado),
    -- só pode haver uma entrada. Se o usuário interagir novamente com o mesmo par, a entrada existente será atualizada.
    CONSTRAINT unique_style_choice_interaction UNIQUE(user_id, category, chosen_evaluation_item_id, rejected_evaluation_item_id),

    -- Constraint para garantir que o item escolhido e rejeitado não sejam o mesmo
    CHECK (chosen_evaluation_item_id != rejected_evaluation_item_id)
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_style_choices_user_id ON style_choices(user_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_category ON style_choices(category);
CREATE INDEX IF NOT EXISTS idx_style_choices_chosen_item ON style_choices(chosen_evaluation_item_id);
CREATE INDEX IF NOT EXISTS idx_style_choices_user_category ON style_choices(user_id, category);

-- Trigger para atualizar updated_at automaticamente (se a função já não existir de MIGRATION 003)
CREATE OR REPLACE FUNCTION update_updated_at_column_style_choices()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_style_choices_updated_at
    BEFORE UPDATE ON style_choices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_style_choices();

-- Comentários para documentação
COMMENT ON TABLE style_choices IS 'Armazena as escolhas de estilo feitas pelo usuário na tela de "Style Adjustment", onde um item é preferido sobre outro dentro de uma categoria.';
COMMENT ON COLUMN style_choices.user_id IS 'ID do usuário que fez a escolha.';
COMMENT ON COLUMN style_choices.category IS 'Categoria de estilo da escolha (ex: Clothing, Colors).';
COMMENT ON COLUMN style_choices.chosen_evaluation_item_id IS 'ID do EvaluationItem que foi escolhido.';
COMMENT ON COLUMN style_choices.rejected_evaluation_item_id IS 'ID do EvaluationItem que foi rejeitado na mesma apresentação.';
COMMENT ON COLUMN style_choices.context IS 'Contexto adicional da escolha (JSONB).';

-- Adicionar referência à tabela evaluation_items (criada pelo módulo administrativo)
-- Se evaluation_items ainda não existe, esta migração falhará.
-- Assumindo que evaluation_items já foi criada com uma coluna `id UUID PRIMARY KEY`.
-- Se o nome da tabela ou da PK for diferente, ajuste as FKs acima.
-- Exemplo de criação de evaluation_items (para referência, não executar aqui):
-- CREATE TABLE IF NOT EXISTS evaluation_items (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     category VARCHAR(50) NOT NULL,
--     image_url TEXT,
--     description TEXT,
--     active BOOLEAN DEFAULT true,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
