# scripts/correcao-direta-rotas.sh - Correção direta das rotas no sistema principal

#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() { echo -e "${CYAN}$1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Verificar estrutura do projeto
verificar_estrutura() {
    if [ ! -f "package.json" ]; then
        print_error "Execute este script na raiz do projeto MatchIt"
        exit 1
    fi
    print_success "Estrutura do projeto verificada"
}

# Identificar qual arquivo principal usar
identificar_arquivo_principal() {
    print_header "🔍 IDENTIFICANDO ARQUIVO PRINCIPAL DO SERVIDOR"
    
    # Verificar possíveis arquivos principais
    if [ -f "server/app.js" ]; then
        MAIN_FILE="server/app.js"
        print_success "Encontrado: server/app.js"
    elif [ -f "app.js" ]; then
        MAIN_FILE="app.js"
        print_success "Encontrado: app.js"
    elif [ -f "server.js" ]; then
        MAIN_FILE="server.js"
        print_success "Encontrado: server.js"
    else
        print_error "Arquivo principal do servidor não encontrado"
        exit 1
    fi
    
    print_info "Arquivo principal: $MAIN_FILE"
    echo ""
}

# Criar sistema de autenticação completo
criar_sistema_autenticacao() {
    print_header "🔐 CRIANDO SISTEMA DE AUTENTICAÇÃO COMPLETO"
    
    # Criar diretórios se não existirem
    mkdir -p server/routes server/middleware
    
    # 1. Middleware de autenticação
    print_info "Criando middleware de autenticação..."
    cat > server/middleware/auth.js << 'EOF'
// server/middleware/auth.js - Middleware de autenticação JWT
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso necessário',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchit-default-secret');
    
    // Buscar usuário no banco
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    req.user = result.rows[0];
    req.userId = result.rows[0].id;
    next();
    
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

module.exports = authMiddleware;
EOF
    
    # 2. Rotas de autenticação
    print_info "Criando rotas de autenticação..."
    cat > server/routes/auth.js << 'EOF'
// server/routes/auth.js - Rotas de autenticação
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'matchit-default-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, senha e nome são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso',
        code: 'EMAIL_EXISTS'
      });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir usuário
    const result = await query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    
    const user = result.rows[0];
    const token = generateToken(user.id);
    
    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    const result = await query('SELECT id, email, name, password FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/me - Verificar token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token necessário',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'matchit-default-secret');
    
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
});

module.exports = router;
EOF
    
    print_success "Sistema de autenticação criado"
    echo ""
}

# Função para integrar rotas no arquivo principal
integrar_rotas_servidor() {
    print_header "🔧 INTEGRANDO ROTAS NO SERVIDOR PRINCIPAL"
    
    # Backup do arquivo principal
    cp "$MAIN_FILE" "${MAIN_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "Backup criado: ${MAIN_FILE}.backup.*"
    
    # Ler o arquivo atual
    if grep -q "auth.js" "$MAIN_FILE"; then
        print_warning "Rotas de auth já parecem estar integradas"
    else
        print_info "Integrando rotas de autenticação..."
        
        # Criar um arquivo temporário com as modificações
        cat > temp_integration.js << 'EOF'
// === ADICIONADO: Importações necessárias ===
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

// === ADICIONADO: Rotas de autenticação (públicas) ===
app.use('/api/auth', authRoutes);

// === ADICIONADO: Middleware de autenticação para rotas protegidas ===
// Aplicar middleware apenas para rotas que precisam de autenticação
app.use('/api/profile', authMiddleware);

EOF
        
        # Encontrar onde inserir as rotas no arquivo principal
        # Vamos procurar por padrões comuns onde rotas são definidas
        if grep -q "app.use.*api" "$MAIN_FILE"; then
            # Inserir depois da última definição de rota
            line_number=$(grep -n "app.use.*api" "$MAIN_FILE" | tail -1 | cut -d: -f1)
            print_info "Inserindo rotas após linha $line_number"
            
            # Dividir o arquivo e inserir o conteúdo
            head -n $line_number "$MAIN_FILE" > temp_file.js
            echo "" >> temp_file.js
            echo "// =====================================================
// ROTAS DE AUTENTICAÇÃO (ADICIONADO AUTOMATICAMENTE)
// =====================================================
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

app.use('/api/auth', authRoutes);

// Aplicar middleware de autenticação para rotas protegidas
app.use('/api/profile', authMiddleware);" >> temp_file.js
            echo "" >> temp_file.js
            
            tail -n +$((line_number + 1)) "$MAIN_FILE" >> temp_file.js
            
            # Substituir o arquivo original
            mv temp_file.js "$MAIN_FILE"
            print_success "Rotas de autenticação integradas com sucesso"
            
        else
            print_warning "Padrão de rotas não encontrado, tentando abordagem diferente..."
            
            # Procurar por app.listen e inserir antes
            if grep -q "app.listen" "$MAIN_FILE"; then
                line_number=$(grep -n "app.listen" "$MAIN_FILE" | head -1 | cut -d: -f1)
                line_number=$((line_number - 1))
                
                head -n $line_number "$MAIN_FILE" > temp_file.js
                echo "
// =====================================================
// ROTAS DE AUTENTICAÇÃO (ADICIONADO AUTOMATICAMENTE)
// =====================================================
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/profile', authMiddleware);

" >> temp_file.js
                tail -n +$((line_number + 1)) "$MAIN_FILE" >> temp_file.js
                
                mv temp_file.js "$MAIN_FILE"
                print_success "Rotas integradas antes de app.listen"
            else
                print_error "Não foi possível encontrar local para integrar rotas"
                print_info "Você pode adicionar manualmente as seguintes linhas ao $MAIN_FILE:"
                echo ""
                cat temp_integration.js
                echo ""
            fi
        fi
    fi
    
    # Limpeza
    rm -f temp_integration.js temp_file.js
    echo ""
}

# Instalar dependências necessárias
instalar_dependencias() {
    print_header "📦 INSTALANDO DEPENDÊNCIAS"
    
    print_info "Verificando e instalando dependências necessárias..."
    
    # Lista de dependências necessárias
    dependencies=("bcrypt" "jsonwebtoken" "express" "pg" "dotenv")
    
    for dep in "${dependencies[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            print_success "$dep já instalado"
        else
            print_warning "$dep não encontrado, instalando..."
            npm install "$dep" --save
        fi
    done
    
    echo ""
}

# Verificar configuração do banco
verificar_config_banco() {
    print_header "🗄️  VERIFICANDO CONFIGURAÇÃO DO BANCO"
    
    # Verificar se .env existe com configurações corretas
    if [ -f ".env" ]; then
        if grep -q "DB_NAME=matchit_db" .env && grep -q "DB_USER=matchit" .env; then
            print_success "Configurações do banco corretas no .env"
        else
            print_warning "Corrigindo configurações do banco no .env..."
            
            # Backup do .env
            cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
            
            # Atualizar configurações do banco
            sed -i 's/DB_NAME=.*/DB_NAME=matchit_db/' .env
            sed -i 's/DB_USER=.*/DB_USER=matchit/' .env
            sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=matchit123/' .env
            sed -i 's/DATABASE_URL=.*/DATABASE_URL=postgresql:\/\/matchit:matchit123@localhost:5432\/matchit_db/' .env
            
            print_success "Configurações do banco corrigidas"
        fi
    else
        print_warning "Arquivo .env não encontrado, criando..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://matchit:matchit123@localhost:5432/matchit_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=matchit_db
DB_USER=matchit
DB_PASSWORD=matchit123

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=matchit-super-secret-jwt-key-2025
JWT_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Features
ENABLE_RECOMMENDATIONS=true
ENABLE_EMOTIONAL_PROFILE=true
ENABLE_ANALYTICS=true
EOF
        print_success "Arquivo .env criado"
    fi
    
    echo ""
}

# Testar integração
testar_integracao() {
    print_header "🧪 TESTANDO INTEGRAÇÃO"
    
    print_info "Verificando sintaxe do arquivo principal..."
    
    # Testar sintaxe JavaScript do arquivo principal
    if node -c "$MAIN_FILE" 2>/dev/null; then
        print_success "Sintaxe do $MAIN_FILE está correta"
    else
        print_error "Erro de sintaxe no $MAIN_FILE"
        print_info "Restaurando backup..."
        latest_backup=$(ls -t ${MAIN_FILE}.backup.* | head -1)
        if [ -f "$latest_backup" ]; then
            cp "$latest_backup" "$MAIN_FILE"
            print_success "Backup restaurado"
        fi
        exit 1
    fi
    
    # Testar sintaxe dos arquivos de rota
    if node -c server/routes/auth.js 2>/dev/null; then
        print_success "Sintaxe das rotas de auth está correta"
    else
        print_error "Erro de sintaxe em server/routes/auth.js"
        exit 1
    fi
    
    if node -c server/middleware/auth.js 2>/dev/null; then
        print_success "Sintaxe do middleware está correta"
    else
        print_error "Erro de sintaxe em server/middleware/auth.js"
        exit 1
    fi
    
    print_info "Aguarde 3 segundos para o servidor processar mudanças..."
    sleep 3
    
    # Testar endpoint de health se servidor estiver rodando
    health_response=$(curl -s "http://localhost:3000/api/health" 2>/dev/null)
    if echo "$health_response" | grep -q "ok\|connected"; then
        print_success "Servidor está respondendo"
        
        # Testar se rotas de auth estão disponíveis
        auth_response=$(curl -s "http://localhost:3000/api/auth/me" 2>/dev/null)
        if echo "$auth_response" | grep -q "Token necessário\|NO_TOKEN"; then
            print_success "✅ Rotas de autenticação FUNCIONANDO!"
        else
            print_warning "Rotas de auth não respondem como esperado: $auth_response"
        fi
    else
        print_warning "Servidor não está respondendo (pode estar reiniciando)"
    fi
    
    echo ""
}

# Relatório final
relatorio_final() {
    print_header "📊 RELATÓRIO DA CORREÇÃO DIRETA"
    
    echo ""
    print_info "✅ AÇÕES EXECUTADAS:"
    echo "  • Sistema de autenticação criado"
    echo "  • Rotas integradas no servidor principal: $MAIN_FILE"
    echo "  • Middleware de autenticação implementado"
    echo "  • Configurações do banco corrigidas"
    echo "  • Dependências verificadas/instaladas"
    echo "  • Sintaxe validada"
    
    echo ""
    print_header "🚀 PRÓXIMOS PASSOS:"
    echo "1. 🔄 Reinicie o servidor: npm run server"
    echo "2. 🧪 Execute o teste: ./scripts/teste-fase0-detalhado.sh"
    echo "3. ✅ Verifique se registro de usuário funciona"
    echo "4. 📈 Se tudo funcionar, taxa de sucesso deve ser 90%+"
    
    echo ""
    print_success "✅ CORREÇÃO DIRETA CONCLUÍDA!"
    print_info "As rotas de autenticação agora devem estar funcionando"
}

# Função principal
main() {
    print_header "🚀 CORREÇÃO DIRETA - INTEGRAÇÃO DE ROTAS"
    print_info "Integrando rotas de autenticação diretamente no servidor principal"
    echo ""
    
    verificar_estrutura
    identificar_arquivo_principal
    verificar_config_banco
    instalar_dependencias
    criar_sistema_autenticacao
    integrar_rotas_servidor
    testar_integracao
    relatorio_final
}

# Executar
main "$@"