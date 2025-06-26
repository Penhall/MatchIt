# scripts/correcao-estrutura-tabela.sh - Corrigir estrutura da tabela e rotas

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

# Verificar estrutura atual da tabela
verificar_estrutura_tabela() {
    print_header "🔍 ANALISANDO ESTRUTURA REAL DA TABELA USERS"
    
    export PGPASSWORD="matchit123"
    print_info "Campos da tabela users:"
    psql -h localhost -p 5432 -U matchit -d matchit_db -c "\d users" 2>/dev/null | grep -E "id|email|password|name"
    
    print_info "Verificando campos específicos..."
    
    # Verificar se tem password ou password_hash
    has_password=$(psql -h localhost -p 5432 -U matchit -d matchit_db -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password';" 2>/dev/null | tr -d ' ')
    has_password_hash=$(psql -h localhost -p 5432 -U matchit -d matchit_db -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash';" 2>/dev/null | tr -d ' ')
    
    if [ "$has_password" = "password" ]; then
        print_success "✅ Campo 'password' existe"
        PASSWORD_FIELD="password"
    elif [ "$has_password_hash" = "password_hash" ]; then
        print_warning "⚠️ Campo 'password_hash' encontrado (não 'password')"
        PASSWORD_FIELD="password_hash"
    else
        print_error "❌ Nenhum campo de senha encontrado"
        PASSWORD_FIELD="password"
    fi
    
    # Verificar tipo do ID
    id_type=$(psql -h localhost -p 5432 -U matchit -d matchit_db -t -c "SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id';" 2>/dev/null | tr -d ' ')
    
    if [ "$id_type" = "uuid" ]; then
        print_warning "⚠️ ID é UUID (não SERIAL)"
        ID_TYPE="uuid"
    else
        print_success "✅ ID é numérico"
        ID_TYPE="serial"
    fi
    
    unset PGPASSWORD
    
    print_info "Configuração detectada:"
    echo "  - Campo senha: $PASSWORD_FIELD"
    echo "  - Tipo ID: $ID_TYPE"
    echo ""
}

# Corrigir rotas de autenticação para estrutura real
corrigir_rotas_auth() {
    print_header "🔧 CORRIGINDO ROTAS PARA ESTRUTURA REAL DA TABELA"
    
    # Backup
    cp server/routes/auth.js server/routes/auth.js.backup.$(date +%Y%m%d_%H%M%S)
    print_info "Backup criado"
    
    print_info "Criando rotas compatíveis com estrutura real..."
    cat > server/routes/auth.js << EOF
// server/routes/auth.js - Rotas compatíveis com estrutura real (ES Modules)
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'matchit-default-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register - Compatível com estrutura UUID
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registro solicitado:', { email: req.body.email, name: req.body.name });
    
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      console.log('❌ Campos obrigatórios faltando');
      return res.status(400).json({
        success: false,
        error: 'Email, senha e nome são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    if (password.length < 6) {
      console.log('❌ Senha muito fraca');
      return res.status(400).json({
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Verificar se email já existe
    console.log('🔍 Verificando se email existe:', email);
    const existingUser = await query('SELECT id FROM users WHERE email = \$1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('❌ Email já existe');
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso',
        code: 'EMAIL_EXISTS'
      });
    }
    
    // Hash da senha
    console.log('🔒 Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir usuário - ADAPTADO para estrutura real
    console.log('💾 Inserindo usuário no banco...');
    
    let insertQuery;
    let insertParams;
    
    if ('$ID_TYPE' === 'uuid') {
      // Para UUID: gerar UUID automaticamente
      if ('$PASSWORD_FIELD' === 'password_hash') {
        insertQuery = 'INSERT INTO users (email, password_hash, name) VALUES (\$1, \$2, \$3) RETURNING id, email, name';
      } else {
        insertQuery = 'INSERT INTO users (email, password, name) VALUES (\$1, \$2, \$3) RETURNING id, email, name';
      }
      insertParams = [email, hashedPassword, name];
    } else {
      // Para SERIAL: ID gerado automaticamente
      if ('$PASSWORD_FIELD' === 'password_hash') {
        insertQuery = 'INSERT INTO users (email, password_hash, name) VALUES (\$1, \$2, \$3) RETURNING id, email, name';
      } else {
        insertQuery = 'INSERT INTO users (email, password, name) VALUES (\$1, \$2, \$3) RETURNING id, email, name';
      }
      insertParams = [email, hashedPassword, name];
    }
    
    console.log('📝 Query:', insertQuery);
    const result = await query(insertQuery, insertParams);
    
    if (result.rows.length === 0) {
      console.log('❌ Falha ao inserir usuário');
      return res.status(500).json({
        success: false,
        error: 'Falha ao criar usuário',
        code: 'INSERT_FAILED'
      });
    }
    
    const user = result.rows[0];
    console.log('✅ Usuário criado:', { id: user.id, email: user.email });
    
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
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/login - Compatível com estrutura real
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login solicitado:', { email: req.body.email });
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Buscar usuário - ADAPTADO para campo de senha correto
    let selectQuery;
    if ('$PASSWORD_FIELD' === 'password_hash') {
      selectQuery = 'SELECT id, email, name, password_hash as password FROM users WHERE email = \$1';
    } else {
      selectQuery = 'SELECT id, email, name, password FROM users WHERE email = \$1';
    }
    
    console.log('🔍 Buscando usuário...');
    const result = await query(selectQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const user = result.rows[0];
    console.log('🔍 Verificando senha...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Senha inválida');
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const token = generateToken(user.id);
    console.log('✅ Login bem-sucedido');
    
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
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    const result = await query('SELECT id, email, name FROM users WHERE id = \$1', [decoded.userId]);
    
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

// GET /api/auth/test - Endpoint de teste
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rotas de autenticação funcionando!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login', 
      'GET /api/auth/me',
      'GET /api/auth/test'
    ]
  });
});

export default router;
EOF
    
    # Substituir variáveis no arquivo
    sed -i "s/\$PASSWORD_FIELD/$PASSWORD_FIELD/g" server/routes/auth.js
    sed -i "s/\$ID_TYPE/$ID_TYPE/g" server/routes/auth.js
    
    print_success "Rotas corrigidas para estrutura real da tabela"
    echo ""
}

# Verificar e corrigir integração no app.js
verificar_integracao_app() {
    print_header "🔍 VERIFICANDO INTEGRAÇÃO NO APP.JS"
    
    # Verificar se as rotas estão sendo carregadas DEPOIS da configuração do Express
    if grep -A 5 -B 5 "app.use.*'/api/auth'" server/app.js; then
        print_success "✅ Rotas de auth encontradas no app.js"
    else
        print_error "❌ Rotas de auth não encontradas"
        
        print_info "Adicionando rotas de auth ao app.js..."
        
        # Backup
        cp server/app.js server/app.js.backup.$(date +%Y%m%d_%H%M%S)
        
        # Adicionar depois da configuração básica do Express
        sed -i '/✅ Middleware básico configurado/a\
\
// =====================================================\
// ROTAS DE AUTENTICAÇÃO\
// =====================================================\
try {\
  const authRoutes = (await import('\''./routes/auth.js'\'')).default;\
  app.use('\''/api/auth'\'', authRoutes);\
  console.log(logger.info('\''✅ Rotas de autenticação carregadas'\''));\
} catch (error) {\
  console.log(logger.error(`❌ Erro ao carregar rotas de auth: \${error.message}`));\
}' server/app.js
        
        print_success "Rotas adicionadas ao app.js"
    fi
    
    echo ""
}

# Testar endpoints após correção
testar_endpoints_corrigidos() {
    print_header "🧪 TESTANDO ENDPOINTS CORRIGIDOS"
    
    print_info "Aguardando 3 segundos para servidor processar mudanças..."
    sleep 3
    
    # Testar endpoint de teste primeiro
    print_info "1. Testando endpoint de teste..."
    test_response=$(curl -s "http://localhost:3000/api/auth/test" 2>/dev/null)
    
    if echo "$test_response" | grep -q "success.*true"; then
        print_success "✅ Endpoint /api/auth/test funcionando!"
        print_info "Resposta: $test_response"
    else
        print_error "❌ Endpoint de teste falhou: $test_response"
    fi
    
    # Testar registro
    print_info "2. Testando registro de usuário..."
    unique_email="teste_correcao_$(date +%s)@test.com"
    
    register_response=$(curl -s -X POST "http://localhost:3000/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$unique_email\",\"password\":\"123456\",\"name\":\"Teste Correcao\"}")
    
    print_info "Resposta do registro: $register_response"
    
    if echo "$register_response" | grep -q "success.*true"; then
        print_success "✅ REGISTRO FUNCIONANDO!"
        
        # Extrair token e testar login
        token=$(echo "$register_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$token" ]; then
            print_info "3. Testando token..."
            me_response=$(curl -s -H "Authorization: Bearer $token" "http://localhost:3000/api/auth/me")
            
            if echo "$me_response" | grep -q "success.*true"; then
                print_success "✅ TOKEN FUNCIONANDO!"
                print_info "Resposta /me: $me_response"
            else
                print_warning "⚠️ Token não funciona: $me_response"
            fi
        fi
        
    elif echo "$register_response" | grep -q "EMAIL_EXISTS"; then
        print_warning "⚠️ Email já existe (testando login...)"
        
        # Testar login
        login_response=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$unique_email\",\"password\":\"123456\"}")
        
        if echo "$login_response" | grep -q "success.*true"; then
            print_success "✅ LOGIN FUNCIONANDO!"
        else
            print_warning "⚠️ Login falhou: $login_response"
        fi
        
    else
        print_error "❌ Registro ainda falha: $register_response"
    fi
    
    echo ""
}

# Relatório final
relatorio_final() {
    print_header "📊 RELATÓRIO DA CORREÇÃO ESTRUTURAL"
    
    echo ""
    print_info "✅ CORREÇÕES APLICADAS:"
    echo "  • Análise da estrutura real da tabela users"
    echo "  • Adaptação das queries para campo $PASSWORD_FIELD"
    echo "  • Compatibilidade com ID tipo $ID_TYPE"
    echo "  • Logs detalhados para debug"
    echo "  • Endpoint de teste adicionado"
    echo "  • Integração verificada no app.js"
    
    echo ""
    print_header "🚀 PRÓXIMOS PASSOS:"
    echo "1. 🔄 Se servidor não reiniciou automaticamente: npm run server"
    echo "2. 🧪 Execute o teste completo: ./scripts/teste-fase0-detalhado.sh"
    echo "3. ✅ Registro de usuário deve funcionar agora!"
    echo "4. 📱 Teste preferências de estilo também"
    
    echo ""
    print_success "✅ CORREÇÃO ESTRUTURAL CONCLUÍDA!"
    print_info "Sistema adaptado para estrutura real do banco de dados"
}

# Função principal
main() {
    print_header "🔧 CORREÇÃO DA ESTRUTURA DA TABELA E ROTAS"
    print_info "Adaptando código para estrutura real do banco de dados"
    echo ""
    
    verificar_estrutura_tabela
    corrigir_rotas_auth
    verificar_integracao_app
    testar_endpoints_corrigidos
    relatorio_final
}

# Executar
main "$@"