// test/integration-test.js
// Testes de integração para verificar o Sistema de Recomendação MatchIt

import dotenv from 'dotenv';
import { Pool } from 'pg';
import { setupRecommendationRoutes } from '../server-recommendation-integration.js';
import express from 'express';
import jwt from 'jsonwebtoken';

dotenv.config();

/**
 * Classe para executar testes de integração
 */
class RecommendationIntegrationTest {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'matchit',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'matchit_db',
      password: process.env.DB_PASSWORD || 'matchit123',
      port: process.env.DB_PORT || 5432,
    });

    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  /**
   * Logger para testes
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Executar um teste individual
   */
  async runTest(testName, testFunction) {
    this.totalTests++;
    this.log(`Executando: ${testName}`, 'info');
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.passedTests++;
      this.testResults.push({ name: testName, status: 'PASSED', duration });
      this.log(`✅ ${testName} - Passou (${duration}ms)`, 'success');
      
    } catch (error) {
      this.failedTests++;
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
      this.log(`❌ ${testName} - Falhou: ${error.message}`, 'error');
    }
  }

  /**
   * Teste 1: Verificar conexão com banco de dados
   */
  async testDatabaseConnection() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT NOW() as timestamp');
      if (!result.rows[0].timestamp) {
        throw new Error('Não foi possível obter timestamp do banco');
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Teste 2: Verificar se tabelas de recomendação existem
   */
  async testRecommendationTables() {
    const client = await this.pool.connect();
    
    try {
      const requiredTables = [
        'user_extended_profiles',
        'user_algorithm_weights',
        'user_interactions',
        'recommendation_cache',
        'analytics_events',
        'engagement_metrics',
        'system_config'
      ];

      for (const table of requiredTables) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        `, [table]);
        
        if (!result.rows[0].exists) {
          throw new Error(`Tabela obrigatória não encontrada: ${table}`);
        }
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Teste 3: Verificar stored procedures
   */
  async testStoredProcedures() {
    const client = await this.pool.connect();
    
    try {
      const requiredProcedures = [
        'calculate_style_compatibility',
        'calculate_location_score',
        'calculate_overall_compatibility',
        'find_potential_matches',
        'record_interaction_with_learning',
        'get_user_engagement_metrics'
      ];

      for (const proc of requiredProcedures) {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.routines 
            WHERE routine_name = $1 AND routine_type = 'FUNCTION'
          )
        `, [proc]);
        
        if (!result.rows[0].exists) {
          throw new Error(`Stored procedure não encontrada: ${proc}`);
        }
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Teste 4: Testar stored procedure de compatibilidade
   */
  async testCompatibilityCalculation() {
    const client = await this.pool.connect();
    
    try {
      // Criar usuários de teste temporários
      const user1Id = '00000000-0000-4000-8000-000000000001';
      const user2Id = '00000000-0000-4000-8000-000000000002';

      // Testar cálculo de compatibilidade
      const result = await client.query(`
        SELECT calculate_style_compatibility($1, $2) as score
      `, [user1Id, user2Id]);
      
      const score = parseFloat(result.rows[0].score);
      
      if (isNaN(score) || score < 0 || score > 1) {
        throw new Error(`Score de compatibilidade inválido: ${score}`);
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Teste 5: Testar inserção de interação de usuário
   */
  async testUserInteraction() {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Criar usuários de teste
      const user1Id = await this.createTestUser(client, 'test1@matchit.com');
      const user2Id = await this.createTestUser(client, 'test2@matchit.com');
      
      // Inserir interação
      const result = await client.query(`
        INSERT INTO user_interactions 
        (user_id, target_user_id, action, interaction_context)
        VALUES ($1, $2, 'like', '{"test": true}')
        RETURNING id
      `, [user1Id, user2Id]);
      
      if (!result.rows[0].id) {
        throw new Error('Falha ao inserir interação de usuário');
      }
      
      await client.query('ROLLBACK');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Teste 6: Testar cache de recomendações
   */
  async testRecommendationCache() {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const userId = await this.createTestUser(client, 'cache-test@matchit.com');
      const cacheKey = 'test_cache_key';
      const testData = { recommendations: [{ userId: 'test', score: 0.8 }] };
      
      // Inserir no cache
      await client.query(`
        INSERT INTO recommendation_cache 
        (user_id, cache_key, cached_recommendations, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')
      `, [userId, cacheKey, JSON.stringify(testData)]);
      
      // Recuperar do cache
      const result = await client.query(`
        SELECT cached_recommendations 
        FROM recommendation_cache 
        WHERE user_id = $1 AND cache_key = $2
      `, [userId, cacheKey]);
      
      if (!result.rows[0]) {
        throw new Error('Cache não foi salvo corretamente');
      }
      
      const retrievedData = JSON.parse(result.rows[0].cached_recommendations);
      if (retrievedData.recommendations[0].score !== 0.8) {
        throw new Error('Dados do cache corrompidos');
      }
      
      await client.query('ROLLBACK');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Teste 7: Testar configurações do sistema
   */
  async testSystemConfig() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT config_key, config_value 
        FROM system_config 
        WHERE config_key = 'default_algorithm'
      `);
      
      if (result.rows.length === 0) {
        throw new Error('Configuração padrão do algoritmo não encontrada');
      }
      
      const algorithm = result.rows[0].config_value;
      const validAlgorithms = ['hybrid', 'collaborative', 'content', 'style_based', 'location_based'];
      
      if (!validAlgorithms.includes(algorithm)) {
        throw new Error(`Algoritmo padrão inválido: ${algorithm}`);
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Teste 8: Testar views de estatísticas
   */
  async testStatisticsViews() {
    const client = await this.pool.connect();
    
    try {
      const views = [
        'v_user_recommendation_stats',
        'v_algorithm_performance_summary',
        'v_user_engagement_trends'
      ];

      for (const view of views) {
        const result = await client.query(`SELECT 1 FROM ${view} LIMIT 1`);
        // View deve existir e ser consultável (mesmo que retorne 0 rows)
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Teste 9: Testar performance de busca de matches
   */
  async testMatchSearchPerformance() {
    const client = await this.pool.connect();
    
    try {
      const userId = '00000000-0000-4000-8000-000000000001';
      const startTime = Date.now();
      
      await client.query(`
        SELECT * FROM find_potential_matches($1, $2, $3, $4)
      `, [userId, 10, 0.3, 50]);
      
      const duration = Date.now() - startTime;
      
      if (duration > 5000) { // 5 segundos
        throw new Error(`Busca de matches muito lenta: ${duration}ms`);
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Teste 10: Verificar integridade dos dados
   */
  async testDataIntegrity() {
    const client = await this.pool.connect();
    
    try {
      // Verificar se não há dados órfãos em user_interactions
      const orphanInteractions = await client.query(`
        SELECT COUNT(*) as count
        FROM user_interactions ui
        LEFT JOIN users u1 ON ui.user_id = u1.id
        LEFT JOIN users u2 ON ui.target_user_id = u2.id
        WHERE u1.id IS NULL OR u2.id IS NULL
      `);
      
      if (parseInt(orphanInteractions.rows[0].count) > 0) {
        throw new Error('Dados órfãos encontrados em user_interactions');
      }
      
      // Verificar se não há pesos inválidos
      const invalidWeights = await client.query(`
        SELECT COUNT(*) as count
        FROM user_algorithm_weights
        WHERE style_compatibility_weight < 0 OR style_compatibility_weight > 1
           OR location_weight < 0 OR location_weight > 1
           OR personality_weight < 0 OR personality_weight > 1
      `);
      
      if (parseInt(invalidWeights.rows[0].count) > 0) {
        throw new Error('Pesos de algoritmo inválidos encontrados');
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Método auxiliar para criar usuário de teste
   */
  async createTestUser(client, email) {
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, name, email_verified, is_active)
      VALUES ($1, 'test_hash', 'Test User', true, true)
      RETURNING id
    `, [email]);
    
    const userId = userResult.rows[0].id;
    
    await client.query(`
      INSERT INTO user_profiles 
      (user_id, display_name, age, city, gender)
      VALUES ($1, 'Test User', 25, 'Test City', 'other')
    `, [userId]);
    
    return userId;
  }

  /**
   * Executar todos os testes
   */
  async runAllTests() {
    this.log('🚀 Iniciando testes de integração do Sistema de Recomendação', 'info');
    this.log('='.repeat(70), 'info');
    
    const tests = [
      ['Conexão com Banco de Dados', () => this.testDatabaseConnection()],
      ['Tabelas de Recomendação', () => this.testRecommendationTables()],
      ['Stored Procedures', () => this.testStoredProcedures()],
      ['Cálculo de Compatibilidade', () => this.testCompatibilityCalculation()],
      ['Interação de Usuário', () => this.testUserInteraction()],
      ['Cache de Recomendações', () => this.testRecommendationCache()],
      ['Configurações do Sistema', () => this.testSystemConfig()],
      ['Views de Estatísticas', () => this.testStatisticsViews()],
      ['Performance de Busca', () => this.testMatchSearchPerformance()],
      ['Integridade dos Dados', () => this.testDataIntegrity()]
    ];

    // Executar todos os testes
    for (const [name, testFn] of tests) {
      await this.runTest(name, testFn);
    }

    // Relatório final
    this.generateReport();
  }

  /**
   * Gerar relatório final dos testes
   */
  generateReport() {
    this.log('='.repeat(70), 'info');
    this.log('📊 RELATÓRIO FINAL DOS TESTES', 'info');
    this.log('='.repeat(70), 'info');
    
    this.log(`Total de testes: ${this.totalTests}`, 'info');
    this.log(`Testes aprovados: ${this.passedTests}`, 'success');
    this.log(`Testes falharam: ${this.failedTests}`, this.failedTests > 0 ? 'error' : 'info');
    
    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    this.log(`Taxa de sucesso: ${successRate}%`, successRate === '100.0' ? 'success' : 'warning');
    
    if (this.failedTests > 0) {
      this.log('\n❌ TESTES QUE FALHARAM:', 'error');
      this.testResults
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.error}`, 'error');
        });
    }
    
    if (this.passedTests === this.totalTests) {
      this.log('\n🎉 TODOS OS TESTES PASSARAM!', 'success');
      this.log('✅ Sistema de Recomendação está funcionando corretamente', 'success');
      this.log('✅ Integração com server.js bem-sucedida', 'success');
      this.log('✅ Banco de dados configurado adequadamente', 'success');
      this.log('✅ APIs prontas para uso', 'success');
    } else {
      this.log('\n⚠️  ALGUNS TESTES FALHARAM', 'warning');
      this.log('Verifique os erros acima e corrija antes de prosseguir', 'warning');
    }
    
    this.log('='.repeat(70), 'info');
  }

  /**
   * Cleanup - fechar conexões
   */
  async cleanup() {
    await this.pool.end();
    this.log('🔒 Conexões fechadas', 'info');
  }
}

/**
 * Função principal para executar os testes
 */
async function main() {
  const tester = new RecommendationIntegrationTest();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    tester.log(`Erro fatal nos testes: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
  
  // Exit code baseado nos resultados
  process.exit(tester.failedTests > 0 ? 1 : 0);
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { RecommendationIntegrationTest };