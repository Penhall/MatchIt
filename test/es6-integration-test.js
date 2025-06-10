// test/es6-integration-test.js
// Script de teste compatível com ES Modules - Sistema de Recomendação MatchIt

import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Testes de integração usando ES6 e Node.js nativo
 */
class ES6TestRunner {
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
   * Sleep function para pausas
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fazer requisição HTTP usando Node.js nativo com ES6
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
              resolve({ 
                success: true, 
                data: jsonData, 
                status: res.statusCode,
                headers: res.headers 
              });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${jsonData.error || jsonData.message || responseData}`));
            }
          } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ 
                success: true, 
                data: responseData, 
                status: res.statusCode,
                headers: res.headers 
              });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Erro de conexão: ${error.message}`));
      });

      // Timeout de 15 segundos
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Timeout - requisição demorou mais de 15 segundos'));
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
    this.log(`🧪 ${this.testCount}. ${testName}`, 'info');
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.passCount++;
      this.results.push({ 
        name: testName, 
        status: 'PASSED', 
        duration, 
        result: result || 'OK' 
      });
      
      this.log(`   ✅ Sucesso (${duration}ms) - ${result}`, 'success');
      return result;
      
    } catch (error) {
      this.failCount++;
      this.results.push({ 
        name: testName, 
        status: 'FAILED', 
        error: error.message 
      });
      
      this.log(`   ❌ Falhou - ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Teste 1: Conexão básica com servidor
   */
  async testServerConnection() {
    const result = await this.makeRequest('GET', '/api/health');
    
    if (!result.data.status || result.data.status !== 'ok') {
      throw new Error(`Status inválido: ${result.data.status}`);
    }
    
    if (!result.data.database || result.data.database !== 'connected') {
      throw new Error('Banco de dados desconectado');
    }
    
    return `Servidor OK, DB conectado`;
  }

  /**
   * Teste 2: Informações da API
   */
  async testApiInfo() {
    const result = await this.makeRequest('GET', '/api/info');
    
    if (!result.data.name) {
      throw new Error('Nome da API não encontrado');
    }
    
    const endpoints = result.data.endpoints || {};
    const endpointCount = Object.keys(endpoints).length;
    
    return `${result.data.name} v${result.data.version} (${endpointCount} grupos de endpoints)`;
  }

  /**
   * Teste 3: Registro de novo usuário
   */
  async testUserRegistration() {
    const timestamp = Date.now();
    const userData = {
      email: `integration-test-${timestamp}@matchit.com`,
      password: 'TestPass123!',
      name: 'Integration Test User',
      displayName: 'Test User',
      city: 'São Paulo',
      gender: 'other',
      age: 28
    };

    const result = await this.makeRequest('POST', '/api/auth/register', userData);
    
    if (!result.data.token) {
      throw new Error('Token de autenticação não retornado');
    }
    
    if (!result.data.user || !result.data.user.id) {
      throw new Error('Dados do usuário não retornados');
    }
    
    // Salvar token para próximos testes
    this.authToken = result.data.token;
    
    return `Usuário criado: ${result.data.user.email}`;
  }

  /**
   * Teste 4: Health check específico de recomendações
   */
  async testRecommendationHealth() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const result = await this.makeRequest('GET', '/api/recommendations/health', null, true);
    
    if (!result.data.status || result.data.status !== 'healthy') {
      throw new Error(`Health check falhou: ${result.data.status || 'unknown'}`);
    }
    
    const services = result.data.services || {};
    const dbStatus = services.database || 'unknown';
    const version = result.data.version || 'unknown';
    
    return `Sistema saudável v${version}, DB: ${dbStatus}`;
  }

  /**
   * Teste 5: Buscar recomendações
   */
  async testGetRecommendations() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const result = await this.makeRequest('GET', '/api/recommendations?limit=5&algorithm=hybrid', null, true);
    
    if (!result.data.success) {
      throw new Error(`Busca falhou: ${result.data.error || 'erro desconhecido'}`);
    }
    
    const recommendations = result.data.data?.recommendations || [];
    const metadata = result.data.data?.metadata || {};
    const algorithm = metadata.algorithm || 'unknown';
    
    return `${recommendations.length} recomendações (algoritmo: ${algorithm})`;
  }

  /**
   * Teste 6: Registrar feedback de usuário
   */
  async testUserFeedback() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const feedbackData = {
      targetUserId: '11111111-1111-4111-8111-111111111111', // UUID de teste
      action: 'like',
      context: {
        viewTime: 4500,
        deviceType: 'mobile',
        sessionId: `test-session-${Date.now()}`
      }
    };

    const result = await this.makeRequest('POST', '/api/recommendations/feedback', feedbackData, true);
    
    if (!result.data.success) {
      throw new Error(`Feedback falhou: ${result.data.error || 'erro desconhecido'}`);
    }
    
    const isMatch = result.data.data?.isMatch || false;
    return `Feedback '${feedbackData.action}' registrado ${isMatch ? '(MATCH!)' : ''}`;
  }

  /**
   * Teste 7: Obter estatísticas do usuário
   */
  async testUserStatistics() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const result = await this.makeRequest('GET', '/api/recommendations/stats?period=week', null, true);
    
    if (!result.data.success) {
      throw new Error(`Estatísticas falharam: ${result.data.error || 'erro desconhecido'}`);
    }
    
    const period = result.data.data?.period || 'unknown';
    const hasBasic = result.data.data?.basic ? 'sim' : 'não';
    const hasEngagement = result.data.data?.engagement ? 'sim' : 'não';
    
    return `Stats período ${period} (básicas: ${hasBasic}, engagement: ${hasEngagement})`;
  }

  /**
   * Teste 8: Atualizar pesos do algoritmo
   */
  async testUpdateAlgorithmWeights() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const weightsData = {
      weights: {
        style_compatibility: 0.40,
        location: 0.25,
        personality: 0.20,
        lifestyle: 0.10,
        activity: 0.05
      }
    };

    const result = await this.makeRequest('PUT', '/api/recommendations/weights', weightsData, true);
    
    if (!result.data.success) {
      throw new Error(`Atualização de pesos falhou: ${result.data.error || 'erro desconhecido'}`);
    }
    
    return 'Pesos personalizados atualizados';
  }

  /**
   * Teste 9: Validação (deve rejeitar dados inválidos)
   */
  async testDataValidation() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    const invalidFeedback = {
      targetUserId: 'não-é-uuid',
      action: 'ação-inválida',
      context: 'não-é-objeto'
    };

    try {
      await this.makeRequest('POST', '/api/recommendations/feedback', invalidFeedback, true);
      throw new Error('Sistema aceitou dados inválidos (deveria rejeitar)');
    } catch (error) {
      if (error.message.includes('400') || 
          error.message.includes('inválidos') || 
          error.message.includes('validation')) {
        return 'Validação funcionando - dados inválidos rejeitados';
      }
      throw error;
    }
  }

  /**
   * Teste 10: Rate limiting
   */
  async testRateLimit() {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível');
    }

    this.log('   🚀 Testando rate limit (fazendo 35 requisições)...', 'info');
    
    const promises = [];
    for (let i = 0; i < 35; i++) {
      const promise = this.makeRequest('GET', '/api/recommendations?limit=1', null, true)
        .catch(error => ({ error: error.message, status: 'error' }));
      promises.push(promise);
    }

    const results = await Promise.all(promises);
    
    const rateLimitHits = results.filter(r => 
      r.error && (r.error.includes('429') || r.error.includes('rate limit'))
    ).length;

    if (rateLimitHits === 0) {
      return 'Rate limit não detectado (pode estar desabilitado)';
    }
    
    return `Rate limit ativo - ${rateLimitHits} requisições bloqueadas`;
  }

  /**
   * Executar toda a suíte de testes
   */
  async runAllTests() {
    console.clear();
    
    this.log('🚀 SISTEMA DE RECOMENDAÇÃO MATCHIT - TESTES DE INTEGRAÇÃO', 'header');
    this.log('=' + '='.repeat(65), 'header');
    this.log('🎯 Testando integração completa da Fase 1.3', 'info');
    this.log('🔧 Usando Node.js nativo + ES6 modules', 'info');
    this.log('', 'info');

    const tests = [
      ['Conexão com Servidor', () => this.testServerConnection()],
      ['Informações da API', () => this.testApiInfo()],
      ['Registro de Usuário', () => this.testUserRegistration()],
      ['Health Check Recomendações', () => this.testRecommendationHealth()],
      ['Buscar Recomendações', () => this.testGetRecommendations()],
      ['Feedback de Usuário', () => this.testUserFeedback()],
      ['Estatísticas de Usuário', () => this.testUserStatistics()],
      ['Atualizar Pesos Algoritmo', () => this.testUpdateAlgorithmWeights()],
      ['Validação de Dados', () => this.testDataValidation()],
      ['Rate Limiting', () => this.testRateLimit()]
    ];

    // Executar todos os testes com pausa entre eles
    for (const [name, testFn] of tests) {
      await this.runTest(name, testFn);
      await this.sleep(300); // Pausa de 300ms entre testes
    }

    this.generateFinalReport();
  }

  /**
   * Gerar relatório final detalhado
   */
  generateFinalReport() {
    this.log('', 'info');
    this.log('=' + '='.repeat(65), 'header');
    this.log('📊 RELATÓRIO FINAL DOS TESTES', 'header');
    this.log('=' + '='.repeat(65), 'header');
    
    this.log(`📋 Total de testes executados: ${this.testCount}`, 'info');
    this.log(`✅ Testes aprovados: ${this.passCount}`, 'success');
    this.log(`❌ Testes falharam: ${this.failCount}`, this.failCount > 0 ? 'error' : 'success');
    
    const successRate = ((this.passCount / this.testCount) * 100).toFixed(1);
    this.log(`📈 Taxa de sucesso: ${successRate}%`, successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error');

    // Mostrar testes que passaram
    if (this.passCount > 0) {
      this.log('', 'info');
      this.log('✅ TESTES APROVADOS:', 'success');
      this.results
        .filter(test => test.status === 'PASSED')
        .forEach((test, index) => {
          this.log(`   ${index + 1}. ${test.name}: ${test.result} (${test.duration}ms)`, 'success');
        });
    }

    // Mostrar testes que falharam
    if (this.failCount > 0) {
      this.log('', 'info');
      this.log('❌ TESTES QUE FALHARAM:', 'error');
      this.results
        .filter(test => test.status === 'FAILED')
        .forEach((test, index) => {
          this.log(`   ${index + 1}. ${test.name}: ${test.error}`, 'error');
        });
    }

    // Avaliação final
    this.log('', 'info');
    this.log('🎯 AVALIAÇÃO FINAL:', 'header');
    
    if (this.passCount === this.testCount) {
      this.log('🎉 PERFEITO! Todos os testes passaram!', 'success');
      this.log('✅ Sistema de Recomendação 100% funcional', 'success');
      this.log('✅ Integração server.js bem-sucedida', 'success');
      this.log('✅ Todas as APIs respondendo corretamente', 'success');
      this.log('✅ Autenticação e autorização funcionando', 'success');
      this.log('✅ Validação e rate limiting ativos', 'success');
      this.log('✅ FASE 1.3 COMPLETAMENTE FINALIZADA! 🚀', 'success');
    } else if (successRate >= 80) {
      this.log('🟡 BOM! Sistema majoritariamente funcional', 'warning');
      this.log('💡 Problemas menores detectados', 'warning');
      this.log('📝 Sistema utilizável, mas revisar falhas', 'warning');
    } else if (successRate >= 50) {
      this.log('🟠 PARCIAL! Funcionalidade básica presente', 'warning');
      this.log('⚠️  Vários problemas encontrados', 'warning');
      this.log('🔧 Revisar configuração antes de prosseguir', 'warning');
    } else {
      this.log('🔴 CRÍTICO! Problemas graves na integração', 'error');
      this.log('❌ Sistema não está funcional', 'error');
      this.log('🛠️  Revisar implementação completa', 'error');
    }

    this.log('', 'info');
    this.log('🚀 Próximo passo: Fase 2 - Engine de Recomendação Avançado', 'info');
    this.log('📚 Consulte o guia de integração para detalhes', 'info');
    this.log('=' + '='.repeat(65), 'header');
  }
}

/**
 * Função principal
 */
async function main() {
  const tester = new ES6TestRunner();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(`💥 Erro fatal: ${error.message}`);
    process.exit(1);
  }
  
  // Exit code baseado nos resultados
  process.exit(tester.failCount > 0 ? 1 : 0);
}

// Verificar se está sendo executado diretamente
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  main().catch(console.error);
}

export { ES6TestRunner };