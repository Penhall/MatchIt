# scripts/fix-phase1-useauth-jsx.sh - Corrigir erro JSX no useAuth
#!/bin/bash

echo "🔧 [INFO] Iniciando correção do erro useAuth.ts JSX..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ [ERROR] Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o arquivo problemático existe
if [ ! -f "src/hooks/useAuth.ts" ]; then
    echo "❌ [ERROR] Arquivo src/hooks/useAuth.ts não encontrado"
    exit 1
fi

echo "📁 [INFO] Renomeando useAuth.ts para useAuth.tsx..."

# Renomear o arquivo de .ts para .tsx
mv src/hooks/useAuth.ts src/hooks/useAuth.tsx

if [ $? -eq 0 ]; then
    echo "✅ [SUCCESS] Arquivo renomeado com sucesso"
else
    echo "❌ [ERROR] Falha ao renomear arquivo"
    exit 1
fi

echo "🔍 [INFO] Procurando imports que referenciam useAuth.ts..."

# Atualizar imports que ainda referenciam .ts
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "from.*useAuth" | while read file; do
    echo "📝 [INFO] Verificando arquivo: $file"
    
    # Substituir imports que incluem extensão .ts
    sed -i.bak "s/from ['\"]\(.*\)useAuth\.ts['\"/from '\1useAuth'/g" "$file"
    
    # Remover arquivo backup se a substituição foi bem-sucedida
    if [ $? -eq 0 ]; then
        rm -f "$file.bak"
        echo "✅ [INFO] Imports atualizados em: $file"
    else
        # Restaurar backup se algo deu errado
        if [ -f "$file.bak" ]; then
            mv "$file.bak" "$file"
        fi
        echo "⚠️  [WARNING] Erro ao atualizar imports em: $file"
    fi
done

echo "🔍 [INFO] Verificando outros arquivos que podem ter problemas similares..."

# Verificar se existem outros arquivos .ts com JSX
tsx_files_in_ts=$(find src -name "*.ts" -exec grep -l "jsx\|<.*>" {} \; 2>/dev/null || true)

if [ -n "$tsx_files_in_ts" ]; then
    echo "⚠️  [WARNING] Encontrados outros arquivos .ts que podem conter JSX:"
    echo "$tsx_files_in_ts"
    echo ""
    echo "💡 [TIP] Considere renomear estes arquivos para .tsx se contiverem JSX"
fi

echo "🧹 [INFO] Limpando cache de build..."

# Limpar cache do Vite se existir
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "✅ [INFO] Cache do Vite limpo"
fi

# Limpar dist se existir
if [ -d "dist" ]; then
    rm -rf dist
    echo "✅ [INFO] Diretório dist limpo"
fi

echo "🔧 [INFO] Verificando tsconfig.json para configurações JSX..."

# Verificar se tsconfig.json tem configurações JSX adequadas
if [ -f "tsconfig.json" ]; then
    jsx_config=$(grep -E '"jsx":|"jsxImportSource":' tsconfig.json || true)
    
    if [ -z "$jsx_config" ]; then
        echo "⚠️  [WARNING] tsconfig.json pode precisar de configuração JSX"
        echo "💡 [TIP] Adicione as seguintes configurações ao compilerOptions:"
        echo '    "jsx": "react-jsx",'
        echo '    "jsxImportSource": "react"'
    else
        echo "✅ [INFO] Configurações JSX encontradas no tsconfig.json"
    fi
fi

echo ""
echo "🎉 [SUCCESS] Correção aplicada com sucesso!"
echo ""
echo "📋 [NEXT STEPS] Execute os seguintes comandos:"
echo "   npm run build    # Para testar o build"
echo "   npm run dev      # Para iniciar o servidor de desenvolvimento"
echo ""
echo "🔍 [DEBUG] Se ainda houver erros:"
echo "   1. Verifique se todos os imports estão corretos"
echo "   2. Certifique-se de que React está importado nos arquivos TSX"
echo "   3. Verifique a configuração do Vite (vite.config.js/ts)"
