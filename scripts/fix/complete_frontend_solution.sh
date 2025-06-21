#!/bin/bash
# scripts/fix/complete_frontend_solution.sh - Solução completa para problemas frontend
# Arquivo: scripts/fix/complete_frontend_solution.sh

# =====================================================
# SOLUÇÃO COMPLETA PARA PROBLEMAS FRONTEND
# =====================================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   SOLUÇÃO COMPLETA - PROBLEMAS FRONTEND${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

echo -e "${YELLOW}Problema identificado na screenshot:${NC}"
echo "• ❌ Mostrando 'login.authError' em vez da mensagem traduzida"
echo "• ❌ Sistema i18n configurado mas incompleto"
echo "• ❌ Arquivo de tradução sem chaves de erro"
echo ""

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Etapa 1: Criar estrutura de diretórios
echo -e "${YELLOW}1. Criando estrutura de diretórios...${NC}"
mkdir -p src/locales
mkdir -p src/context
mkdir -p src/screens
mkdir -p src/services

echo -e "${GREEN}✅ Estrutura criada${NC}"

# Etapa 2: Backup e atualização do arquivo de tradução
echo -e "${YELLOW}2. Atualizando arquivo de tradução pt-BR.json...${NC}"

if [ -f "src/locales/pt-BR.json" ]; then
    cp "src/locales/pt-BR.json" "src/locales/pt-BR.json.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup criado${NC}"
fi

# Criar arquivo de tradução completo
cat > "src/locales/pt-BR.json" << 'EOF'
{
  "login": {
    "title": "MatchIt",
    "subtitle": "Conecte-se através de estilo e emoção",
    "email": "Endereço de Email",
    "password": "Senha",
    "confirmPassword": "Confirmar Senha",
    "signUp": "Cadastrar",
    "logIn": "Entrar",
    "alreadyHaveAccount": "Já tem uma conta? Entrar",
    "noAccount": "Não tem uma conta? Cadastrar",
    "continueWith": "Ou continue com",
    "authError": "Erro na autenticação. Verifique suas credenciais.",
    "invalidCredentials": "Email ou senha incorretos.",
    "emailExists": "Este email já está cadastrado.",
    "passwordMismatch": "As senhas não coincidem.",
    "weakPassword": "A senha deve ter pelo menos 6 caracteres.",
    "invalidEmail": "Email inválido.",
    "networkError": "Erro de conexão. Tente novamente.",
    "registrationSuccess": "Cadastro realizado com sucesso!",
    "loginSuccess": "Login realizado com sucesso!",
    "requiredFields": "Todos os campos são obrigatórios.",
    "serverError": "Erro no servidor. Tente novamente mais tarde.",
    "unknownError": "Erro desconhecido. Tente novamente.",
    "emailRequired": "Email é obrigatório.",
    "passwordRequired": "Senha é obrigatória.",
    "nameRequired": "Nome é obrigatório.",
    "loading": "Carregando...",
    "pleaseWait": "Por favor, aguarde...",
    "tryAgain": "Tentar novamente"
  },
  "profile": {
    "edit": {
      "displayName": "Nome de Exibição"
    }
  },
  "errors": {
    "general": "Algo deu errado. Tente novamente.",
    "network": "Erro de conexão. Verifique sua internet.",
    "server": "Erro no servidor. Tente novamente mais tarde.",
    "validation": "Dados inválidos. Verifique os campos.",
    "unauthorized": "Acesso negado. Faça login novamente.",
    "forbidden": "Você não tem permissão para esta ação.",
    "notFound": "Item não encontrado.",
    "timeout": "Operação expirou. Tente novamente."
  },
  "common": {
    "ok": "OK",
    "cancel": "Cancelar",
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso!"
  }
}
EOF

echo -e "${GREEN}✅ Arquivo pt-BR.json atualizado${NC}"

# Etapa 3: Verificar/criar configuração i18n
echo -e "${YELLOW}3. Verificando configuração i18n...${NC}"

if [ -f "src/i18n.ts" ] || [ -f "src/i18n.js" ]; then
    echo -e "${GREEN}✅ Arquivo i18n encontrado${NC}"
else
    echo -e "${YELLOW}Criando configuração i18n...${NC}"
    
    cat > "src/i18n.ts" << 'EOF'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ptBR from './locales/pt-BR.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        translation: ptBR
      }
    },
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false
    },
    debug: process.env.NODE_ENV === 'development'
  });

export default i18n;
EOF
    echo -e "${GREEN}✅ Configuração i18n criada${NC}"
fi

# Etapa 4: Verificar dependências
echo -e "${YELLOW}4. Verificando dependências i18n...${NC}"

if grep -q "react-i18next" package.json; then
    echo -e "${GREEN}✅ react-i18next encontrado no package.json${NC}"
else
    echo -e "${YELLOW}⚠️  react-i18next não encontrado${NC}"
    echo -e "${YELLOW}Adicione as dependências:${NC}"
    echo "npm install react-i18next i18next i18next-browser-languagedetector"
    echo "# ou"
    echo "yarn add react-i18next i18next i18next-browser-languagedetector"
fi

# Etapa 5: Criar exemplos de correção
echo -e "${YELLOW}5. Criando exemplos de código corrigido...${NC}"

# Exemplo de AuthContext corrigido
cat > "/tmp/AuthContext_example.tsx" << 'EOF'
// Exemplo de como mapear erros para traduções no AuthContext
const mapErrorToTranslation = (error: any): string => {
  const { t } = useTranslation();
  
  if (error?.response?.status === 400) {
    return t('login.invalidCredentials');
  }
  if (error?.response?.status === 500) {
    return t('login.serverError');
  }
  if (error?.code === 'NETWORK_ERROR') {
    return t('login.networkError');
  }
  
  return t('login.authError');
};
EOF

# Exemplo de LoginScreen corrigido
cat > "/tmp/LoginScreen_example.tsx" << 'EOF'
// Exemplo de como exibir erros traduzidos no LoginScreen
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { error } = useAuth();

  return (
    <div>
      {/* Seus campos de formulário aqui */}
      
      {/* CORREÇÃO: Exibir erro traduzido */}
      {error && (
        <div style={{
          color: '#ef4444',
          backgroundColor: '#fef2f2',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      
      <button type="submit">
        {t('login.signUp')}
      </button>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Exemplos criados em /tmp/${NC}"

# Etapa 6: Verificar import do i18n
echo -e "${YELLOW}6. Verificando import do i18n no App...${NC}"

app_files=("src/App.tsx" "src/App.jsx" "src/main.tsx" "src/main.jsx" "src/index.tsx" "src/index.jsx")
found_app=false

for file in "${app_files[@]}"; do
    if [ -f "$file" ]; then
        found_app=true
        if grep -q "i18n" "$file"; then
            echo -e "${GREEN}✅ i18n já importado em $file${NC}"
        else
            echo -e "${YELLOW}⚠️  Adicione esta linha no topo de $file:${NC}"
            echo "import './i18n';"
        fi
        break
    fi
done

if [ "$found_app" = false ]; then
    echo -e "${YELLOW}⚠️  Não encontrei App.tsx/jsx. Certifique-se de importar './i18n'${NC}"
fi

# Etapa 7: Instruções de teste
echo -e "${YELLOW}7. Testando a correção...${NC}"

echo "Para testar se a correção funcionou:"
echo "1. Reinicie o servidor de desenvolvimento"
echo "2. Tente fazer cadastro com dados inválidos"
echo "3. Deve aparecer mensagem em português em vez de 'login.authError'"

# Etapa 8: Instruções finais
echo ""
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   INSTRUÇÕES PARA APLICAR A CORREÇÃO${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

echo -e "${GREEN}Arquivos criados/atualizados:${NC}"
echo "• ✅ src/locales/pt-BR.json (com todas as traduções de erro)"
echo "• ✅ src/i18n.ts (configuração do i18next)"
echo "• ✅ Exemplos em /tmp/ para referência"
echo ""

echo -e "${YELLOW}Próximos passos obrigatórios:${NC}"
echo ""

echo -e "${BLUE}1. Instalar dependências (se não estiverem instaladas):${NC}"
echo "npm install react-i18next i18next i18next-browser-languagedetector"
echo ""

echo -e "${BLUE}2. Importar i18n no seu App.tsx:${NC}"
echo "// No topo do arquivo src/App.tsx"
echo "import './i18n';"
echo ""

echo -e "${BLUE}3. No seu AuthContext, usar useTranslation:${NC}"
echo "import { useTranslation } from 'react-i18next';"
echo "const { t } = useTranslation();"
echo "// Depois: setError(t('login.authError'))"
echo ""

echo -e "${BLUE}4. No seu LoginScreen, exibir erro:${NC}"
echo "const { error } = useAuth();"
echo "// E renderizar: {error && <div>{error}</div>}"
echo ""

echo -e "${BLUE}5. Reiniciar servidor:${NC}"
echo "npm start"
echo "# ou"
echo "yarn start"
echo ""

echo -e "${GREEN}Depois disso:${NC}"
echo "• Em vez de 'login.authError' → 'Erro na autenticação. Verifique suas credenciais.'"
echo "• Em vez de 'login.invalidCredentials' → 'Email ou senha incorretos.'"
echo "• E assim por diante..."
echo ""

echo -e "${YELLOW}Para debug, verifique no console do navegador:${NC}"
echo "• Se há erros de importação do i18n"
echo "• Se as traduções estão sendo carregadas"
echo "• Se useTranslation() está funcionando"
echo ""

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}   SOLUÇÃO COMPLETA CRIADA! 🎨✨${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

echo -e "${GREEN}Problema original:${NC} 'login.authError' aparecendo literalmente"
echo -e "${GREEN}Solução:${NC} Sistema completo de tradução com todas as chaves necessárias"
echo -e "${GREEN}Resultado:${NC} Mensagens de erro em português para melhor UX"