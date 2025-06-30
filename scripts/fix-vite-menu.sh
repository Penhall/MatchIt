#!/bin/bash
# scripts/fix-vite-menu.sh - Menu para escolher estratégia de correção

echo "🔧 CORREÇÃO DOS ERROS DO VITE - MENU"
echo "===================================="
echo ""
echo "📋 Problemas identificados:"
echo "   ❌ Arquivos .ts com JSX (StyleAdjustmentScreen, SettingsScreen)"
echo "   ❌ Dependências não instaladas (react-router-dom, axios, i18next)"
echo "   ❌ Componentes React Native em projeto React Web"
echo "   ❌ API apontando para porta 3001 em vez de 3000"
echo ""
echo "Escolha a estratégia de correção:"
echo ""
echo "1) 🚀 CORREÇÃO RÁPIDA - Instalar deps + renomear arquivos"
echo "2) 🔧 CORREÇÃO COMPLETA - Migração React Native → React Web"
echo "3) ⚡ SOLUÇÃO TEMPORÁRIA - Desativar arquivos problemáticos"
echo "4) 📦 APENAS DEPENDÊNCIAS - Só instalar o que está faltando"
echo "5) 🧪 DIAGNÓSTICO - Ver detalhes dos problemas"
echo ""
read -p "Digite sua escolha (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 CORREÇÃO RÁPIDA SELECIONADA"
        echo "=============================="
        
        # Instalar dependências
        echo "📦 Instalando dependências..."
        npm install react-router-dom axios i18next react-i18next i18next-browser-languagedetector --silent
        
        # Renomear arquivos
        echo "📝 Renomeando arquivos..."
        [ -f "screens/StyleAdjustmentScreen.ts" ] && mv "screens/StyleAdjustmentScreen.ts" "screens/StyleAdjustmentScreen.tsx"
        [ -f "screens/SettingsScreen.ts" ] && mv "screens/SettingsScreen.ts" "screens/SettingsScreen.tsx"
        
        # Corrigir API
        echo "🔧 Corrigindo API..."
        [ -f "src/services/api.ts" ] && sed -i.bak 's|localhost:3001|localhost:3000|g' "src/services/api.ts"
        
        echo "✅ Correção rápida concluída!"
        echo "🚀 Teste: npm run dev"
        ;;
        
    2)
        echo ""
        echo "🔧 CORREÇÃO COMPLETA SELECIONADA"
        echo "==============================="
        echo "Executando script completo..."
        chmod +x scripts/fix-vite-errors.sh
        ./scripts/fix-vite-errors.sh
        ;;
        
    3)
        echo ""
        echo "⚡ SOLUÇÃO TEMPORÁRIA SELECIONADA"
        echo "================================"
        
        # Instalar apenas dependências críticas
        echo "📦 Instalando dependências básicas..."
        npm install react-router-dom axios --silent
        
        # Criar diretório temporário
        mkdir -p "temp_disabled"
        
        # Mover arquivos problemáticos
        echo "📁 Movendo arquivos problemáticos..."
        [ -f "screens/StyleAdjustmentScreen.ts" ] && mv "screens/StyleAdjustmentScreen.ts" "temp_disabled/"
        [ -f "screens/SettingsScreen.ts" ] && mv "screens/SettingsScreen.ts" "temp_disabled/"
        
        # Corrigir API
        [ -f "src/services/api.ts" ] && sed -i.bak 's|localhost:3001|localhost:3000|g' "src/services/api.ts"
        
        echo "✅ Arquivos problemáticos temporariamente desabilitados"
        echo "📁 Arquivos movidos para: temp_disabled/"
        echo "🚀 Teste: npm run dev"
        echo "💡 Reative os arquivos quando estiver pronto para migrar"
        ;;
        
    4)
        echo ""
        echo "📦 APENAS DEPENDÊNCIAS SELECIONADO"
        echo "=================================="
        
        deps=(
            "react-router-dom"
            "axios" 
            "i18next"
            "react-i18next"
            "i18next-browser-languagedetector"
        )
        
        echo "Instalando dependências..."
        for dep in "${deps[@]}"; do
            if ! npm list "$dep" >/dev/null 2>&1; then
                echo "📦 $dep..."
                npm install "$dep" --silent
            else
                echo "✅ $dep já instalado"
            fi
        done
        
        echo "✅ Dependências instaladas!"
        echo "⚠️  Ainda há problemas nos arquivos .ts com JSX"
        echo "🚀 Teste: npm run dev (pode ainda ter erros)"
        ;;
        
    5)
        echo ""
        echo "🧪 DIAGNÓSTICO DETALHADO"
        echo "======================="
        
        echo "📋 Verificando dependências..."
        deps=("react-router-dom" "axios" "i18next" "react-i18next")
        for dep in "${deps[@]}"; do
            if npm list "$dep" >/dev/null 2>&1; then
                echo "   ✅ $dep"
            else
                echo "   ❌ $dep (FALTANDO)"
            fi
        done
        
        echo ""
        echo "📋 Verificando arquivos problemáticos..."
        problem_files=("screens/StyleAdjustmentScreen.ts" "screens/SettingsScreen.ts")
        for file in "${problem_files[@]}"; do
            if [ -f "$file" ]; then
                echo "   ❌ $file (extensão .ts com JSX)"
                if grep -q "TouchableOpacity\|View style=" "$file" 2>/dev/null; then
                    echo "      Contém componentes React Native"
                fi
            else
                echo "   ℹ️  $file (não encontrado)"
            fi
        done
        
        echo ""
        echo "📋 Verificando configuração API..."
        if [ -f "src/services/api.ts" ] && grep -q "3001" "src/services/api.ts"; then
            echo "   ❌ API ainda aponta para porta 3001"
        else
            echo "   ✅ API configurada corretamente"
        fi
        
        echo ""
        echo "💡 Execute uma das outras opções para corrigir"
        ;;
        
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "================================================================"
echo " PRÓXIMOS PASSOS"
echo "================================================================"
echo ""
echo "🚀 Para testar:"
echo "   Terminal 1: npm run server    (backend porta 3000)"
echo "   Terminal 2: npm run dev       (frontend porta 5173)"
echo ""
echo "🎯 URLs esperadas:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo ""
echo "❌ Se ainda houver erros:"
echo "   - Execute opção 2 (correção completa)"
echo "   - Ou opção 3 (solução temporária)"
echo ""
echo "✅ Menu de correção finalizado!"
