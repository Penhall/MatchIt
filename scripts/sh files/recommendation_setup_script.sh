# scripts/setup-recommendation-system.sh
#!/bin/bash

# Script para criar estrutura completa do Sistema de Recomendação - MatchIt
# Autor: Sistema de Recomendação MatchIt
# Data: $(date)

echo "🚀 Configurando Sistema de Recomendação MatchIt..."

# Criar diretórios principais se não existirem
echo "📁 Criando estrutura de diretórios..."

# Types e interfaces
mkdir -p types/recommendation
mkdir -p types/analytics

# Services e engines
mkdir -p services/recommendation
mkdir -p services/analytics

# API routes
mkdir -p routes/recommendation

# Hooks React
mkdir -p hooks/recommendation

# Componentes React
mkdir -p components/recommendation
mkdir -p components/analytics

# Database migrations
mkdir -p scripts/migrations/recommendation

# Utils e helpers
mkdir -p utils/recommendation
mkdir -p utils/analytics

# Testes
mkdir -p tests/recommendation
mkdir -p tests/analytics

# Config
mkdir -p config/recommendation

echo "✅ Estrutura de diretórios criada!"

# Lista de arquivos que serão criados
echo "📝 Arquivos que serão implementados:"

echo ""
echo "=== FASE 1: Adequação da Base ==="

echo "📁 Types/Interfaces:"
echo "  - types/recommendation/base.ts"
echo "  - types/recommendation/extended-user.ts" 
echo "  - types/recommendation/match-score.ts"
echo "  - types/recommendation/user-interaction.ts"
echo "  - types/recommendation/index.ts"

echo "📁 Database Extensions:"
echo "  - scripts/migrations/recommendation/001_extend_user_profiles.sql"
echo "  - scripts/migrations/recommendation/002_create_interactions_table.sql"
echo "  - scripts/migrations/recommendation/003_create_algorithm_weights.sql"
echo "  - scripts/migrations/recommendation/004_create_recommendation_cache.sql"

echo "📁 Backend Extensions:"
echo "  - routes/recommendation/feedback.ts"
echo "  - routes/recommendation/preferences.ts"
echo "  - services/recommendation/user-profile-service.ts"

echo ""
echo "=== FASE 2: Engine de Recomendação ==="

echo "📁 Core Engine:"
echo "  - services/recommendation/recommendation-engine.ts"
echo "  - services/recommendation/recommendation-service.ts"
echo "  - services/recommendation/algorithm-weights.ts"

echo "📁 API Routes:"
echo "  - routes/recommendation/recommendations.ts"
echo "  - routes/recommendation/index.ts"

echo ""
echo "=== FASE 3: Sistema de Feedback ==="

echo "📁 Frontend Components:"
echo "  - components/recommendation/recommendation-card.tsx"
echo "  - components/recommendation/recommendation-list.tsx"
echo "  - components/recommendation/feedback-buttons.tsx"

echo "📁 React Hooks:"
echo "  - hooks/recommendation/use-recommendations.ts"
echo "  - hooks/recommendation/use-feedback.ts"

echo "📁 Analytics:"
echo "  - services/analytics/recommendation-analytics.ts"
echo "  - components/analytics/recommendation-dashboard.tsx"

echo ""
echo "=== FASE 4: Otimizações Avançadas ==="

echo "📁 Performance:"
echo "  - services/recommendation/cache-service.ts"
echo "  - utils/recommendation/query-optimizer.ts"

echo "📁 Advanced Features:"
echo "  - services/recommendation/ml-service.ts"
echo "  - components/recommendation/advanced-filters.tsx"

echo ""
echo "📁 Configuration:"
echo "  - config/recommendation/algorithm-config.ts"
echo "  - config/recommendation/cache-config.ts"

echo ""
echo "📁 Tests:"
echo "  - tests/recommendation/engine.test.ts"
echo "  - tests/recommendation/service.test.ts"
echo "  - tests/recommendation/api.test.ts"

echo ""
echo "📁 Utils:"
echo "  - utils/recommendation/similarity-calculations.ts"
echo "  - utils/recommendation/geo-utils.ts"
echo "  - utils/analytics/metrics-calculator.ts"

echo ""
echo "🎯 Total estimado: ~30 arquivos a serem criados ao longo das 4 fases"
echo ""

# Verificar dependências necessárias
echo "📦 Verificando dependências do projeto..."

# Verificar se existe package.json
if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
else
    echo "❌ package.json não encontrado - execute na raiz do projeto"
    exit 1
fi

# Verificar se existe estrutura básica
if [ -d "components" ] && [ -d "types" ] && [ -d "services" ]; then
    echo "✅ Estrutura básica do projeto confirmada"
else
    echo "⚠️  Algumas pastas básicas não foram encontradas - será criada estrutura completa"
fi

# Criar arquivo de progresso
echo "📊 Criando arquivo de progresso..."
cat > .recommendation-system-progress.md << EOF
# Sistema de Recomendação MatchIt - Progresso da Implementação

## Status Geral: 🟡 Em Andamento

### FASE 1: Adequação da Base ⏳
- [ ] 1.1 Extensão de Tipos
- [ ] 1.2 Extensão do Banco
- [ ] 1.3 Adaptação do Backend

### FASE 2: Engine de Recomendação Básico ⏸️
- [ ] 2.1 RecommendationEngine Core
- [ ] 2.2 RecommendationService
- [ ] 2.3 APIs de Recomendação

### FASE 3: Sistema de Feedback e Aprendizado ⏸️
- [ ] 3.1 Coleta de Feedback
- [ ] 3.2 Pesos Adaptativos
- [ ] 3.3 Melhorias de UX

### FASE 4: Otimizações e Features Avançadas ⏸️
- [ ] 4.1 Performance
- [ ] 4.2 Analytics Avançados
- [ ] 4.3 Features Sociais

---
Última atualização: $(date)
EOF

echo "✅ Arquivo de progresso criado: .recommendation-system-progress.md"

# Verificar dependências NPM que serão necessárias
echo ""
echo "📦 Dependências que serão necessárias:"
echo "Production:"
echo "  - @types/node (já instalado)"
echo "  - uuid (para IDs únicos)"
echo "  - date-fns (para manipulação de datas)"
echo "  - lodash (para manipulação de arrays)"

echo ""
echo "Development:"
echo "  - @types/uuid"
echo "  - @types/lodash"
echo "  - jest (para testes)"
echo "  - @types/jest"

echo ""
echo "Optional (Fase 4):"
echo "  - redis (para cache avançado)"
echo "  - bull (para jobs assíncronos)"
echo "  - prometheus-api-metrics (para monitoramento)"

echo ""
echo "🎉 Setup concluído! Execute os próximos comandos conforme os arquivos forem criados."
echo ""
echo "📋 Próximos passos:"
echo "1. Implementar tipos base (Fase 1.1)"
echo "2. Executar migrações de banco (Fase 1.2)" 
echo "3. Implementar extensões de backend (Fase 1.3)"
echo "4. Testar compatibilidade com sistema atual"
echo ""
echo "💡 Dica: Acompanhe o progresso no arquivo .recommendation-system-progress.md"