#!/bin/bash
# scripts/diagnose-matchit-project.sh - Script completo de diagnóstico do projeto MatchIt

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_missing() {
    echo -e "${RED}[FALTANDO]${NC} $1"
}

log_found() {
    echo -e "${GREEN}[ENCONTRADO]${NC} $1"
}

log_section() {
    echo -e "\n${PURPLE}========================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# Contadores globais
MISSING_COUNT=0
FOUND_COUNT=0
ERROR_COUNT=0

# Função para verificar arquivo
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        log_found "$description: $file"
        FOUND_COUNT=$((FOUND_COUNT + 1))
        return 0
    else
        log_missing "$description: $file"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        return 1
    fi
}

# Função para verificar conteúdo do arquivo
check_file_content() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [ -f "$file" ]; then
        if grep -q "$pattern" "$file" 2>/dev/null; then
            log_success "$description encontrado em $file"
            return 0
        else
            log_warning "$description NÃO encontrado em $file"
            return 1
        fi
    else
        log_error "Arquivo $file não existe para verificação de $description"
        ERROR_COUNT=$((ERROR_COUNT + 1))
        return 1
    fi
}

# Função para verificar dependência npm
check_npm_dependency() {
    local package="$1"
    local description="$2"
    
    if npm list "$package" >/dev/null 2>&1; then
        log_found "Dependência: $description ($package)"
        return 0
    else
        log_missing "Dependência: $description ($package)"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        return 1
    fi
}

# Função principal de diagnóstico
main_diagnosis() {
    echo "========================================================"
    echo "  🔍 DIAGNÓSTICO COMPLETO - PROJETO MATCHIT"
    echo "========================================================"
    echo ""
    echo "Executando diagnóstico abrangente..."
    echo "Data: $(date)"
    echo "Diretório: $(pwd)"
    echo ""

    # ====================================================
    # 1. VERIFICAÇÃO DE ESTRUTURA BÁSICA
    # ====================================================
    log_section "1. ESTRUTURA BÁSICA DO PROJETO"
    
    # Arquivos de configuração essenciais
    check_file "package.json" "Configuração do projeto"
    check_file "package-lock.json" "Lock de dependências"
    check_file "vite.config.js" "Configuração Vite" || check_file "vite.config.ts" "Configuração Vite (TS)"
    check_file "tsconfig.json" "Configuração TypeScript"
    check_file ".env" "Variáveis de ambiente" || log_warning "Arquivo .env não encontrado (opcional)"
    
    # Diretórios essenciais
    if [ -d "src" ]; then
        log_found "Diretório: src/"
    else
        log_missing "Diretório: src/"
    fi
    
    if [ -d "server" ]; then
        log_found "Diretório: server/"
    else
        log_missing "Diretório: server/"
    fi

    # ====================================================
    # 2. VERIFICAÇÃO DE ARQUIVOS PRINCIPAIS
    # ====================================================
    log_section "2. ARQUIVOS PRINCIPAIS DA APLICAÇÃO"
    
    # App principal (pode estar na raiz ou em src/)
    APP_LOCATIONS=("App.tsx" "src/App.tsx" "src/app.tsx")
    APP_FOUND=false
    for location in "${APP_LOCATIONS[@]}"; do
        if [ -f "$location" ]; then
            log_found "App principal: $location"
            APP_PATH="$location"
            APP_FOUND=true
            break
        fi
    done
    
    if [ "$APP_FOUND" = false ]; then
        log_missing "App principal: App.tsx (procurado em: ${APP_LOCATIONS[*]})"
    fi
    
    # Arquivo principal de entrada
    check_file "src/main.tsx" "Arquivo de entrada React" || check_file "src/index.tsx" "Arquivo de entrada alternativo"
    check_file "index.html" "HTML principal"

    # ====================================================
    # 3. VERIFICAÇÃO DE HOOKS CUSTOMIZADOS
    # ====================================================
    log_section "3. HOOKS CUSTOMIZADOS"
    
    mkdir -p src/hooks 2>/dev/null || true
    
    check_file "src/hooks/useAuth.ts" "Hook de autenticação"
    check_file "src/hooks/useApi.ts" "Hook de API"
    check_file "src/hooks/useTournament.ts" "Hook de torneios"
    
    # Verificar exports dos hooks
    if [ -f "src/hooks/useAuth.ts" ]; then
        check_file_content "src/hooks/useAuth.ts" "export.*useAuth" "Export useAuth"
        check_file_content "src/hooks/useAuth.ts" "AuthProvider" "AuthProvider component"
    fi
    
    if [ -f "src/hooks/useApi.ts" ]; then
        check_file_content "src/hooks/useApi.ts" "export.*useApi" "Export useApi"
    fi
    
    if [ -f "src/hooks/useTournament.ts" ]; then
        check_file_content "src/hooks/useTournament.ts" "export.*useTournament" "Export useTournament"
        check_file_content "src/hooks/useTournament.ts" "TournamentCategory" "Interface TournamentCategory"
    fi

    # ====================================================
    # 4. SISTEMA DE INTERNACIONALIZAÇÃO
    # ====================================================
    log_section "4. SISTEMA I18N (INTERNACIONALIZAÇÃO)"
    
    check_file "src/i18n.ts" "Configuração i18n"
    check_file "src/locales/pt-BR.json" "Traduções PT-BR" || check_file "locales/pt-BR.json" "Traduções PT-BR (raiz)"
    
    # Verificar configuração i18n
    if [ -f "src/i18n.ts" ]; then
        check_file_content "src/i18n.ts" "i18next" "Import i18next"
        check_file_content "src/i18n.ts" "initReactI18next" "React i18next"
        check_file_content "src/i18n.ts" "pt-BR" "Configuração PT-BR"
    fi
    
    # Verificar importação no main.tsx
    if [ -f "src/main.tsx" ]; then
        check_file_content "src/main.tsx" "i18n" "Import i18n no main.tsx"
    fi

    # ====================================================
    # 5. TELAS/SCREENS DO PROJETO
    # ====================================================
    log_section "5. TELAS (SCREENS) DA APLICAÇÃO"
    
    mkdir -p src/screens 2>/dev/null || true
    
    # Telas básicas
    check_file "src/screens/HomeScreen.tsx" "Tela inicial"
    check_file "src/screens/ProfileScreen.tsx" "Tela de perfil"
    check_file "src/screens/SettingsScreen.tsx" "Tela de configurações"
    check_file "src/screens/StyleAdjustmentScreen.tsx" "Tela de ajuste de estilo"
    
    # Telas de torneio (Fase 2)
    check_file "src/screens/TournamentScreen.tsx" "Tela de torneio 2x2"
    check_file "src/screens/TournamentResultScreen.tsx" "Tela de resultados"
    check_file "src/screens/AdminTournamentPanel.tsx" "Painel administrativo"
    
    # CSS para telas
    check_file "src/screens/TournamentScreen.css" "CSS da tela de torneio"
    
    # Verificar se existem telas em outros locais
    BACKUP_LOCATIONS=(
        "backup_complete_20250629_222346/screens/"
        "backup_before_restore_20250629_232931/src/screens/"
        "screens/"
    )
    
    echo ""
    log_info "Procurando telas em backups..."
    for backup_dir in "${BACKUP_LOCATIONS[@]}"; do
        if [ -d "$backup_dir" ]; then
            log_info "Backup encontrado: $backup_dir"
            if [ -f "${backup_dir}TournamentScreen.tsx" ]; then
                log_found "TournamentScreen em backup: ${backup_dir}TournamentScreen.tsx"
            fi
            if [ -f "${backup_dir}AdminTournamentPanel.tsx" ]; then
                log_found "AdminTournamentPanel em backup: ${backup_dir}AdminTournamentPanel.tsx"
            fi
        fi
    done

    # ====================================================
    # 6. DEPENDÊNCIAS NPM
    # ====================================================
    log_section "6. DEPENDÊNCIAS NPM"
    
    # Dependências essenciais para React
    check_npm_dependency "react" "React"
    check_npm_dependency "react-dom" "React DOM"
    check_npm_dependency "react-router-dom" "React Router"
    
    # Dependências para i18n
    check_npm_dependency "i18next" "i18next core"
    check_npm_dependency "react-i18next" "React i18next"
    check_npm_dependency "i18next-browser-languagedetector" "i18next detector"
    
    # Dependências para API
    check_npm_dependency "axios" "Cliente HTTP"
    
    # Dependências de desenvolvimento
    check_npm_dependency "vite" "Vite bundler"
    check_npm_dependency "@types/react" "Types React"
    check_npm_dependency "typescript" "TypeScript"

    # ====================================================
    # 7. VERIFICAÇÃO DE IMPORTS/EXPORTS
    # ====================================================
    log_section "7. VERIFICAÇÃO DE IMPORTS/EXPORTS"
    
    # Verificar imports no App.tsx
    if [ -f "$APP_PATH" ]; then
        echo ""
        log_info "Analisando imports em $APP_PATH..."
        
        check_file_content "$APP_PATH" "react-router-dom" "React Router imports"
        check_file_content "$APP_PATH" "useAuth" "Import useAuth"
        
        # Verificar se importa telas de torneio
        if grep -q "TournamentScreen" "$APP_PATH" 2>/dev/null; then
            log_success "Import TournamentScreen encontrado"
        else
            log_warning "Import TournamentScreen NÃO encontrado"
        fi
        
        # Verificar rotas
        if grep -q "/tournament" "$APP_PATH" 2>/dev/null; then
            log_success "Rotas de torneio encontradas"
        else
            log_warning "Rotas de torneio NÃO encontradas"
        fi
    fi
    
    # Verificar erros comuns de TypeScript
    echo ""
    log_info "Verificando possíveis erros TypeScript..."
    
    if command -v tsc >/dev/null 2>&1; then
        log_info "Executando verificação TypeScript..."
        if tsc --noEmit --skipLibCheck 2>/dev/null; then
            log_success "Sem erros TypeScript detectados"
        else
            log_warning "Possíveis erros TypeScript encontrados"
            echo "Execute 'npx tsc --noEmit' para detalhes"
        fi
    else
        log_warning "TypeScript compiler não encontrado"
    fi

    # ====================================================
    # 8. VERIFICAÇÃO DO BACKEND
    # ====================================================
    log_section "8. BACKEND/SERVIDOR"
    
    check_file "server/app.js" "Aplicação principal do servidor"
    check_file "server/routes/profile.js" "Rotas de perfil"
    check_file "server/routes/tournament.js" "Rotas de torneio"
    check_file "server/services/TournamentEngine.js" "Motor de torneios"
    
    # Verificar banco de dados
    check_file "database/migrations/001_initial_schema.sql" "Schema inicial"
    check_file "database/migrations/002_tournament_schema.sql" "Schema de torneios"

    # ====================================================
    # 9. RELATÓRIO FINAL E SUGESTÕES
    # ====================================================
    log_section "9. RELATÓRIO FINAL"
    
    echo ""
    echo "📊 ESTATÍSTICAS:"
    echo "   ✓ Arquivos encontrados: $FOUND_COUNT"
    echo "   ✗ Arquivos faltando: $MISSING_COUNT"
    echo "   ⚠ Erros detectados: $ERROR_COUNT"
    echo ""
    
    # Gerar sugestões baseadas no que está faltando
    if [ $MISSING_COUNT -gt 0 ]; then
        echo "🔧 SUGESTÕES DE CORREÇÃO:"
        echo ""
        
        # Sugestões específicas baseadas no que encontramos
        if [ ! -f "src/screens/TournamentScreen.tsx" ]; then
            echo "📄 CRIAR TournamentScreen.tsx:"
            echo "   mkdir -p src/screens"
            echo "   # Copiar de backup ou criar novo arquivo"
            echo ""
        fi
        
        if ! npm list "react-router-dom" >/dev/null 2>&1; then
            echo "📦 INSTALAR DEPENDÊNCIAS:"
            echo "   npm install react-router-dom"
            echo "   npm install i18next react-i18next i18next-browser-languagedetector"
            echo ""
        fi
        
        if [ ! -f "src/i18n.ts" ]; then
            echo "🌍 CONFIGURAR I18N:"
            echo "   # Criar src/i18n.ts"
            echo "   # Criar src/locales/pt-BR.json"
            echo "   # Importar no src/main.tsx"
            echo ""
        fi
        
        if [ $MISSING_COUNT -gt 5 ]; then
            echo "🚀 SUGESTÃO: Execute o script de setup completo:"
            echo "   ./scripts/integrate-phase2-complete.sh"
            echo ""
        fi
    else
        echo "🎉 PROJETO PARECE ESTAR COMPLETO!"
        echo ""
        echo "✅ Todos os arquivos essenciais foram encontrados."
        echo "✅ Dependências estão instaladas."
        echo "✅ Estrutura está correta."
        echo ""
        echo "🚀 Próximos passos:"
        echo "   npm run dev"
        echo "   # Navegar para http://localhost:5173"
        echo ""
    fi
    
    # Salvar relatório em arquivo
    REPORT_FILE="diagnostic_report_$(date +%Y%m%d_%H%M%S).txt"
    
    echo "💾 Salvando relatório detalhado em: $REPORT_FILE"
    
    # Gerar relatório detalhado
    cat > "$REPORT_FILE" << EOF
=======================================================
RELATÓRIO DE DIAGNÓSTICO - PROJETO MATCHIT
=======================================================
Data: $(date)
Diretório: $(pwd)
Sistema: $(uname -s)

ESTATÍSTICAS:
- Arquivos encontrados: $FOUND_COUNT
- Arquivos faltando: $MISSING_COUNT  
- Erros detectados: $ERROR_COUNT

ESTRUTURA DO PROJETO:
$(if [ -f "package.json" ]; then echo "✓ package.json"; else echo "✗ package.json"; fi)
$(if [ -f "src/App.tsx" ]; then echo "✓ src/App.tsx"; else echo "✗ src/App.tsx"; fi)
$(if [ -f "src/main.tsx" ]; then echo "✓ src/main.tsx"; else echo "✗ src/main.tsx"; fi)

HOOKS:
$(if [ -f "src/hooks/useAuth.ts" ]; then echo "✓ useAuth.ts"; else echo "✗ useAuth.ts"; fi)
$(if [ -f "src/hooks/useApi.ts" ]; then echo "✓ useApi.ts"; else echo "✗ useApi.ts"; fi)
$(if [ -f "src/hooks/useTournament.ts" ]; then echo "✓ useTournament.ts"; else echo "✗ useTournament.ts"; fi)

TELAS:
$(if [ -f "src/screens/TournamentScreen.tsx" ]; then echo "✓ TournamentScreen.tsx"; else echo "✗ TournamentScreen.tsx"; fi)
$(if [ -f "src/screens/AdminTournamentPanel.tsx" ]; then echo "✓ AdminTournamentPanel.tsx"; else echo "✗ AdminTournamentPanel.tsx"; fi)

I18N:
$(if [ -f "src/i18n.ts" ]; then echo "✓ i18n.ts"; else echo "✗ i18n.ts"; fi)
$(if [ -f "src/locales/pt-BR.json" ]; then echo "✓ pt-BR.json"; else echo "✗ pt-BR.json"; fi)

DEPENDÊNCIAS CRÍTICAS:
$(if npm list react >/dev/null 2>&1; then echo "✓ react"; else echo "✗ react"; fi)
$(if npm list react-router-dom >/dev/null 2>&1; then echo "✓ react-router-dom"; else echo "✗ react-router-dom"; fi)
$(if npm list i18next >/dev/null 2>&1; then echo "✓ i18next"; else echo "✗ i18next"; fi)

PRÓXIMOS PASSOS:
$(if [ $MISSING_COUNT -eq 0 ]; then echo "✅ Projeto pronto! Execute: npm run dev"; else echo "🔧 Corrigir arquivos faltando e executar setup"; fi)

=======================================================
EOF
    
    echo ""
    echo "=========================================="
    if [ $MISSING_COUNT -eq 0 ]; then
        log_success "DIAGNÓSTICO CONCLUÍDO - PROJETO OK!"
    else
        log_warning "DIAGNÓSTICO CONCLUÍDO - $MISSING_COUNT ITENS PRECISAM DE ATENÇÃO"
    fi
    echo "=========================================="
}

# Executar diagnóstico principal
main_diagnosis "$@"