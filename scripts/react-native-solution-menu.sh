#!/bin/bash
# scripts/react-native-solution-menu.sh - Menu de soluções para React Native vs Vite

echo "🔧 SOLUÇÕES REACT NATIVE ↔ VITE"
echo "==============================="
echo ""
echo "🎯 PROBLEMA IDENTIFICADO:"
echo "   Projeto React Native tentando rodar no Vite (React Web)"
echo ""
echo "❌ ERROS ATUAIS:"
echo "   • hooks/useAuth.ts com JSX (precisa ser .tsx)"
echo "   • import 'react-native' (não existe no web)"
echo "   • Componentes TouchableOpacity, View, etc."
echo "   • @react-native-async-storage, @react-navigation"
echo ""
echo "Escolha uma solução:"
echo ""
echo "1) ⚡ DESATIVAR REACT NATIVE - Move arquivos problemáticos (RÁPIDO)"
echo "2) 🔧 MIGRAÇÃO COMPLETA - Cria substitutos web para RN (COMPLETO)"
echo "3) 🧪 DIAGNÓSTICO - Ver exatamente quais arquivos têm problemas"
echo "4) 📋 APENAS RENOMEAR - Só corrigir .ts → .tsx"
echo "5) ❌ CANCELAR"
echo ""
read -p "Digite sua escolha (1-5): " choice

case $choice in
    1)
        echo ""
        echo "⚡ SOLUÇÃO RÁPIDA SELECIONADA"
        echo "============================"
        echo ""
        echo "📋 O que será feito:"
        echo "   • Renomear hooks/useAuth.ts → .tsx"
        echo "   • Mover arquivos React Native para temp_disabled_react_native/"
        echo "   • Criar aplicação React Web básica"
        echo "   • Manter arquivos originais como backup"
        echo ""
        read -p "Continuar? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            chmod +x scripts/disable-react-native.sh
            ./scripts/disable-react-native.sh
        else
            echo "❌ Cancelado"
        fi
        ;;
        
    2)
        echo ""
        echo "🔧 MIGRAÇÃO COMPLETA SELECIONADA"
        echo "==============================="
        echo ""
        echo "📋 O que será feito:"
        echo "   • Renomear todos os arquivos .ts com JSX → .tsx"
        echo "   • Criar substitutos web para todos componentes React Native"
        echo "   • Configurar aliases no Vite para compatibilidade"
        echo "   • Criar página de status detalhada"
        echo "   • Mover arquivos problemáticos com backup"
        echo ""
        read -p "Continuar? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            chmod +x scripts/fix-react-native-vite.sh
            ./scripts/fix-react-native-vite.sh
        else
            echo "❌ Cancelado"
        fi
        ;;
        
    3)
        echo ""
        echo "🧪 EXECUTANDO DIAGNÓSTICO"
        echo "========================"
        echo ""
        
        echo "📋 Verificando arquivos .ts com JSX..."
        jsx_files=()
        for file in $(find . -name "*.ts" -not -path "./node_modules/*" 2>/dev/null | head -20); do
            if [ -f "$file" ] && grep -q "return (" "$file" && grep -q "<.*>" "$file"; then
                jsx_files+=("$file")
                echo "   ❌ $file (tem JSX, deve ser .tsx)"
            fi
        done
        
        echo ""
        echo "📋 Verificando imports React Native..."
        rn_files=()
        for file in $(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules 2>/dev/null | head -20); do
            if [ -f "$file" ] && grep -q "from ['\"]react-native['\"]" "$file" 2>/dev/null; then
                rn_files+=("$file")
                echo "   ❌ $file (importa react-native)"
            fi
        done
        
        echo ""
        echo "📋 Verificando outros imports React Native..."
        rn_deps=("@react-native-async-storage" "@react-navigation" "react-native-safe-area" "react-native-chart")
        for dep in "${rn_deps[@]}"; do
            found_files=$(grep -r "$dep" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | cut -d: -f1 | sort -u | head -5)
            if [ ! -z "$found_files" ]; then
                echo "   ❌ Arquivos usando $dep:"
                echo "$found_files" | while read file; do
                    echo "      $file"
                done
            fi
        done
        
        echo ""
        echo "📊 RESUMO DO DIAGNÓSTICO:"
        echo "   • ${#jsx_files[@]} arquivos .ts com JSX"
        echo "   • ${#rn_files[@]} arquivos importando react-native"
        echo ""
        echo "💡 RECOMENDAÇÃO:"
        if [ ${#jsx_files[@]} -lt 3 ] && [ ${#rn_files[@]} -lt 5 ]; then
            echo "   Use opção 1 (Desativar React Native) - poucos arquivos"
        else
            echo "   Use opção 2 (Migração Completa) - muitos arquivos"
        fi
        ;;
        
    4)
        echo ""
        echo "📋 APENAS RENOMEANDO .ts → .tsx"
        echo "=============================="
        echo ""
        
        # Renomear hooks/useAuth.ts
        if [ -f "hooks/useAuth.ts" ]; then
            mv "hooks/useAuth.ts" "hooks/useAuth.tsx"
            echo "   ✅ hooks/useAuth.ts → hooks/useAuth.tsx"
        fi
        
        # Procurar outros arquivos .ts com JSX
        renamed_count=0
        for file in $(find . -name "*.ts" -not -path "./node_modules/*" 2>/dev/null | head -10); do
            if [ -f "$file" ] && grep -q "return (" "$file" && grep -q "<.*>" "$file"; then
                new_file="${file%.ts}.tsx"
                mv "$file" "$new_file"
                echo "   ✅ $file → $new_file"
                ((renamed_count++))
            fi
        done
        
        echo ""
        echo "✅ $renamed_count arquivos renomeados"
        echo "🚀 Teste agora: npm run dev"
        echo "⚠️  Pode ainda ter erros de imports React Native"
        ;;
        
    5)
        echo ""
        echo "❌ CANCELADO"
        exit 0
        ;;
        
    *)
        echo ""
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
echo "💡 Se ainda houver erros:"
echo "   • Execute a próxima opção do menu"
echo "   • Ou mova mais arquivos React Native"
echo ""
echo "✅ Menu finalizado!"
