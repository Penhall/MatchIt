#!/bin/bash
# scripts/check-frontend-aliases.sh - Verificador completo de aliases frontend

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
ORANGE='\033[0;33m'
NC='\033[0m'
BOLD='\033[1m'

# Contadores
TOTAL_ALIASES=0
CORRECT_ALIASES=0
BROKEN_ALIASES=0
TOTAL_IMPORTS=0
CORRECT_IMPORTS=0
BROKEN_IMPORTS=0

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}    🔍 VERIFICADOR DE ALIAS FRONTEND - MATCHIT    ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto${NC}"
    exit 1
fi

# =====================================================
# FUNÇÃO: Extrair aliases do vite.config.ts
# =====================================================
extract_vite_aliases() {
    if [ ! -f "vite.config.ts" ]; then
        echo -e "${RED}❌ vite.config.ts não encontrado${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📋 Extraindo aliases do vite.config.ts...${NC}"
    
    # Usar node para extrair os aliases de forma mais precisa
    node -e "
        const fs = require('fs');
        const path = require('path');
        
        try {
            const content = fs.readFileSync('vite.config.ts', 'utf8');
            
            // Regex para encontrar a seção alias
            const aliasMatch = content.match(/alias:\s*{([^}]*)}/s);
            if (!aliasMatch) {
                console.log('VITE_ALIASES_EMPTY');
                process.exit(0);
            }
            
            const aliasContent = aliasMatch[1];
            
            // Extrair cada alias
            const aliasRegex = /['\"]?(@[^'\":\s]*)['\"]?\s*:\s*path\.resolve\(__dirname,\s*['\"]([^'\"]*)['\"]?\)/g;
            let match;
            const aliases = [];
            
            while ((match = aliasRegex.exec(aliasContent)) !== null) {
                const alias = match[1];
                const targetPath = match[2].replace(/^\.\//, '');
                aliases.push({alias, path: targetPath});
            }
            
            if (aliases.length === 0) {
                console.log('VITE_ALIASES_EMPTY');
            } else {
                console.log('VITE_ALIASES_START');
                aliases.forEach(a => console.log(\`\${a.alias}|\${a.path}\`));
                console.log('VITE_ALIASES_END');
            }
        } catch (error) {
            console.log('VITE_ALIASES_ERROR');
        }
    " > /tmp/vite_aliases.txt
    
    return 0
}

# =====================================================
# FUNÇÃO: Extrair paths do tsconfig.json
# =====================================================
extract_tsconfig_paths() {
    if [ ! -f "tsconfig.json" ]; then
        echo -e "${YELLOW}⚠️ tsconfig.json não encontrado${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📋 Extraindo paths do tsconfig.json...${NC}"
    
    node -e "
        const fs = require('fs');
        
        try {
            const content = fs.readFileSync('tsconfig.json', 'utf8');
            // Remover comentários JSON
            const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
            const config = JSON.parse(cleanContent);
            
            if (config.compilerOptions && config.compilerOptions.paths) {
                console.log('TSCONFIG_PATHS_START');
                Object.entries(config.compilerOptions.paths).forEach(([alias, paths]) => {
                    paths.forEach(path => {
                        const cleanAlias = alias.replace(/\/\*$/, '');
                        const cleanPath = path.replace(/\/\*$/, '').replace(/^\.\//, '');
                        console.log(\`\${cleanAlias}|\${cleanPath}\`);
                    });
                });
                console.log('TSCONFIG_PATHS_END');
            } else {
                console.log('TSCONFIG_PATHS_EMPTY');
            }
        } catch (error) {
            console.log('TSCONFIG_PATHS_ERROR');
        }
    " > /tmp/tsconfig_paths.txt
    
    return 0
}

# =====================================================
# FUNÇÃO: Verificar se alias aponta para local válido
# =====================================================
check_alias_validity() {
    local alias="$1"
    local target_path="$2"
    
    # Verificar se o caminho existe
    if [ -d "$target_path" ] || [ -f "$target_path" ]; then
        echo "VALID"
    else
        echo "INVALID"
    fi
}

# =====================================================
# FUNÇÃO: Encontrar todos os imports com alias
# =====================================================
find_alias_imports() {
    echo -e "${BLUE}🔍 Procurando imports com alias em arquivos .ts/.tsx/.js/.jsx...${NC}"
    
    # Encontrar todos os arquivos relevantes
    find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        ! -path "./node_modules/*" \
        ! -path "./dist/*" \
        ! -path "./.git/*" \
        ! -path "./backup_*/*" \
        ! -path "./coverage/*" > /tmp/source_files.txt
    
    # Processar cada arquivo
    > /tmp/alias_imports.txt
    
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Extrair imports que começam com @
            grep -n "import.*from ['\"]@" "$file" 2>/dev/null | while IFS= read -r line; do
                line_num=$(echo "$line" | cut -d: -f1)
                import_line=$(echo "$line" | cut -d: -f2-)
                
                # Extrair o caminho do import
                import_path=$(echo "$import_line" | sed -n "s/.*from ['\"]\\(@[^'\"]*\\)['\"].*/\\1/p")
                
                if [ -n "$import_path" ]; then
                    echo "$file|$line_num|$import_path|$import_line" >> /tmp/alias_imports.txt
                fi
            done
        fi
    done < /tmp/source_files.txt
}

# =====================================================
# FUNÇÃO: Verificar se import resolve corretamente
# =====================================================
check_import_resolution() {
    local import_path="$1"
    local file_location="$2"
    
    # Tentar resolver o import baseado nos aliases conhecidos
    local resolved_path=""
    
    # Ler aliases do vite.config
    while IFS='|' read -r alias target; do
        if [[ "$import_path" == "$alias"* ]]; then
            local remaining_path="${import_path#$alias}"
            resolved_path="$target$remaining_path"
            break
        fi
    done < <(grep -v "VITE_ALIASES" /tmp/vite_aliases.txt 2>/dev/null || true)
    
    if [ -z "$resolved_path" ]; then
        # Tentar com tsconfig paths
        while IFS='|' read -r alias target; do
            if [[ "$import_path" == "$alias"* ]]; then
                local remaining_path="${import_path#$alias}"
                resolved_path="$target$remaining_path"
                break
            fi
        done < <(grep -v "TSCONFIG_PATHS" /tmp/tsconfig_paths.txt 2>/dev/null || true)
    fi
    
    if [ -n "$resolved_path" ]; then
        # Verificar se resolve para arquivo ou diretório
        if [ -f "$resolved_path.ts" ] || [ -f "$resolved_path.tsx" ] || [ -f "$resolved_path.js" ] || [ -f "$resolved_path.jsx" ] || [ -f "$resolved_path/index.ts" ] || [ -f "$resolved_path/index.tsx" ] || [ -f "$resolved_path/index.js" ] || [ -d "$resolved_path" ]; then
            echo "RESOLVES|$resolved_path"
        else
            echo "BROKEN|$resolved_path"
        fi
    else
        echo "NO_ALIAS|"
    fi
}

# =====================================================
# EXECUTAR VERIFICAÇÕES
# =====================================================

echo -e "${YELLOW}🔄 Executando verificações...${NC}"
echo ""

# Extrair aliases
extract_vite_aliases
extract_tsconfig_paths
find_alias_imports

# =====================================================
# RELATÓRIO: ALIASES CONFIGURADOS
# =====================================================
echo -e "${PURPLE}${BOLD}📊 RELATÓRIO DE ALIASES CONFIGURADOS${NC}"
echo -e "${PURPLE}================================================================${NC}"

echo -e "${CYAN}🔧 Aliases do vite.config.ts:${NC}"
if grep -q "VITE_ALIASES_EMPTY\|VITE_ALIASES_ERROR" /tmp/vite_aliases.txt 2>/dev/null; then
    echo -e "${RED}  ❌ Nenhum alias encontrado ou erro na leitura${NC}"
else
    while IFS='|' read -r alias target; do
        if [[ "$alias" != "VITE_ALIASES"* ]]; then
            TOTAL_ALIASES=$((TOTAL_ALIASES + 1))
            status=$(check_alias_validity "$alias" "$target")
            
            if [ "$status" = "VALID" ]; then
                echo -e "${GREEN}  ✅ $alias → $target${NC}"
                CORRECT_ALIASES=$((CORRECT_ALIASES + 1))
            else
                echo -e "${RED}  ❌ $alias → $target (não existe)${NC}"
                BROKEN_ALIASES=$((BROKEN_ALIASES + 1))
            fi
        fi
    done < /tmp/vite_aliases.txt 2>/dev/null
fi

echo ""
echo -e "${CYAN}📝 Paths do tsconfig.json:${NC}"
if grep -q "TSCONFIG_PATHS_EMPTY\|TSCONFIG_PATHS_ERROR" /tmp/tsconfig_paths.txt 2>/dev/null; then
    echo -e "${RED}  ❌ Nenhum path encontrado ou erro na leitura${NC}"
else
    while IFS='|' read -r alias target; do
        if [[ "$alias" != "TSCONFIG_PATHS"* ]]; then
            status=$(check_alias_validity "$alias" "$target")
            
            if [ "$status" = "VALID" ]; then
                echo -e "${GREEN}  ✅ $alias → $target${NC}"
            else
                echo -e "${RED}  ❌ $alias → $target (não existe)${NC}"
            fi
        fi
    done < /tmp/tsconfig_paths.txt 2>/dev/null
fi

# =====================================================
# RELATÓRIO: IMPORTS ENCONTRADOS
# =====================================================
echo ""
echo -e "${PURPLE}${BOLD}📁 RELATÓRIO DE IMPORTS ENCONTRADOS${NC}"
echo -e "${PURPLE}================================================================${NC}"

if [ -f "/tmp/alias_imports.txt" ] && [ -s "/tmp/alias_imports.txt" ]; then
    # Agrupar por alias
    echo -e "${CYAN}🔍 Imports encontrados no código:${NC}"
    echo ""
    
    # Processar cada import
    while IFS='|' read -r file line_num import_path import_line; do
        TOTAL_IMPORTS=$((TOTAL_IMPORTS + 1))
        
        resolution=$(check_import_resolution "$import_path" "$file")
        status=$(echo "$resolution" | cut -d'|' -f1)
        resolved_path=$(echo "$resolution" | cut -d'|' -f2)
        
        relative_file="${file#./}"
        
        case "$status" in
            "RESOLVES")
                echo -e "${GREEN}  ✅ $import_path${NC}"
                echo -e "     📄 $relative_file:$line_num"
                echo -e "     🎯 Resolve para: $resolved_path"
                CORRECT_IMPORTS=$((CORRECT_IMPORTS + 1))
                ;;
            "BROKEN")
                echo -e "${RED}  ❌ $import_path${NC}"
                echo -e "     📄 $relative_file:$line_num"
                echo -e "     💥 Deveria resolver para: $resolved_path (não existe)"
                echo -e "     📝 Linha: $import_line"
                BROKEN_IMPORTS=$((BROKEN_IMPORTS + 1))
                ;;
            "NO_ALIAS")
                echo -e "${YELLOW}  ⚠️ $import_path${NC}"
                echo -e "     📄 $relative_file:$line_num"
                echo -e "     🤔 Nenhum alias configurado para este caminho"
                BROKEN_IMPORTS=$((BROKEN_IMPORTS + 1))
                ;;
        esac
        echo ""
    done < /tmp/alias_imports.txt
else
    echo -e "${YELLOW}⚠️ Nenhum import com alias encontrado${NC}"
fi

# =====================================================
# RESUMO FINAL
# =====================================================
echo -e "${PURPLE}${BOLD}📈 RESUMO FINAL${NC}"
echo -e "${PURPLE}================================================================${NC}"

echo -e "${BLUE}📊 Estatísticas de Aliases:${NC}"
echo -e "   Total configurados: $TOTAL_ALIASES"
echo -e "   ${GREEN}✅ Funcionando: $CORRECT_ALIASES${NC}"
echo -e "   ${RED}❌ Quebrados: $BROKEN_ALIASES${NC}"

if [ $TOTAL_ALIASES -gt 0 ]; then
    alias_percentage=$((CORRECT_ALIASES * 100 / TOTAL_ALIASES))
    echo -e "   📈 Taxa de sucesso: ${alias_percentage}%"
fi

echo ""
echo -e "${BLUE}📊 Estatísticas de Imports:${NC}"
echo -e "   Total encontrados: $TOTAL_IMPORTS"
echo -e "   ${GREEN}✅ Resolvendo: $CORRECT_IMPORTS${NC}"
echo -e "   ${RED}❌ Quebrados: $BROKEN_IMPORTS${NC}"

if [ $TOTAL_IMPORTS -gt 0 ]; then
    import_percentage=$((CORRECT_IMPORTS * 100 / TOTAL_IMPORTS))
    echo -e "   📈 Taxa de sucesso: ${import_percentage}%"
fi

echo ""

# =====================================================
# SUGESTÕES DE CORREÇÃO
# =====================================================
if [ $BROKEN_ALIASES -gt 0 ] || [ $BROKEN_IMPORTS -gt 0 ]; then
    echo -e "${ORANGE}${BOLD}💡 SUGESTÕES DE CORREÇÃO${NC}"
    echo -e "${ORANGE}================================================================${NC}"
    
    if [ $BROKEN_ALIASES -gt 0 ]; then
        echo -e "${YELLOW}🔧 Para corrigir aliases quebrados:${NC}"
        echo -e "   1. Verificar se os diretórios existem"
        echo -e "   2. Atualizar vite.config.ts com caminhos corretos"
        echo -e "   3. Sincronizar com tsconfig.json paths"
        echo ""
    fi
    
    if [ $BROKEN_IMPORTS -gt 0 ]; then
        echo -e "${YELLOW}🔧 Para corrigir imports quebrados:${NC}"
        echo -e "   1. Verificar se os arquivos existem nos caminhos esperados"
        echo -e "   2. Mover arquivos para locais corretos"
        echo -e "   3. Atualizar imports para usar caminhos relativos temporariamente"
        echo -e "   4. Configurar aliases ausentes"
        echo ""
    fi
    
    echo -e "${CYAN}🚀 Script de correção rápida disponível em:${NC}"
    echo -e "   scripts/fix/frontend_complete_fix.sh"
    echo ""
fi

# Limpar arquivos temporários
rm -f /tmp/vite_aliases.txt /tmp/tsconfig_paths.txt /tmp/source_files.txt /tmp/alias_imports.txt

# Status de saída
if [ $BROKEN_ALIASES -eq 0 ] && [ $BROKEN_IMPORTS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 Todos os aliases estão funcionando perfeitamente!${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}⚠️ Encontrados problemas nos aliases. Verifique as sugestões acima.${NC}"
    exit 1
fi