// test/simple-integration-test.js
// Script simples para testar Sistema de Recomendação - SEM dependências externas

const http = require('http');
const https = require('https');

/**
 * Testes simples de integração usando apenas Node.js nativo
 */
class SimpleTestRunner {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = [];
    this.authToken = null;
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * Logger colorido
   */
  log(message, type = 'info') {
    const colors = {
      'info': '\x1b[36m',     // Cyan
      'success': '\x1b[32m',  // Green  
      'error': '\x1b[31m',    // Red
      'warning': '\x1b[33m',  // Yellow
      'header': '\x1b[35m'    // Magenta
    };
    
    const reset = '\x1b[0m';
    const timestamp = new Date().toISOString().substr(11, 8);
    const color = colors[type] || colors.info;
    
    console.log(`${color}[${timestamp}] ${message}${reset}`);
  }

  /**
   * Fazer requisição HTTP usando Node.js nativo
   */
  makeRequest(method, path, data = null, useAuth = false) {
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

      if (useAuth && this.authToken) {
        options.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

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
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: jsonData, status: res.statusCode });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${jsonData.error || responseData}`));
            }
          } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: responseData, status: res.statusCode });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Erro de rede: ${error.message}`));
      });

      // Timeout de 10 segundos
      req.setTimeout(10000, () => {
        req.abort();
        reject(new Error('Timeout - requisição demorou mais de 10 segundos'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Executar teste individual
   */
  async runTest(testName, testFunction) {
    this.testCount++;
    this.log(`🧪 Executando: ${testName}`, 'info');
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.passCount++;
      this.results.push({ name: testName, status: 'PASSED', duration, result });
      this.log(`✅ ${testName} - ${duration}ms - ${result}`, 'success');
      
      return result;
    } catch (error) {
      this.failCount++;
      this.results.push({ name: testName, status: 'FAILED', error: error.message });
      this.log(`❌ ${testName} - ${error.message}`, 'error');
      
      return null;
    }
  }

  /**
   * Teste 1: Health check do servidor
   */
  async testServerHealth() {
    const result = await this.makeRequest('GET', '/api/health');
    
    if (!result.data.status || result.data.status !== 'ok') {
      throw new Error('Status do servidor não é OK');
    }
    
    if (!result.data.database || result.data.database !== 'connected') {
      throw new Error('Banco de dados não conectado');
    }
    
    return 'Servidor funcionando';
  }

  /**
   * Teste 2: Informações da API
   */
  async testApiInfo() {
    const result = await this.makeRequest('GET', '/api/info');
    
    if (!result.data.name) {
      throw new Error('Nome da API não encontrado');
    }
    
    return `API: ${result.data.name}`;
  }

  /**
   * Teste 3: Criar usuário de teste
   */
  async testCreateUser() {
    const userData = {
      email: `test-${Date.now()}@matchit.com`,
      password: 'test123456',
      name: 'Test User',
      displayName: 'Test',
      city: 'São Paulo',
      gender: 'other',
      age: 25
    };

    const result = await this.makeRequest('POST', '/api/auth/register', userData);
    
    if (!result.data.token) {
      throw new Error('Token não retornado no registro');
    }
    
    this.authToken = result.data.token;
    
    return `Usuário criado: ${userData.email}`;
  }

  /**
   * Teste 4: Health check das recomendações (precisa de auth)
   */
  async testRecommendationHealth() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const result = await this.makeRequest('GET', '/api/recommendations/health', null, true);
    
    if (!result.data.status || result.data.status !== 'healthy') {
      throw new Error(`Status não é healthy: ${result.data.status}`);
    }
    
    return 'Recomendações saudáveis';
  }

  /**
   * Teste 5: Buscar recomendações
   */
  async testGetRecommendations() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const result = await this.makeRequest('GET', '/api/recommendations?limit=3', null, true);
    
    if (!result.data.success) {
      throw new Error(`Falha na busca: ${result.data.error}`);
    }
    
    const count = result.data.data?.recommendations?.length || 0;
    return `${count} recomendações encontradas`;
  }

  /**
   * Teste 6: Registrar feedback
   */
  async testFeedback() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const feedbackData = {
      targetUserId: '00000000-0000-4000-8000-000000000002',
      action: 'like',
      context: {
        viewTime: 3000,
        deviceType: 'mobile'
      }
    };

    const result = await this.makeRequest('POST', '/api/recommendations/feedback', feedbackData, true);
    
    if (!result.data.success) {
      throw new Error(`Falha no feedback: ${result.data.error}`);
    }
    
    return 'Feedback registrado';
  }

  /**
   * Teste 7: Estatísticas
   */
  async testStats() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const result = await this.makeRequest('GET', '/api/recommendations/stats', null, true);
    
    if (!result.data.success) {
      throw new Error(`Falha nas stats: ${result.data.error}`);
    }
    
    return 'Estatísticas obtidas';
  }

  /**
   * Teste 8: Validação (deve falhar com dados inválidos)
   */
  async testValidation() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const invalidData = {
      targetUserId: 'invalid-uuid',
      action: 'invalid-action'
    };

    try {
      await this.makeRequest('POST', '/api/recommendations/feedback', invalidData, true);
      throw new Error('Deveria ter rejeitado dados inválidos');
    } catch (error) {
      if (error.message.includes('400') || error.message.includes('Dados de entrada inválidos')) {
        return 'Validação funcionando';
      }
      throw error;
    }
  }

  /**
   * Executar todos os testes
   */
  async runAllTests() {
    this.log('🚀 TESTANDO INTEGRAÇÃO DO SISTEMA DE RECOMENDAÇÃO', 'header');
    this.log('='.repeat(60), 'header');

    const tests = [
      ['Health Check Servidor', () => this.testServerHealth()],
      ['Informações da API', () => this.testApiInfo()],
      ['Criar Usuário Teste', () => this.testCreateUser()],
      ['Health Check Recomendações', () => this.testRecommendationHealth()],
      ['Buscar Recomendações', () => this.testGetRecommendations()],
      ['Registrar Feedback', () => this.testFeedback()],
      ['Obter Estatísticas', () => this.testStats()],
      ['Validação de Dados', () => this.testValidation()]
    ];

    // Executar todos os testes
    for (const [name, testFn] of tests) {
      await this.runTest(name, testFn);
      
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.generateReport();
  }

  /**
   * Gerar relatório final
   */
  generateReport() {
    this.log('='.repeat(60), 'header');
    this.log('📊 RELATÓRIO FINAL', 'header');
    this.log('='.repeat(60), 'header');
    
    this.log(`Total: ${this.testCount} testes`, 'info');
    this.log(`Aprovados: ${this.passCount}`, 'success');
    this.log(`Falharam: ${this.failCount}`, this.failCount > 0 ? 'error' : 'success');
    
    const successRate = ((this.passCount / this.testCount) * 100).toFixed(1);
    this.log(`Taxa de sucesso: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    if (this.failCount > 0) {
      this.log('\n❌ TESTES QUE FALHARAM:', 'error');
      this.results
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'error');
        });
    }

    this.log('\n='.repeat(60), 'header');
    
    if (this.passCount === this.testCount) {
      this.log('🎉 TODOS OS TESTES PASSARAM!', 'success');
      this.log('✅ Sistema de Recomendação funcionando 100%', 'success');
      this.log('✅ Integração com server.js bem-sucedida', 'success');
      this.log('✅ APIs prontas para uso', 'success');
      this.log('✅ Fase 1.3 completamente finalizada!', 'success');
    } else if (successRate >= 75) {
      this.log('🟡 INTEGRAÇÃO MAJORITARIAMENTE FUNCIONAL', 'warning');
      this.log('💡 Alguns problemas menores, mas utilizável', 'warning');
    } else {
      this.log('🔴 PROBLEMAS SIGNIFICATIVOS ENCONTRADOS', 'error');
      this.log('❌ Revisar configuração antes de prosseguir', 'error');
    }

    this.log('\n🚀 Próximo passo: Fase 2 - Engine Avançado', 'info');
    this.log('='.repeat(60), 'header');
  }
}

/**
 * Executar testes
 */
async function main() {
  console.log('🧪 Iniciando testes simples...\n');
  
  const tester = new SimpleTestRunner();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(`💥 Erro fatal: ${error.message}`);
    process.exit(1);
  }
  
  process.exit(tester.failCount > 0 ? 1 : 0);
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  main();
}

module.exports = { SimpleTestRunner };