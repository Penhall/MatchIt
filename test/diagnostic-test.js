// test/diagnostic-test.js
// Script para diagnosticar o erro 500 no registro de usuário

import http from 'http';

class DiagnosticTester {
  constructor() {
    this.log('🔍 DIAGNÓSTICO DO ERRO 500', 'header');
  }

  log(message, type = 'info') {
    const colors = {
      'info': '\x1b[36m',
      'success': '\x1b[32m',
      'error': '\x1b[31m',
      'warning': '\x1b[33m',
      'header': '\x1b[35m'
    };
    
    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString().substr(11, 8);
    const color = colors[type] || colors.info;
    
    console.log(`${color}[${timestamp}] ${message}${reset}`);
  }

  makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve({ 
              status: res.statusCode, 
              data: jsonData, 
              headers: res.headers,
              raw: responseData
            });
          } catch (error) {
            resolve({ 
              status: res.statusCode, 
              data: responseData, 
              headers: res.headers,
              raw: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async checkServerLogs() {
    this.log('📋 Verificando logs do servidor...', 'info');
    this.log('⚠️  Monitore os logs do Docker para ver erros detalhados:', 'warning');
    this.log('   docker logs matchit-backend-1', 'warning');
  }

  async testBasicRegistration() {
    this.log('🧪 Testando registro básico...', 'info');
    
    const userData = {
      email: `diagnostic-${Date.now()}@test.com`,
      password: 'test123',
      name: 'Diagnostic User'
    };

    try {
      const result = await this.makeRequest('POST', '/api/auth/register', userData);
      
      this.log(`Status: ${result.status}`, result.status === 201 ? 'success' : 'error');
      this.log(`Response: ${result.raw}`, 'info');
      
      if (result.status === 500) {
        this.log('❌ Confirmado: Erro 500 no registro', 'error');
        
        // Verificar se é erro de SQL/banco
        if (typeof result.data === 'object' && result.data.error) {
          this.log(`Erro retornado: ${result.data.error}`, 'error');
        }
      }
      
      return result;
    } catch (error) {
      this.log(`❌ Erro de rede: ${error.message}`, 'error');
      return null;
    }
  }

  async testMinimalRegistration() {
    this.log('🧪 Testando registro mínimo...', 'info');
    
    const minimalData = {
      email: `minimal-${Date.now()}@test.com`,
      password: 'test123',
      name: 'Test'
    };

    try {
      const result = await this.makeRequest('POST', '/api/auth/register', minimalData);
      this.log(`Status mínimo: ${result.status}`, result.status === 201 ? 'success' : 'error');
      return result;
    } catch (error) {
      this.log(`❌ Erro no mínimo: ${error.message}`, 'error');
      return null;
    }
  }

  async testExistingEndpoints() {
    this.log('🧪 Testando outros endpoints de auth...', 'info');
    
    // Testar login com dados inválidos (deve dar 401, não 500)
    try {
      const loginResult = await this.makeRequest('POST', '/api/auth/login', {
        email: 'nao-existe@test.com',
        password: 'senha-errada'
      });
      
      this.log(`Login inválido: ${loginResult.status} (esperado: 401)`, 
        loginResult.status === 401 ? 'success' : 'warning');
        
    } catch (error) {
      this.log(`❌ Erro no login: ${error.message}`, 'error');
    }
  }

  async checkDatabaseTables() {
    this.log('🗄️  Para verificar tabelas do banco:', 'info');
    this.log('   docker exec -it matchit-postgres-1 psql -U matchit -d matchit_db', 'info');
    this.log('   \\dt', 'info');
    this.log('', 'info');
    this.log('🔍 Tabelas obrigatórias que devem existir:', 'info');
    this.log('   - users (original)', 'info');
    this.log('   - user_profiles (original)', 'info');
    this.log('   - user_extended_profiles (nova)', 'info');
    this.log('   - user_algorithm_weights (nova)', 'info');
    this.log('   - user_interactions (nova)', 'info');
  }

  async suggestSolutions() {
    this.log('💡 POSSÍVEIS SOLUÇÕES:', 'header');
    this.log('', 'info');
    
    this.log('1️⃣ VERIFICAR MIGRATIONS:', 'warning');
    this.log('   python scripts/run_all_migrations.py', 'info');
    this.log('', 'info');
    
    this.log('2️⃣ VERIFICAR LOGS DO CONTAINER:', 'warning');
    this.log('   docker logs matchit-backend-1 --tail 50', 'info');
    this.log('', 'info');
    
    this.log('3️⃣ REINICIAR CONTAINERS:', 'warning');
    this.log('   docker-compose down && docker-compose up --build', 'info');
    this.log('', 'info');
    
    this.log('4️⃣ VERIFICAR BANCO MANUALMENTE:', 'warning');
    this.log('   docker exec -it matchit-postgres-1 psql -U matchit -d matchit_db -c "\\dt"', 'info');
    this.log('', 'info');
    
    this.log('5️⃣ TESTAR SEM INTEGRAÇÃO:', 'warning');
    this.log('   Temporariamente comentar as 2 linhas de integração no server.js', 'info');
  }

  async runDiagnostic() {
    this.log('=' + '='.repeat(50), 'header');
    
    await this.checkServerLogs();
    await this.testBasicRegistration();
    await this.testMinimalRegistration();
    await this.testExistingEndpoints();
    await this.checkDatabaseTables();
    await this.suggestSolutions();
    
    this.log('=' + '='.repeat(50), 'header');
    this.log('🎯 PRÓXIMOS PASSOS:', 'header');
    this.log('1. Verificar logs: docker logs matchit-backend-1', 'info');
    this.log('2. Se houver erro SQL, executar migrations novamente', 'warning');
    this.log('3. Se necessário, reverter integração temporariamente', 'warning');
  }
}

async function main() {
  const diagnostic = new DiagnosticTester();
  await diagnostic.runDiagnostic();
}

main().catch(console.error);