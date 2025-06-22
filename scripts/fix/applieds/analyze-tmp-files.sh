#!/bin/bash

# scripts/analyze-tmp-files.sh
# Script para analisar os arquivos baixados em server/0-tmp

echo "🔍 Analisando arquivos em server/0-tmp..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_found() { echo -e "${GREEN}✅ $1${NC}"; }
print_missing() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_duplicate() { echo -e "${YELLOW}⚠️ $1${NC}"; }

# Verificar se a pasta existe
if [ ! -d "server/0-tmp" ]; then
    echo "❌ Pasta server/0-tmp não encontrada"
    echo "Por favor, baixe os artefatos primeiro"
    exit 1
fi

echo ""
print_info "Arquivos encontrados em server/0-tmp:"
echo "========================================"

# Listar todos os arquivos
file_count=0
for file in server/0-tmp/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Ler primeira linha para tentar identificar o arquivo correto
        first_line=$(head -n1 "$file" 2>/dev/null || echo "")
        
        # Ler algumas linhas para identificar o tipo
        content=$(head -n5 "$file" 2>/dev/null || echo "")
        
        echo ""
        echo "📄 $filename"
        
        # Tentar extrair o caminho correto da primeira linha
        if [[ "$first_line" =~ //[[:space:]]*([^[:space:]]+\.[a-z]+) ]]; then
            correct_path="${BASH_REMATCH[1]}"
            print_found "  Caminho detectado: $correct_path"
        elif [[ "$first_line" =~ server/([^[:space:]]+\.[a-z]+) ]]; then
            correct_path="server/${BASH_REMATCH[1]}"
            print_found "  Caminho detectado: $correct_path"
        else
            print_missing "  Caminho não detectado na primeira linha"
            echo "  Primeira linha: $first_line"
        fi
        
        # Identificar tipo do arquivo
        if [[ "$content" =~ "#!/bin/bash" ]]; then
            echo "  🔧 Tipo: Script Bash"
        elif [[ "$content" =~ "FROM node:" ]]; then
            echo "  🐳 Tipo: Dockerfile"
        elif [[ "$content" =~ "export.*class" ]] || [[ "$content" =~ "import.*from" ]]; then
            echo "  📄 Tipo: JavaScript/Node.js"
        elif [[ "$content" =~ "{.*\"name\":" ]] && [[ "$content" =~ "\"version\":" ]]; then
            echo "  📦 Tipo: package.json"
        elif [[ "$content" =~ "# " ]] && [[ "$filename" =~ \.md$ ]]; then
            echo "  📝 Tipo: Markdown"
        else
            echo "  ❓ Tipo: Desconhecido"
        fi
        
        # Mostrar tamanho do arquivo
        file_size=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo "  📏 Linhas: $file_size"
        
        ((file_count++))
    fi
done

echo ""
echo "========================================"
print_info "Total de arquivos encontrados: $file_count"

echo ""
print_info "Mapeamento automático sugerido:"
echo "========================================"

# Mapear arquivos conhecidos pelos nomes dos artefatos
declare -A SUGGESTED_MAPPING=(
    ["database_config_fixed"]="server/config/database.js"
    ["product_service_fixed"]="server/services/productService.js"
    ["subscription_service_fixed"]="server/services/subscriptionService.js"
    ["stats_service_fixed"]="server/services/statsService.js"
    ["chat_service_fixed"]="server/services/chatService.js"
    ["recommendation_service_fixed"]="server/services/recommendationService.js"
    ["match_service_fixed"]="server/services/matchService.js"
    ["constants_fixed"]="server/utils/constants.js"
    ["helpers_fixed"]="server/utils/helpers.js"
    ["cors_config_fixed"]="server/config/cors.js"
    ["environment_config_fixed"]="server/config/environment.js"
    ["profile_service_missing"]="server/services/profileService.js"
    ["auth_service_complete"]="server/services/authService.js"
    ["profile_routes_fixed"]="server/routes/profile.js"
    ["routes_index_fixed"]="server/routes/index.js"
    ["subscription_routes_real"]="server/routes/subscription.js"
    ["stats_routes_real"]="server/routes/stats.js"
    ["app_js_fixed"]="server/app.js"
    ["dockerfile_backend_updated"]="Dockerfile.backend"
    ["package_json_updated"]="package.json"
    ["migration_script"]="scripts/migrate-to-modular.sh"
    ["modularization_summary"]="docs/modularization-summary.md"
    ["implementation_guide"]="docs/implementation-guide.md"
    ["migration_complete_guide"]="docs/migration-guide.md"
)

mapped_count=0
for file in server/0-tmp/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        if [ -n "${SUGGESTED_MAPPING[$filename]}" ]; then
            suggested_path="${SUGGESTED_MAPPING[$filename]}"
            print_found "$filename -> $suggested_path"
            ((mapped_count++))
        else
            print_missing "$filename -> ❓ Mapeamento não encontrado"
        fi
    fi
done

echo ""
print_info "Arquivos mapeados automaticamente: $mapped_count de $file_count"

# Lista de arquivos essenciais para a estrutura modular
echo ""
print_info "Verificando arquivos essenciais da estrutura modular:"
echo "=================================================="

ESSENTIAL_FILES=(
    "server/config/database.js"
    "server/config/cors.js"
    "server/config/environment.js"
    "server/services/authService.js"
    "server/services/profileService.js"
    "server/services/productService.js"
    "server/services/subscriptionService.js"
    "server/services/statsService.js"
    "server/services/chatService.js"
    "server/routes/auth.js"
    "server/routes/profile.js"
    "server/routes/index.js"
    "server/utils/constants.js"
    "server/utils/helpers.js"
    "server/app.js"
    "Dockerfile.backend"
    "package.json"
)

found_essential=0
for essential in "${ESSENTIAL_FILES[@]}"; do
    # Verificar se temos um arquivo que mapeia para este caminho
    found=false
    for suggested_path in "${SUGGESTED_MAPPING[@]}"; do
        if [ "$suggested_path" = "$essential" ]; then
            found=true
            break
        fi
    done
    
    if $found; then
        print_found "$essential"
        ((found_essential++))
    else
        print_missing "$essential"
    fi
done

echo ""
echo "=================================================="
print_info "Arquivos essenciais encontrados: $found_essential de ${#ESSENTIAL_FILES[@]}"

percentage=$((found_essential * 100 / ${#ESSENTIAL_FILES[@]}))
if [ $percentage -ge 80 ]; then
    print_found "✨ Estrutura $percentage% completa - Pronto para organizar!"
elif [ $percentage -ge 60 ]; then
    echo -e "${YELLOW}⚠️ Estrutura $percentage% completa - Alguns arquivos podem estar faltando${NC}"
else
    echo -e "${RED}❌ Estrutura $percentage% completa - Muitos arquivos essenciais faltando${NC}"
fi

echo ""
print_info "Próximos passos recomendados:"
echo "1. Execute: bash scripts/organize-modular-files.sh"
echo "2. Verifique se todos os arquivos foram organizados corretamente"
echo "3. Crie manualmente os arquivos que estão faltando"
echo "4. Teste a estrutura: npm run server"

echo ""
print_info "Estrutura de pastas que será criada:"
echo "server/"
echo "├── config/"
echo "├── middleware/"
echo "├── routes/"
echo "├── services/"
echo "├── utils/"
echo "└── app.js"