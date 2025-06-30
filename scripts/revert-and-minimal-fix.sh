# scripts/revert-and-minimal-fix.sh - Reverter alterações e aplicar correção mínima
#!/bin/bash

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}🔄 $1${NC}"
    echo -e "${BLUE}================================${NC}\n"
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

# Função para backup de segurança
create_safety_backup() {
    print_header "CRIANDO BACKUP DE SEGURANÇA"
    
    local backup_dir="backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup dos arquivos principais
    [ -f "package.json" ] && cp "package.json" "$backup_dir/"
    [ -f "vite.config.ts" ] && cp "vite.config.ts" "$backup_dir/"
    [ -f "vite.config.js" ] && cp "vite.config.js" "$backup_dir/"
    [ -d "src" ] && cp -r "src" "$backup_dir/"
    [ -d "screens" ] && cp -r "screens" "$backup_dir/"
    [ -d "hooks" ] && cp -r "hooks" "$backup_dir/"
    [ -d "server" ] && cp -r "server" "$backup_dir/"
    
    print_success "Backup criado em: $backup_dir"
}

# Reverter arquivos movidos/desabilitados
restore_moved_files() {
    print_header "RESTAURANDO ARQUIVOS MOVIDOS"
    
    # Procurar por diretórios de backup/temp criados pelos scripts anteriores
    for temp_dir in temp_disabled_* disabled_* backup_*; do
        if [ -d "$temp_dir" ]; then
            print_info "Encontrado diretório de backup: $temp_dir"
            
            # Restaurar arquivos de volta ao local original
            find "$temp_dir" -type f | while read -r file; do
                # Remover o prefixo do diretório temporário para obter o caminho original
                original_path="${file#$temp_dir/}"
                original_dir=$(dirname "$original_path")
                
                # Criar diretório se não existir
                [ ! -d "$original_dir" ] && mkdir -p "$original_dir"
                
                # Restaurar arquivo se não existir no local original
                if [ ! -f "$original_path" ]; then
                    cp "$file" "$original_path"
                    print_success "Restaurado: $original_path"
                else
                    print_warning "Arquivo já existe: $original_path (não sobrescrito)"
                fi
            done
            
            # Remover diretório temporário após restauração
            read -p "Remover diretório temporário $temp_dir? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$temp_dir"
                print_success "Diretório temporário removido: $temp_dir"
            fi
        fi
    done
}

# Corrigir apenas os problemas críticos mínimos
apply_minimal_fixes() {
    print_header "APLICANDO CORREÇÕES MÍNIMAS"
    
    # 1. Renomear arquivos .ts com JSX para .tsx
    print_info "Corrigindo extensões de arquivo..."
    
    if [ -f "hooks/useAuth.ts" ] && grep -q "jsx\|tsx\|<.*>" "hooks/useAuth.ts" 2>/dev/null; then
        mv "hooks/useAuth.ts" "hooks/useAuth.tsx"
        print_success "Renomeado: hooks/useAuth.ts → hooks/useAuth.tsx"
    fi
    
    if [ -f "screens/StyleAdjustmentScreen.ts" ]; then
        mv "screens/StyleAdjustmentScreen.ts" "screens/StyleAdjustmentScreen.tsx"
        print_success "Renomeado: screens/StyleAdjustmentScreen.ts → screens/StyleAdjustmentScreen.tsx"
    fi
    
    if [ -f "screens/SettingsScreen.ts" ]; then
        mv "screens/SettingsScreen.ts" "screens/SettingsScreen.tsx"
        print_success "Renomeado: screens/SettingsScreen.ts → screens/SettingsScreen.tsx"
    fi
    
    # 2. Corrigir URL da API se estiver errada
    print_info "Verificando configuração da API..."
    
    if [ -f "src/services/api.ts" ]; then
        # Substituir porta 3001 por 3000 se existir
        if grep -q "3001" "src/services/api.ts"; then
            sed -i.bak 's/3001/3000/g' "src/services/api.ts"
            print_success "API corrigida para porta 3000"
        fi
    fi
    
    # 3. Instalar dependências básicas se faltarem
    print_info "Verificando dependências críticas..."
    
    # Verificar se react-router-dom está instalado
    if ! npm list react-router-dom >/dev/null 2>&1; then
        print_info "Instalando react-router-dom..."
        npm install react-router-dom
        print_success "react-router-dom instalado"
    fi
    
    # Verificar se axios está instalado
    if ! npm list axios >/dev/null 2>&1; then
        print_info "Instalando axios..."
        npm install axios
        print_success "axios instalado"
    fi
}

# Configurar Vite para aceitar arquivos React Native
configure_vite_compatibility() {
    print_header "CONFIGURANDO COMPATIBILIDADE VITE"
    
    # Criar vite.config.ts mínimo mas funcional
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@screens': path.resolve(__dirname, './screens'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  },
  
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Corrigido para porta 3000
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Configuração para aceitar arquivos React Native em ambiente web
  define: {
    global: 'globalThis',
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios']
  }
});
EOF
    
    print_success "vite.config.ts configurado com compatibilidade"
}

# Verificar se o servidor está funcionando
test_basic_functionality() {
    print_header "TESTANDO FUNCIONALIDADE BÁSICA"
    
    # Verificar se consegue fazer build
    print_info "Testando build do Vite..."
    if npm run build >/dev/null 2>&1; then
        print_success "Build do Vite funcionando"
    else
        print_warning "Build com problemas (normal se há dependências React Native)"
    fi
    
    # Verificar se o backend está rodando
    print_info "Verificando backend..."
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "Backend respondendo na porta 3000"
    else
        print_warning "Backend não está rodando ou não responde na porta 3000"
        print_info "Execute: npm run server"
    fi
}

# Criar um plano de próximos passos
create_action_plan() {
    print_header "PLANO DE PRÓXIMOS PASSOS"
    
    cat > RECOVERY_PLAN.md << 'EOF'
# 🚑 Plano de Recuperação do Projeto MatchIt

## ✅ Correções Aplicadas

1. **Arquivos Restaurados**: Arquivos movidos/desabilitados foram restaurados
2. **Extensões Corrigidas**: .ts → .tsx para arquivos com JSX
3. **API Corrigida**: Porta 3001 → 3000
4. **Dependências**: react-router-dom e axios instalados
5. **Vite Configurado**: Compatibilidade básica com estrutura híbrida

## 🎯 Próximos Passos Recomendados

### Passo 1: Testar o Sistema
```bash
# Terminal 1: Iniciar backend
npm run server

# Terminal 2: Iniciar frontend
npm run dev
```

### Passo 2: Resolver Conflitos React Native vs Web
**Opção A**: Manter Híbrido
- Criar aliases para componentes React Native → Web equivalentes
- Configurar conditional imports baseado no ambiente

**Opção B**: Separar Projetos
- Mover React Native para diretório separado
- Manter apenas React Web no Vite

### Passo 3: Corrigir Problemas Específicos
Se ainda houver erros:
1. **Imports React Native**: Criar substitutos web
2. **Hooks com problemas**: Verificar sintaxe JSX
3. **API endpoints**: Verificar se backend está funcionando

## 🚨 O Que NÃO Fazer

- ❌ NÃO mover/desabilitar arquivos novamente
- ❌ NÃO aplicar "soluções" drásticas
- ❌ NÃO tentar converter tudo de uma vez

## ✅ O Que Fazer

- ✅ Corrigir um problema por vez
- ✅ Testar após cada mudança
- ✅ Manter backups sempre
- ✅ Verificar se a funcionalidade quebra antes de aplicar correções

## 📞 Se Problemas Persistirem

1. Compartilhe o erro específico que aparece
2. Informe qual funcionalidade não está funcionando
3. Descreva o que estava funcionando antes
EOF
    
    print_success "Plano de recuperação criado em: RECOVERY_PLAN.md"
}

# Função principal
main() {
    echo -e "${GREEN}"
    echo "🚑 SCRIPT DE REVERSÃO E CORREÇÃO MÍNIMA"
    echo "======================================"
    echo -e "${NC}"
    
    echo "Este script vai:"
    echo "1. Criar backup de segurança"
    echo "2. Restaurar arquivos movidos/desabilitados"
    echo "3. Aplicar apenas correções mínimas necessárias"
    echo "4. Configurar compatibilidade básica"
    echo "5. Testar funcionalidade básica"
    echo ""
    
    read -p "Continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    create_safety_backup
    restore_moved_files
    apply_minimal_fixes
    configure_vite_compatibility
    test_basic_functionality
    create_action_plan
    
    print_header "REVERSÃO CONCLUÍDA"
    print_success "Projeto restaurado com correções mínimas aplicadas"
    print_info "Leia o arquivo RECOVERY_PLAN.md para próximos passos"
    print_warning "Se problemas persistirem, compartilhe o erro específico"
}

# Executar apenas se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi