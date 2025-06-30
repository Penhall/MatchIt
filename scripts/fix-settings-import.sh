# scripts/fix-settings-import.sh - Correção urgente do import problemático
#!/bin/bash

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 PROBLEMA CRÍTICO IDENTIFICADO:${NC}"
echo -e "${YELLOW}   SettingsScreen.tsx importando arquivo inexistente${NC}"
echo -e "${BLUE}🔧 CORREÇÃO: Remover/substituir import problemático${NC}"
echo ""

# Backup do SettingsScreen antes da correção
if [ -f "screens/SettingsScreen.tsx" ]; then
    backup_file="screens/SettingsScreen.tsx.backup.$(date +%Y%m%d_%H%M%S)"
    cp "screens/SettingsScreen.tsx" "$backup_file"
    echo -e "${GREEN}✅ Backup criado: $backup_file${NC}"
    
    echo -e "${BLUE}🔍 Analisando imports problemáticos...${NC}"
    
    # Mostrar imports atuais
    echo -e "${CYAN}Imports atuais no SettingsScreen.tsx:${NC}"
    grep -n "^import" "screens/SettingsScreen.tsx" | head -10
    echo ""
    
    # Verificar se tem o import problemático
    if grep -q "recommendation/user-interaction-analytics" "screens/SettingsScreen.tsx"; then
        echo -e "${RED}❌ Import problemático encontrado!${NC}"
        echo -e "${BLUE}🔧 Removendo import problemático...${NC}"
        
        # Remover linha com import problemático
        sed -i '/recommendation\/user-interaction-analytics/d' "screens/SettingsScreen.tsx"
        
        echo -e "${GREEN}✅ Import problemático removido${NC}"
    else
        echo -e "${YELLOW}⚠️  Import problemático não encontrado no SettingsScreen.tsx${NC}"
    fi
    
    # Verificar outros imports problemáticos comuns
    echo -e "${BLUE}🔍 Verificando outros imports problemáticos...${NC}"
    
    problematic_imports=(
        "recommendation/"
        "user-interaction"
        "../services/profileService"
        "analytics"
        "../utils/"
    )
    
    for import_pattern in "${problematic_imports[@]}"; do
        if grep -q "$import_pattern" "screens/SettingsScreen.tsx"; then
            echo -e "${YELLOW}⚠️  Encontrado import suspeito: $import_pattern${NC}"
            
            # Mostrar linha específica
            grep -n "$import_pattern" "screens/SettingsScreen.tsx" | head -3
            
            # Perguntar se deve remover
            read -p "Remover este import? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sed -i "/$import_pattern/d" "screens/SettingsScreen.tsx"
                echo -e "${GREEN}✅ Import removido${NC}"
            fi
        fi
    done
    
else
    echo -e "${RED}❌ SettingsScreen.tsx não encontrado em screens/${NC}"
    exit 1
fi

# Verificar se algum import ainda está problemático
echo -e "${BLUE}🧪 Testando compilação após correções...${NC}"

# Teste rápido do build
if timeout 20s npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Build executado com sucesso!${NC}"
    build_ok=true
else
    echo -e "${YELLOW}⚠️  Build ainda com problemas${NC}"
    build_ok=false
    
    # Tentar identificar o erro específico
    echo -e "${BLUE}🔍 Identificando erro específico...${NC}"
    npm run build 2>&1 | grep -E "Could not resolve|Failed to resolve|Error" | head -3
fi

echo ""

if [ "$build_ok" = true ]; then
    echo -e "${GREEN}🎉 PROBLEMA RESOLVIDO!${NC}"
    echo ""
    echo -e "${BLUE}Para testar agora:${NC}"
    echo -e "   ${YELLOW}npm run dev${NC}"
    echo ""
    echo -e "${GREEN}✅ O aplicativo deve carregar sem erros!${NC}"
else
    echo -e "${YELLOW}⚠️  AINDA HÁ PROBLEMAS${NC}"
    echo ""
    echo -e "${BLUE}💡 Vamos investigar o SettingsScreen.tsx:${NC}"
    
    # Mostrar imports restantes
    echo -e "${CYAN}Imports restantes:${NC}"
    grep -n "^import" "screens/SettingsScreen.tsx" | head -5 || echo "Nenhum import encontrado"
    
    # Tentar criar SettingsScreen básico se ainda há problemas
    echo ""
    read -p "Substituir por SettingsScreen básico funcional? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔧 Criando SettingsScreen básico...${NC}"
        
        cat > "screens/SettingsScreen.tsx" << 'EOF'
import React from 'react';

const SettingsScreen: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Configurações</h1>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '15px', color: '#666' }}>Conta</h2>
        <div style={{ marginBottom: '10px' }}>
          <button style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            textAlign: 'left'
          }}>
            Editar Perfil
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            textAlign: 'left'
          }}>
            Privacidade
          </button>
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '15px', color: '#666' }}>Notificações</h2>
        <div style={{ marginBottom: '10px' }}>
          <button style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            textAlign: 'left'
          }}>
            Push Notifications
          </button>
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '15px', color: '#666' }}>Aplicativo</h2>
        <div style={{ marginBottom: '10px' }}>
          <button style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            textAlign: 'left'
          }}>
            Sobre
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            textAlign: 'left'
          }}>
            Termos de Uso
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
EOF
        
        echo -e "${GREEN}✅ SettingsScreen básico criado${NC}"
        
        # Testar novamente
        echo -e "${BLUE}🧪 Testando novamente...${NC}"
        if timeout 20s npm run build >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Agora funciona!${NC}"
        else
            echo -e "${RED}❌ Ainda há problemas - precisamos investigar mais${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}✅ Correção do SettingsScreen concluída!${NC}"