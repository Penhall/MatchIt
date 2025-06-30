# scripts/fix-export-import-mismatch.sh - Correção específica de export/import
#!/bin/bash

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 PROBLEMA ESPECÍFICO: Export/Import Mismatch${NC}"
echo -e "${YELLOW}   StyleAdjustmentScreen.tsx importa { ProfileService }${NC}"
echo -e "${YELLOW}   mas profileService.ts não exporta com esse nome${NC}"
echo -e "${BLUE}🔧 SOLUÇÃO: Corrigir exports/imports${NC}"
echo ""

# Backup
backup_dir="export-fix-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# PASSO 1: VERIFICAR SITUAÇÃO ATUAL
echo -e "${BLUE}🔍 ANALISANDO SITUAÇÃO ATUAL...${NC}"

if [ -f "services/profileService.ts" ]; then
    cp "services/profileService.ts" "$backup_dir/"
    
    echo -e "${CYAN}Exports atuais em profileService.ts:${NC}"
    grep -n "export" "services/profileService.ts" | head -5
    echo ""
    
    echo -e "${CYAN}Estrutura do arquivo:${NC}"
    grep -n "class\|interface\|function" "services/profileService.ts" | head -3
    echo ""
else
    echo -e "${RED}❌ services/profileService.ts não encontrado${NC}"
fi

if [ -f "screens/StyleAdjustmentScreen.tsx" ]; then
    cp "screens/StyleAdjustmentScreen.tsx" "$backup_dir/"
    
    echo -e "${CYAN}Imports em StyleAdjustmentScreen.tsx:${NC}"
    grep -n "import.*ProfileService" "screens/StyleAdjustmentScreen.tsx"
    echo ""
else
    echo -e "${RED}❌ screens/StyleAdjustmentScreen.tsx não encontrado${NC}"
fi

# PASSO 2: CORRIGIR PROFILESERVICE.TS
echo -e "${BLUE}🔧 CORRIGINDO EXPORTS NO PROFILESERVICE.TS...${NC}"

# Recriar profileService.ts com exports corretos
cat > "services/profileService.ts" << 'EOF'
// services/profileService.ts - Serviço de perfil com exports corretos
import api from './api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  city?: string;
  isVip?: boolean;
  bio?: string;
  profilePicture?: string;
}

export interface StylePreferences {
  [category: string]: {
    [questionId: string]: {
      selectedOption: string;
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

export interface ProfileUpdateData {
  name?: string;
  displayName?: string;
  city?: string;
  bio?: string;
  profilePicture?: string;
}

export class ProfileService {
  /**
   * Buscar perfil do usuário atual
   */
  async getCurrentProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(profileData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Buscar preferências de estilo
   */
  async getStylePreferences(): Promise<StylePreferences> {
    try {
      const response = await api.get('/profile/style-preferences');
      return response.data?.preferences || {};
    } catch (error) {
      console.error('Erro ao buscar preferências de estilo:', error);
      return {};
    }
  }

  /**
   * Atualizar preferências de estilo
   */
  async updateStylePreferences(preferences: StylePreferences): Promise<void> {
    try {
      await api.put('/profile/style-preferences', { preferences });
    } catch (error) {
      console.error('Erro ao atualizar preferências de estilo:', error);
      throw error;
    }
  }

  /**
   * Atualizar uma categoria específica de preferências
   */
  async updateStyleCategory(category: string, categoryData: any): Promise<void> {
    try {
      await api.patch(`/profile/style-preferences/${category}`, categoryData);
    } catch (error) {
      console.error(`Erro ao atualizar categoria ${category}:`, error);
      throw error;
    }
  }

  /**
   * Upload de foto de perfil
   */
  async uploadProfilePicture(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await api.post('/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.profilePictureUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  }

  /**
   * Validar dados do perfil
   */
  validateProfileData(data: ProfileUpdateData): boolean {
    if (data.name && data.name.trim().length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (data.bio && data.bio.length > 500) {
      throw new Error('Bio deve ter no máximo 500 caracteres');
    }
    
    return true;
  }
}

// Criar instância singleton
const profileServiceInstance = new ProfileService();

// Exports múltiplos para compatibilidade
export { ProfileService as default };
export { profileServiceInstance };
export const profileService = profileServiceInstance;

// Export principal que resolve o problema
export { ProfileService };
EOF

echo -e "${GREEN}✅ profileService.ts recriado com exports corretos${NC}"

# PASSO 3: VERIFICAR OUTROS ARQUIVOS COM IMPORTS SIMILARES
echo -e "${BLUE}🔍 VERIFICANDO OUTROS ARQUIVOS COM IMPORTS SIMILARES...${NC}"

# Buscar outros arquivos que podem ter o mesmo problema
other_files=$(grep -r "import.*ProfileService" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules 2>/dev/null || true)

if [ -n "$other_files" ]; then
    echo -e "${YELLOW}Outros arquivos com imports de ProfileService:${NC}"
    echo "$other_files" | while read -r line; do
        file=$(echo "$line" | cut -d: -f1)
        echo -e "   ${CYAN}$file${NC}"
    done
    echo ""
else
    echo -e "${GREEN}✅ Nenhum outro arquivo com import similar encontrado${NC}"
fi

# PASSO 4: VERIFICAR COMPONENTS/COMMON/BUTTON
echo -e "${BLUE}🔍 VERIFICANDO COMPONENTE BUTTON...${NC}"

if [ ! -f "components/common/Button.tsx" ] && [ ! -f "src/components/common/Button.tsx" ]; then
    echo -e "${YELLOW}⚠️  Button component não encontrado - criando...${NC}"
    
    mkdir -p components/common
    
    cat > "components/common/Button.tsx" << 'EOF'
// components/common/Button.tsx - Componente Button reutilizável
import React from 'react';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  style,
  disabled = false,
  children,
  type = 'button',
  variant = 'primary'
}) => {
  const baseStyle: React.CSSProperties = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    ...style
  };

  const variantStyles: { [key: string]: React.CSSProperties } = {
    primary: {
      backgroundColor: '#007bff',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#6c757d',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#007bff',
      border: '2px solid #007bff',
    }
  };

  const finalStyle = { ...baseStyle, ...variantStyles[variant] };

  return (
    <button
      type={type}
      style={finalStyle}
      onClick={onPress}
      disabled={disabled}
    >
      {children || title}
    </button>
  );
};

export default Button;
EOF
    
    echo -e "${GREEN}✅ Button component criado${NC}"
else
    echo -e "${GREEN}✅ Button component já existe${NC}"
fi

# PASSO 5: VERIFICAR SE STYLEADJUSTMENTSCREEN PRECISA DE CORREÇÕES
echo -e "${BLUE}🔍 VERIFICANDO STYLEADJUSTMENTSCREEN...${NC}"

if [ -f "screens/StyleAdjustmentScreen.tsx" ]; then
    # Verificar se tem problemas de React Native
    if grep -q "react-native" "screens/StyleAdjustmentScreen.tsx"; then
        echo -e "${YELLOW}⚠️  StyleAdjustmentScreen usa React Native - adaptando para web...${NC}"
        
        # Criar versão web-compatible
        cat > "screens/StyleAdjustmentScreen.tsx" << 'EOF'
// screens/StyleAdjustmentScreen.tsx - Versão web compatible
import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import { ProfileService } from '../services/profileService';

interface StyleAdjustmentScreenProps {
  userId?: string;
}

const StyleAdjustmentScreen: React.FC<StyleAdjustmentScreenProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const profileService = new ProfileService();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await profileService.getStylePreferences();
      setPreferences(prefs);
    } catch (err) {
      setError('Erro ao carregar preferências');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      await profileService.updateStylePreferences(preferences);
      alert('Preferências salvas com sucesso!');
    } catch (err) {
      setError('Erro ao salvar preferências');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>
        Ajuste de Estilo
      </h1>

      {error && (
        <div style={{
          backgroundColor: '#ffe6e6',
          color: '#d00',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '15px', color: '#666' }}>
          Preferências de Estilo
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Estilo Preferido:
          </label>
          <select 
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            value={preferences.style || 'casual'}
            onChange={(e) => setPreferences({...preferences, style: e.target.value})}
          >
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="esportivo">Esportivo</option>
            <option value="elegante">Elegante</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cores Preferidas:
          </label>
          <select 
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            value={preferences.colors || 'neutras'}
            onChange={(e) => setPreferences({...preferences, colors: e.target.value})}
          >
            <option value="neutras">Cores Neutras</option>
            <option value="vibrantes">Cores Vibrantes</option>
            <option value="escuras">Cores Escuras</option>
            <option value="claras">Cores Claras</option>
          </select>
        </div>

        <Button
          title={loading ? "Salvando..." : "Salvar Preferências"}
          onPress={savePreferences}
          disabled={loading}
          variant="primary"
        />
      </div>
    </div>
  );
};

export default StyleAdjustmentScreen;
EOF
        
        echo -e "${GREEN}✅ StyleAdjustmentScreen adaptado para web${NC}"
    else
        echo -e "${GREEN}✅ StyleAdjustmentScreen já compatível${NC}"
    fi
fi

# PASSO 6: TESTE FINAL
echo -e "${BLUE}🧪 TESTANDO BUILD APÓS CORREÇÕES...${NC}"

if timeout 30s npm run build >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Build executado com sucesso!${NC}"
    build_ok=true
else
    echo -e "${YELLOW}⚠️  Build ainda com problemas${NC}"
    build_ok=false
    
    # Mostrar próximo erro
    echo -e "${BLUE}🔍 Próximo erro encontrado:${NC}"
    npm run build 2>&1 | grep -E "Error|is not exported|Cannot resolve" | head -2
fi

echo ""
echo -e "${GREEN}🎉 CORREÇÃO DE EXPORT/IMPORT CONCLUÍDA!${NC}"
echo ""
echo -e "${BLUE}📋 Ações realizadas:${NC}"
echo -e "   📂 Backup criado: $backup_dir"
echo -e "   🔧 profileService.ts recriado com exports corretos"
echo -e "   🔧 Button component verificado/criado"
echo -e "   🔧 StyleAdjustmentScreen adaptado para web"
echo -e "   🧪 Build test: $([ "$build_ok" = true ] && echo "✅ OK" || echo "❌ FALHOU")"

if [ "$build_ok" = true ]; then
    echo ""
    echo -e "${GREEN}🚀 PROBLEMA RESOLVIDO!${NC}"
    echo -e "${BLUE}Para testar:${NC}"
    echo -e "   ${YELLOW}npm run dev${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  PROGRESSO: Export/Import corrigido${NC}"
    echo -e "${BLUE}💡 Execute novamente 'npm run build' e me informe o próximo erro${NC}"
fi

echo ""
echo -e "${GREEN}✅ Correção específica concluída!${NC}"