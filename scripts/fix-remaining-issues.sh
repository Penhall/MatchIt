# scripts/fix-remaining-issues.sh - Correção específica dos problemas restantes
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

print_header "CORREÇÃO DOS PROBLEMAS ESPECÍFICOS"

echo -e "${RED}${BOLD}🎯 PROBLEMAS IDENTIFICADOS:${NC}"
echo -e "${YELLOW}   1. SettingsScreen.tsx na raiz, não em screens/${NC}"
echo -e "${YELLOW}   2. profileService não existe${NC}"
echo -e "${BLUE}🔧 SOLUÇÕES: Mover arquivo + criar serviços faltando${NC}"
echo ""

# Backup de segurança
backup_dir="final-fix-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# PROBLEMA 1: MOVER SETTINGSSCREEN
print_header "PROBLEMA 1: SETTINGSSCREEN.TSX"

print_step "Verificando localização do SettingsScreen.tsx..."

if [ -f "SettingsScreen.tsx" ]; then
    print_info "Encontrado na raiz: SettingsScreen.tsx"
    
    # Backup antes de mover
    cp "SettingsScreen.tsx" "$backup_dir/"
    
    # Verificar se já existe em screens/
    if [ -f "screens/SettingsScreen.tsx" ]; then
        print_warning "Já existe screens/SettingsScreen.tsx - criando backup"
        cp "screens/SettingsScreen.tsx" "$backup_dir/SettingsScreen.existing.tsx"
    fi
    
    # Mover para screens/
    cp "SettingsScreen.tsx" "screens/SettingsScreen.tsx"
    print_success "SettingsScreen.tsx copiado para screens/"
    
    # Opcional: remover da raiz
    read -p "Remover SettingsScreen.tsx da raiz? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "SettingsScreen.tsx"
        print_success "Arquivo removido da raiz"
    fi
    
elif [ -f "screens/SettingsScreen.tsx" ]; then
    print_success "SettingsScreen.tsx já está em screens/"
else
    print_error "SettingsScreen.tsx não encontrado em lugar nenhum!"
    print_step "Procurando em backups..."
    
    # Buscar em backups
    settings_found=$(find . -name "SettingsScreen.tsx" -type f | grep -v node_modules | head -5)
    if [ -n "$settings_found" ]; then
        print_info "Encontrado em:"
        echo "$settings_found" | while read -r path; do
            echo -e "   ${CYAN}$path${NC}"
        done
        
        # Usar o primeiro encontrado
        first_found=$(echo "$settings_found" | head -1)
        cp "$first_found" "screens/SettingsScreen.tsx"
        print_success "SettingsScreen.tsx copiado de $first_found"
    else
        print_warning "Nenhum SettingsScreen.tsx encontrado - criando básico..."
        
        # Criar SettingsScreen básico
        cat > "screens/SettingsScreen.tsx" << 'EOF'
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Configurações</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Editar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Privacidade</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Push Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Email</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicativo</Text>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Sobre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Termos de Uso</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#666',
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SettingsScreen;
EOF
        
        print_success "SettingsScreen.tsx básico criado"
    fi
fi

# PROBLEMA 2: PROFILESERVICE FALTANDO
print_header "PROBLEMA 2: PROFILESERVICE FALTANDO"

print_step "Verificando serviços necessários..."

# Criar diretório services se não existir
mkdir -p services

# Verificar se profileService existe
if [ ! -f "services/profileService.ts" ] && [ ! -f "services/profileService.js" ]; then
    print_warning "profileService não encontrado - criando..."
    
    cat > "services/profileService.ts" << 'EOF'
// services/profileService.ts - Serviço de perfil do usuário
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

class ProfileService {
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
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
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
      throw error;
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
   * Atualizar uma categoria de preferências
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
}

const profileService = new ProfileService();
export default profileService;
EOF
    
    print_success "profileService.ts criado"
else
    print_success "profileService já existe"
fi

# Verificar outros serviços que podem estar faltando
print_step "Verificando outros serviços necessários..."

# Verificar se api.ts existe
if [ ! -f "services/api.ts" ] && [ ! -f "src/services/api.ts" ]; then
    print_warning "api service não encontrado - criando..."
    
    cat > "services/api.ts" << 'EOF'
// services/api.ts - Configuração da API
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
EOF
    
    print_success "api.ts criado"
fi

# PROBLEMA 3: VERIFICAR OUTROS IMPORTS PROBLEMÁTICOS
print_header "PROBLEMA 3: VERIFICANDO OUTROS IMPORTS"

print_step "Analisando imports no StyleAdjustmentScreen.tsx..."

if [ -f "screens/StyleAdjustmentScreen.tsx" ]; then
    # Extrair todos os imports
    imports=$(grep -n "^import" "screens/StyleAdjustmentScreen.tsx" || true)
    
    if [ -n "$imports" ]; then
        echo "$imports" | while read -r line; do
            echo -e "   ${CYAN}$line${NC}"
            
            # Extrair path do import
            import_path=$(echo "$line" | sed -n "s/.*from ['\"]([^'\"]*)['\"].*/\1/p")
            
            if [[ "$import_path" == ../* ]]; then
                # Import relativo - verificar se arquivo existe
                actual_path=$(dirname "screens/StyleAdjustmentScreen.tsx")/$import_path
                
                if [[ "$import_path" == *".ts" ]] || [[ "$import_path" == *".tsx" ]]; then
                    # Path completo
                    if [ -f "$actual_path" ]; then
                        echo -e "     ${GREEN}✅ Arquivo existe${NC}"
                    else
                        echo -e "     ${RED}❌ Arquivo não encontrado: $actual_path${NC}"
                    fi
                else
                    # Tentar com extensões
                    if [ -f "$actual_path.ts" ] || [ -f "$actual_path.tsx" ] || [ -f "$actual_path.js" ] || [ -f "$actual_path/index.ts" ]; then
                        echo -e "     ${GREEN}✅ Arquivo existe${NC}"
                    else
                        echo -e "     ${RED}❌ Arquivo não encontrado: $actual_path${NC}"
                    fi
                fi
            fi
        done
    fi
fi

# TESTE FINAL
print_header "TESTE FINAL DE COMPILAÇÃO"

print_step "Testando compilação após correções..."

# Tentar build novamente
if timeout 30s npm run build >/dev/null 2>&1; then
    print_success "Build executado com sucesso!"
    build_status="✅ OK"
else
    print_warning "Build ainda com problemas"
    build_status="❌ FALHOU"
fi

# Teste do dev server
print_step "Testando dev server após correções..."

npm run dev > final_test.log 2>&1 &
dev_pid=$!

sleep 5

if kill -0 $dev_pid 2>/dev/null; then
    # Verificar erros no log
    if grep -q "Failed to resolve import\|Error\|Cannot resolve" final_test.log; then
        print_warning "Ainda há erros de import:"
        grep "Failed to resolve import\|Error\|Cannot resolve" final_test.log | head -3 | sed 's/^/   /'
        dev_status="⚠️  COM ERROS"
    else
        print_success "Dev server sem erros de import!"
        dev_status="✅ OK"
    fi
    
    kill $dev_pid 2>/dev/null || true
    sleep 2
    kill -9 $dev_pid 2>/dev/null || true
else
    print_error "Dev server falhou"
    dev_status="❌ FALHOU"
fi

rm -f final_test.log

# RELATÓRIO FINAL
print_header "RELATÓRIO FINAL"

echo -e "${GREEN}${BOLD}🎯 CORREÇÕES ESPECÍFICAS APLICADAS!${NC}"
echo ""
echo -e "${BLUE}📋 Ações realizadas:${NC}"
echo -e "   📂 Backup criado: $backup_dir"
echo -e "   📄 SettingsScreen.tsx movido/criado para screens/"
echo -e "   🔧 profileService.ts criado"
echo -e "   🔧 api.ts verificado/criado"
echo -e "   🧪 Build test: $build_status"
echo -e "   🧪 Dev server test: $dev_status"
echo ""

if [[ "$build_status" == *"OK"* ]] && [[ "$dev_status" == *"OK"* ]]; then
    echo -e "${GREEN}${BOLD}🚀 TODOS OS PROBLEMAS RESOLVIDOS!${NC}"
    echo ""
    echo -e "${BLUE}Para testar:${NC}"
    echo -e "   ${YELLOW}npm run dev${NC}"
    echo -e "   ${YELLOW}Navegador: http://localhost:5173${NC}"
    echo ""
    echo -e "${GREEN}✅ Você deve ver o aplicativo funcionando completamente!${NC}"
else
    echo -e "${YELLOW}⚠️  ALGUNS PROBLEMAS PODEM PERSISTIR${NC}"
    echo ""
    echo -e "${BLUE}💡 PRÓXIMOS PASSOS:${NC}"
    echo -e "   1. Execute: npm run dev"
    echo -e "   2. Verifique console do navegador"
    echo -e "   3. Me informe qualquer erro restante"
fi

print_success "Correção específica concluída!"