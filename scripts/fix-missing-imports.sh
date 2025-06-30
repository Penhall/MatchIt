# scripts/fix-missing-imports.sh - Correção urgente dos imports quebrados
#!/bin/bash

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}${BOLD}================================${NC}"
    echo -e "${BLUE}${BOLD}$1${NC}"
    echo -e "${BLUE}${BOLD}================================${NC}\n"
}

print_step() {
    echo -e "${CYAN}➤ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_found() {
    echo -e "${PURPLE}🔍 $1${NC}"
}

print_header "CORREÇÃO URGENTE - IMPORTS QUEBRADOS"

echo -e "${RED}${BOLD}🚨 PROBLEMA DETECTADO:${NC}"
echo -e "${YELLOW}   App.tsx tentando importar arquivos que não existem${NC}"
echo -e "${BLUE}🎯 SOLUÇÃO: Restaurar arquivos movidos pelos scripts${NC}"
echo ""

# Criar backup de emergência
backup_dir="import-fix-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
print_success "Backup criado: $backup_dir"

# PASSO 1: MAPEAR ARQUIVOS FRAGMENTADOS
print_header "PASSO 1: MAPEAMENTO DE ARQUIVOS"

print_step "Procurando arquivos movidos/duplicados..."

# Arrays para armazenar achados
declare -a missing_files=()
declare -a found_alternatives=()
declare -a disabled_dirs=()

# Procurar diretórios disabled criados pelos scripts
for dir in disabled_* temp_disabled_* backup_*; do
    if [ -d "$dir" ]; then
        disabled_dirs+=("$dir")
        print_found "Diretório encontrado: $dir"
    fi
done

# Procurar arquivos específicos que estão faltando
key_files=(
    "StyleAdjustmentScreen.tsx"
    "SettingsScreen.tsx" 
    "EditProfileScreen.tsx"
    "MatchAreaScreen.tsx"
    "ChatScreen.tsx"
    "ProfileScreen.tsx"
)

print_step "Verificando arquivos-chave em screens/..."

for file in "${key_files[@]}"; do
    target_path="screens/$file"
    
    if [ ! -f "$target_path" ]; then
        missing_files+=("$file")
        print_error "FALTANDO: $target_path"
        
        # Procurar alternativas
        print_step "  Procurando $file em outros locais..."
        
        # Buscar em diretórios disabled
        for disabled_dir in "${disabled_dirs[@]}"; do
            alt_path="$disabled_dir/$file"
            if [ -f "$alt_path" ]; then
                found_alternatives+=("$alt_path→$target_path")
                print_found "    ENCONTRADO: $alt_path"
            fi
        done
        
        # Buscar em src/screens/
        alt_src="src/screens/$file"
        if [ -f "$alt_src" ]; then
            found_alternatives+=("$alt_src→$target_path")
            print_found "    ENCONTRADO: $alt_src"
        fi
        
        # Buscar recursivamente
        find_result=$(find . -name "$file" -type f | grep -v node_modules | head -5)
        if [ -n "$find_result" ]; then
            echo "$find_result" | while read -r found_path; do
                if [ "$found_path" != "./$target_path" ]; then
                    print_found "    ENCONTRADO: $found_path"
                fi
            done
        fi
    else
        print_success "OK: $target_path"
    fi
done

echo ""
print_info "📊 RESUMO DO MAPEAMENTO:"
echo -e "   ${RED}Arquivos faltando: ${#missing_files[@]}${NC}"
echo -e "   ${GREEN}Alternativas encontradas: ${#found_alternatives[@]}${NC}"
echo -e "   ${BLUE}Diretórios disabled: ${#disabled_dirs[@]}${NC}"
echo ""

# PASSO 2: RESTAURAÇÃO INTELIGENTE
print_header "PASSO 2: RESTAURAÇÃO INTELIGENTE"

if [ ${#missing_files[@]} -eq 0 ]; then
    print_success "Nenhum arquivo faltando - verificando compilação..."
else
    print_step "Restaurando arquivos faltando..."
    
    # Criar diretório screens se não existir
    mkdir -p screens
    
    restored_count=0
    
    # Restaurar de diretórios disabled primeiro (prioridade)
    for disabled_dir in "${disabled_dirs[@]}"; do
        if [ -d "$disabled_dir" ]; then
            print_step "Restaurando de $disabled_dir..."
            
            for file in "${missing_files[@]}"; do
                source_path="$disabled_dir/$file"
                target_path="screens/$file"
                
                if [ -f "$source_path" ] && [ ! -f "$target_path" ]; then
                    # Backup antes de restaurar
                    cp "$source_path" "$backup_dir/"
                    
                    # Restaurar arquivo
                    cp "$source_path" "$target_path"
                    print_success "Restaurado: $file"
                    restored_count=$((restored_count + 1))
                fi
            done
        fi
    done
    
    # Se ainda faltam arquivos, tentar de src/screens/
    for file in "${missing_files[@]}"; do
        target_path="screens/$file"
        source_path="src/screens/$file"
        
        if [ ! -f "$target_path" ] && [ -f "$source_path" ]; then
            cp "$source_path" "$backup_dir/"
            cp "$source_path" "$target_path"
            print_success "Copiado de src/: $file"
            restored_count=$((restored_count + 1))
        fi
    done
    
    print_info "Total de arquivos restaurados: $restored_count"
fi

# PASSO 3: VERIFICAÇÃO DE IMPORTS
print_header "PASSO 3: VERIFICAÇÃO DE IMPORTS"

print_step "Analisando imports em App.tsx..."

if [ -f "App.tsx" ]; then
    # Extrair todos os imports de screens
    screen_imports=$(grep -n "import.*from.*['\"]\.\/screens\/" App.tsx || true)
    
    if [ -n "$screen_imports" ]; then
        print_info "Imports de screens encontrados:"
        echo "$screen_imports" | while read -r line; do
            echo -e "   ${CYAN}$line${NC}"
            
            # Extrair o nome do arquivo
            import_file=$(echo "$line" | sed -n "s/.*['\"]\.\/screens\/\([^'\"]*\)['\"].*/\1/p")
            
            if [ -n "$import_file" ]; then
                # Verificar se o arquivo existe
                if [ -f "screens/$import_file.tsx" ] || [ -f "screens/$import_file.ts" ]; then
                    echo -e "     ${GREEN}✅ Arquivo existe${NC}"
                else
                    echo -e "     ${RED}❌ Arquivo não encontrado${NC}"
                fi
            fi
        done
    else
        print_info "Nenhum import de screens encontrado em App.tsx"
    fi
else
    print_warning "App.tsx não encontrado na raiz"
fi

# Verificar também src/App.tsx
if [ -f "src/App.tsx" ]; then
    print_step "Verificando src/App.tsx..."
    src_screen_imports=$(grep -n "import.*screens" src/App.tsx || true)
    if [ -n "$src_screen_imports" ]; then
        print_info "Imports em src/App.tsx:"
        echo "$src_screen_imports" | sed 's/^/   /'
    fi
fi

# PASSO 4: TESTE DE COMPILAÇÃO
print_header "PASSO 4: TESTE DE COMPILAÇÃO"

print_step "Testando compilação do Vite..."

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado"
    exit 1
fi

# Verificar se script dev existe
if ! grep -q '"dev"' package.json; then
    print_warning "Script 'dev' não encontrado no package.json"
fi

# Tentar compilar (timeout para evitar travamento)
print_step "Executando: npm run build (com timeout de 30s)"

if timeout 30s npm run build >/dev/null 2>&1; then
    print_success "Build executado com sucesso!"
    build_ok=true
else
    print_warning "Build falhou ou timeout"
    build_ok=false
fi

# PASSO 5: TESTE RÁPIDO DO DEV SERVER
print_header "PASSO 5: TESTE DO DEV SERVER"

print_step "Iniciando dev server (teste rápido)..."

# Iniciar dev server em background com timeout
npm run dev > dev_test.log 2>&1 &
dev_pid=$!

# Aguardar alguns segundos
sleep 5

# Verificar se ainda está rodando
if kill -0 $dev_pid 2>/dev/null; then
    print_success "Dev server iniciou corretamente!"
    
    # Verificar log para erros
    if grep -q "Error\|Failed\|Cannot" dev_test.log; then
        print_warning "Erros encontrados no log:"
        grep "Error\|Failed\|Cannot" dev_test.log | head -3 | sed 's/^/   /'
    else
        print_success "Nenhum erro crítico encontrado"
    fi
    
    # Matar processo
    kill $dev_pid 2>/dev/null || true
    sleep 2
    kill -9 $dev_pid 2>/dev/null || true
else
    print_error "Dev server falhou ao iniciar"
fi

# Limpar arquivo de log
rm -f dev_test.log

# PASSO 6: RELATÓRIO FINAL
print_header "RELATÓRIO DE CORREÇÃO"

echo -e "${GREEN}${BOLD}🎉 CORREÇÃO CONCLUÍDA!${NC}"
echo ""
echo -e "${BLUE}📋 Resumo das ações:${NC}"
echo -e "   📂 Backup criado: $backup_dir"
echo -e "   🔍 Diretórios disabled verificados: ${#disabled_dirs[@]}"
echo -e "   📄 Arquivos faltando encontrados: ${#missing_files[@]}"
echo -e "   ✅ Arquivos restaurados: $restored_count"
echo -e "   🔧 Build test: $([ "$build_ok" = true ] && echo "✅ OK" || echo "❌ FALHOU")"
echo ""

if [ ${#missing_files[@]} -eq 0 ] && [ "$build_ok" = true ]; then
    echo -e "${GREEN}${BOLD}🚀 SISTEMA RESTAURADO COM SUCESSO!${NC}"
    echo ""
    echo -e "${BLUE}Para testar agora:${NC}"
    echo -e "   ${YELLOW}npm run dev${NC}"
    echo -e "   ${YELLOW}Navegador: http://localhost:5173${NC}"
    echo ""
    echo -e "${GREEN}✅ Você deve ver a tela de login funcionando!${NC}"
elif [ ${#missing_files[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  ARQUIVOS AINDA EM FALTA:${NC}"
    for file in "${missing_files[@]}"; do
        if [ ! -f "screens/$file" ]; then
            echo -e "   ${RED}❌ screens/$file${NC}"
        fi
    done
    echo ""
    echo -e "${BLUE}💡 PRÓXIMO PASSO:${NC}"
    echo -e "   Identifique qual arquivo específico está causando erro"
    echo -e "   e me informe para buscar uma solução específica"
else
    echo -e "${YELLOW}⚠️  BUILD AINDA COM PROBLEMAS${NC}"
    echo ""
    echo -e "${BLUE}💡 PRÓXIMO PASSO:${NC}"
    echo -e "   Execute: npm run dev"
    echo -e "   E me informe qual erro específico aparece"
fi

print_success "Correção de imports concluída!"