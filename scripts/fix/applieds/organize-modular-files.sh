#!/bin/bash

# scripts/organize-modular-files.sh
# Script para organizar os artefatos baixados da modularização do MatchIt Backend

set -e

echo "🔧 Organizando arquivos da modularização MatchIt Backend..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    print_error "Execute este script na raiz do projeto MatchIt"
    exit 1
fi

# Verificar se a pasta server/0-tmp existe
if [ ! -d "server/0-tmp" ]; then
    print_error "Pasta server/0-tmp não encontrada"
    print_info "Por favor, baixe os artefatos para server/0-tmp/"
    exit 1
fi

print_info "Analisando arquivos em server/0-tmp/..."

# Criar backup se não existir
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Mapear arquivos corretos baseado na primeira linha (comentário)
declare -A FILE_MAPPING
declare -A DUPLICATES
declare -a PROCESSED_FILES
declare -a MISSING_FILES

# Função para extrair o caminho correto da primeira linha
extract_correct_path() {
    local file="$1"
    local first_line
    
    # Ler primeira linha e extrair caminho
    first_line=$(head -n1 "$file")
    
    # Diferentes padrões para extrair o caminho
    if [[ "$first_line" =~ //[[:space:]]*([^[:space:]]+\.[a-z]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    elif [[ "$first_line" =~ #[[:space:]]*([^[:space:]]+\.[a-z]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    elif [[ "$first_line" =~ server/([^[:space:]]+\.[a-z]+) ]]; then
        echo "server/${BASH_REMATCH[1]}"
    else
        echo ""
    fi
}

# Função para determinar o tipo de arquivo e extensão correta
determine_file_type() {
    local file="$1"
    local content
    
    content=$(head -n5 "$file")
    
    if [[ "$content" =~ "#!/bin/bash" ]] || [[ "$content" =~ "FROM node:" ]]; then
        echo "script_or_dockerfile"
    elif [[ "$content" =~ "export" ]] || [[ "$content" =~ "import" ]] || [[ "$content" =~ "const" ]]; then
        echo "javascript"
    elif [[ "$content" =~ "interface" ]] || [[ "$content" =~ "type" ]]; then
        echo "typescript"
    elif [[ "$content" =~ "{" ]] && [[ "$content" =~ "\"" ]]; then
        echo "json"
    elif [[ "$content" =~ "# " ]]; then
        echo "markdown"
    else
        echo "unknown"
    fi
}

# Mapear todos os arquivos baseado em seus nomes de artefato conhecidos
declare -A ARTIFACT_TO_PATH_MAPPING=(
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
)

# Arquivos esperados da estrutura modular completa
EXPECTED_FILES=(
    "server/config/database.js"
    "server/config/cors.js"
    "server/config/environment.js"
    "server/middleware/auth.js"
    "server/middleware/configure.js"
    "server/middleware/errorHandler.js"
    "server/middleware/logger.js"
    "server/middleware/validation.js"
    "server/middleware/index.js"
    "server/services/authService.js"
    "server/services/profileService.js"
    "server/services/productService.js"
    "server/services/subscriptionService.js"
    "server/services/statsService.js"
    "server/services/chatService.js"
    "server/services/recommendationService.js"
    "server/services/matchService.js"
    "server/routes/health.js"
    "server/routes/auth.js"
    "server/routes/profile.js"
    "server/routes/matches.js"
    "server/routes/products.js"
    "server/routes/chat.js"
    "server/routes/subscription.js"
    "server/routes/stats.js"
    "server/routes/recommendations.js"
    "server/routes/index.js"
    "server/utils/constants.js"
    "server/utils/helpers.js"
    "server/app.js"
)

print_info "Analisando arquivos baixados..."

# Analisar cada arquivo em server/0-tmp
for file in server/0-tmp/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        print_info "Analisando: $filename"
        
        # Tentar extrair caminho da primeira linha
        correct_path=$(extract_correct_path "$file")
        
        # Se não conseguiu extrair da primeira linha, usar mapeamento conhecido
        if [ -z "$correct_path" ] && [ -n "${ARTIFACT_TO_PATH_MAPPING[$filename]}" ]; then
            correct_path="${ARTIFACT_TO_PATH_MAPPING[$filename]}"
        fi
        
        # Se ainda não temos o caminho, tentar deduzir pelo conteúdo e nome
        if [ -z "$correct_path" ]; then
            file_type=$(determine_file_type "$file")
            
            case "$filename" in
                *"auth"*) correct_path="server/services/authService.js" ;;
                *"profile"*) correct_path="server/services/profileService.js" ;;
                *"database"*) correct_path="server/config/database.js" ;;
                *"cors"*) correct_path="server/config/cors.js" ;;
                *"environment"*) correct_path="server/config/environment.js" ;;
                *"app"*) correct_path="server/app.js" ;;
                *"dockerfile"*) correct_path="Dockerfile.backend" ;;
                *"package"*) correct_path="package.json" ;;
                *"migrate"*) correct_path="scripts/migrate-to-modular.sh" ;;
                *) 
                    print_warning "Não foi possível determinar o caminho para: $filename"
                    continue
                    ;;
            esac
        fi
        
        if [ -n "$correct_path" ]; then
            # Verificar duplicatas
            if [ -n "${FILE_MAPPING[$correct_path]}" ]; then
                DUPLICATES[$correct_path]="${DUPLICATES[$correct_path]} $filename"
                print_warning "Duplicata detectada para $correct_path: $filename"
            else
                FILE_MAPPING[$correct_path]="$file"
                PROCESSED_FILES+=("$filename")
            fi
        fi
    fi
done

echo ""
print_info "Resumo da análise:"
echo "📊 Arquivos processados: ${#PROCESSED_FILES[@]}"
echo "🔍 Arquivos mapeados: ${#FILE_MAPPING[@]}"
echo "⚠️  Duplicatas encontradas: ${#DUPLICATES[@]}"

# Verificar arquivos faltando
echo ""
print_info "Verificando arquivos faltando..."
for expected_file in "${EXPECTED_FILES[@]}"; do
    if [ -z "${FILE_MAPPING[$expected_file]}" ]; then
        MISSING_FILES+=("$expected_file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_warning "Arquivos faltando (${#MISSING_FILES[@]}):"
    for missing in "${MISSING_FILES[@]}"; do
        echo "  - $missing"
    done
fi

# Mostrar duplicatas se existirem
if [ ${#DUPLICATES[@]} -gt 0 ]; then
    echo ""
    print_warning "Duplicatas encontradas:"
    for path in "${!DUPLICATES[@]}"; do
        echo "  $path: ${DUPLICATES[$path]}"
    done
fi

echo ""
read -p "Deseja continuar com a organização? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Operação cancelada"
    exit 0
fi

# Criar backup dos arquivos existentes que serão sobrescritos
echo ""
print_info "Criando backup dos arquivos existentes..."
for target_path in "${!FILE_MAPPING[@]}"; do
    if [ -f "$target_path" ]; then
        backup_path="$BACKUP_DIR/$target_path"
        mkdir -p "$(dirname "$backup_path")"
        cp "$target_path" "$backup_path"
        print_status "Backup: $target_path -> $backup_path"
    fi
done

# Criar estrutura de diretórios
echo ""
print_info "Criando estrutura de diretórios..."
mkdir -p server/{config,middleware,routes,services,utils}
mkdir -p scripts
print_status "Estrutura de diretórios criada"

# Mover arquivos para os locais corretos
echo ""
print_info "Organizando arquivos..."
moved_count=0
for target_path in "${!FILE_MAPPING[@]}"; do
    source_file="${FILE_MAPPING[$target_path]}"
    
    # Criar diretório se não existir
    mkdir -p "$(dirname "$target_path")"
    
    # Copiar arquivo
    cp "$source_file" "$target_path"
    print_status "Movido: $(basename "$source_file") -> $target_path"
    ((moved_count++))
done

# Relatório final
echo ""
echo "=============================================="
print_status "ORGANIZAÇÃO CONCLUÍDA!"
echo "=============================================="
echo ""
print_info "Estatísticas:"
echo "  📦 Arquivos organizados: $moved_count"
echo "  📁 Backup criado em: $BACKUP_DIR/"
echo "  ⚠️  Arquivos faltando: ${#MISSING_FILES[@]}"
echo ""

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_warning "Arquivos que ainda precisam ser criados:"
    for missing in "${MISSING_FILES[@]}"; do
        echo "  - $missing"
    done
    echo ""
fi

print_info "Próximos passos:"
echo "  1. Verificar se todos os arquivos estão nos locais corretos"
echo "  2. Criar arquivos faltando (se houver)"
echo "  3. Testar a estrutura modular:"
echo "     npm run server"
echo "  4. Verificar health check:"
echo "     curl http://localhost:3000/api/health"
echo ""

print_status "Arquivos organizados com sucesso!"
print_info "A pasta server/0-tmp pode ser removida agora"

# Opção para remover pasta temporária
echo ""
read -p "Deseja remover a pasta server/0-tmp agora? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf server/0-tmp
    print_status "Pasta server/0-tmp removida"
fi

echo ""
print_status "✨ Organização da estrutura modular concluída!"