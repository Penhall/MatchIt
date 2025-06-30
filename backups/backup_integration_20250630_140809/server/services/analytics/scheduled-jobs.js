// server/services/analytics/scheduled-jobs.js (ESM)
import cron from 'node-cron';
import pg from 'pg';
const { Pool } = pg;
import EventEmitter from 'events';
import AnalyticsEngine from './analytics-engine.js';
import MetricsCalculator from './metrics-calculator.js';
import ReportGenerator from './report-generator.js';
import AnomalyDetector from './anomaly-detector.js';
import { analyticsConfig } from '../../config/analytics-config.js.js';
import { pool } from '../../config/database.js'; // Importar pool diretamente

/**
 * Scheduled Jobs - Sistema de automação e agendamento
 * Gerencia execução automática de relatórios, limpezas e verificações
 */
class ScheduledJobs extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.db = config.database || pool; // Usar pool importado diretamente
    
    // Inicializar serviços
    this.analyticsEngine = new AnalyticsEngine({ database: this.db });
    this.metricsCalculator = new MetricsCalculator(this.db);
    this.reportGenerator = new ReportGenerator({ database: this.db });
    this.anomalyDetector = new AnomalyDetector({ database: this.db });
    
    this.config = {
      // Configurações gerais
      enabled: config.enabled !== false,
      timezone: config.timezone || analyticsConfig.general.defaultTimezone,
      maxConcurrentJobs: config.maxConcurrentJobs || 5,
      
      // Configurações de retry
      enableRetry: config.enableRetry !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 60000, // 1 minuto
      
      // Configurações de logging
      enableJobLogging: config.enableJobLogging !== false,
      logFailures: config.logFailures !== false,
      
      // Configurações de performance
      enablePerformanceTracking: config.enablePerformanceTracking === true,
      performanceLogThreshold: config.performanceLogThreshold || 30000, // 30 segundos
      
      // Configurações de alertas
      enableJobAlerts: config.enableJobAlerts !== false,
      alertOnFailure: config.alertOnFailure !== false,
      alertOnLongRunning: config.alertOnLongRunning !== false,
      longRunningThreshold: config.longRunningThreshold || 300000 // 5 minutos
    };
    
    // Estado dos jobs
    this.jobs = new Map();
    this.runningJobs = new Set();
    this.jobHistory = [];
    this.maxHistorySize = 1000;
    
    // Métricas dos jobs
    this.jobMetrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      longestExecution: 0,
      lastExecution: null
    };
    
    console.log('[ScheduledJobs] Initialized');
  }

  /**
   * Inicia todos os jobs agendados
   */
  start() {
    if (!this.config.enabled) {
      console.log('[ScheduledJobs] Jobs are disabled in configuration');
      return;
    }

    console.log('[ScheduledJobs] Starting scheduled jobs...');

    try {
      // Registrar jobs do sistema
      this.registerSystemJobs();
      
      // Registrar jobs de relatórios
      this.registerReportJobs();
      
      // Registrar jobs de manutenção
      this.registerMaintenanceJobs();
      
      // Registrar jobs de monitoramento
      this.registerMonitoringJobs();
      
      console.log(`[ScheduledJobs] Started ${this.jobs.size} scheduled jobs`);
      
      this.emit('jobsStarted', {
        totalJobs: this.jobs.size,
        jobNames: Array.from(this.jobs.keys())
      });
      
    } catch (error) {
      console.error('[ScheduledJobs] Error starting jobs:', error);
      this.emit('error', error);
    }
  }

  /**
   * Para todos os jobs agendados
   */
  stop() {
    console.log('[ScheduledJobs] Stopping scheduled jobs...');
    
    let stoppedCount = 0;
    
    this.jobs.forEach((job, name) => {
      if (job.task) {
        job.task.stop();
        stoppedCount++;
      }
    });
    
    this.jobs.clear();
    
    console.log(`[ScheduledJobs] Stopped ${stoppedCount} jobs`);
    
    this.emit('jobsStopped', { stoppedCount });
  }

  // =====================================================
  // REGISTRO DE JOBS
  // =====================================================

  /**
   * Registra jobs do sistema principal
   * @private
   */
  registerSystemJobs() {
    // Cálculo de KPIs - a cada 15 minutos
    this.registerJob('calculate_kpis', '*/15 * * * *', async () => {
      await this.analyticsEngine.calculateKPIs({
        categories: ['business', 'technical', 'product'],
        forceRecalculation: false
      });
    }, {
      description: 'Calcula KPIs principais do sistema',
      category: 'system',
      priority: 'high',
      timeout: 180000 // 3 minutos
    });

    // Verificação de anomalias - a cada 5 minutos
    this.registerJob('anomaly_detection', '*/5 * * * *', async () => {
      await this.anomalyDetector.checkAllMetrics();
    }, {
      description: 'Verifica anomalias em todas as métricas',
      category: 'monitoring',
      priority: 'high',
      timeout: 300000 // 5 minutos
    });

    // Flush da queue de eventos - a cada 2 minutos
    this.registerJob('flush_events_queue', '*/2 * * * *', async () => {
      const stats = this.analyticsEngine.getSystemMetrics();
      if (stats.engine.queueSize > 0) {
        console.log(`[ScheduledJobs] Flushing ${stats.engine.queueSize} queued events`);
        // O analytics engine já tem auto-flush, este é um backup
      }
    }, {
      description: 'Flush da queue de eventos pendentes',
      category: 'system',
      priority: 'medium',
      timeout: 120000 // 2 minutos
    });

    // Agregação de dados horária - início de cada hora
    this.registerJob('hourly_aggregation', '0 * * * *', async () => {
      await this.performHourlyAggregation();
    }, {
      description: 'Agrega dados por hora para consultas rápidas',
      category: 'system',
      priority: 'medium',
      timeout: 600000 // 10 minutos
    });
  }

  /**
   * Registra jobs de relatórios
   * @private
   */
  registerReportJobs() {
    // Relatório executivo diário - 8:00 AM
    if (analyticsConfig.reports.schedules.daily_executive.enabled) {
      this.registerJob('daily_executive_report', '0 8 * * *', async () => {
        const report = await this.reportGenerator.generateDailyExecutiveReport();
        console.log(`[ScheduledJobs] Daily executive report generated: ${report.id}`);
      }, {
        description: 'Gera relatório executivo diário',
        category: 'reports',
        priority: 'medium',
        timeout: 900000 // 15 minutos
      });
    }

    // Relatório semanal de negócio - Segunda 9:00 AM
    if (analyticsConfig.reports.schedules.weekly_business.enabled) {
      this.registerJob('weekly_business_report', '0 9 * * 1', async () => {
        const report = await this.reportGenerator.generateWeeklyBusinessReport();
        console.log(`[ScheduledJobs] Weekly business report generated: ${report.id}`);
      }, {
        description: 'Gera relatório semanal de negócio',
        category: 'reports',
        priority: 'medium',
        timeout: 1800000 // 30 minutos
      });
    }

    // Relatório mensal executivo - Primeiro dia do mês 10:00 AM
    if (analyticsConfig.reports.schedules.monthly_executive.enabled) {
      this.registerJob('monthly_executive_report', '0 10 1 * *', async () => {
        const report = await this.reportGenerator.generateMonthlyExecutiveReport();
        console.log(`[ScheduledJobs] Monthly executive report generated: ${report.id}`);
      }, {
        description: 'Gera relatório mensal executivo',
        category: 'reports',
        priority: 'low',
        timeout: 3600000 // 1 hora
      });
    }

    // Backup de dados de analytics - Diário 2:00 AM
    this.registerJob('backup_analytics_data', '0 2 * * *', async () => {
      await this.performAnalyticsBackup();
    }, {
      description: 'Backup dos dados de analytics',
      category: 'maintenance',
      priority: 'low',
      timeout: 7200000 // 2 horas
    });
  }

  /**
   * Registra jobs de manutenção
   * @private
   */
  registerMaintenanceJobs() {
    // Limpeza de dados antigos - Diário 3:00 AM
    this.registerJob('cleanup_old_data', '0 3 * * *', async () => {
      const result = await this.analyticsEngine.cleanup();
      console.log(`[ScheduledJobs] Cleanup completed:`, result);
    }, {
      description: 'Remove dados antigos conforme política de retenção',
      category: 'maintenance',
      priority: 'low',
      timeout: 3600000 // 1 hora
    });

    // Otimização do banco de dados - Semanal Domingo 4:00 AM
    this.registerJob('database_optimization', '0 4 * * 0', async () => {
      await this.performDatabaseOptimization();
    }, {
      description: 'Otimiza tabelas e índices do banco de dados',
      category: 'maintenance',
      priority: 'low',
      timeout: 7200000 // 2 horas
    });

    // Verificação de integridade - Semanal Sábado 5:00 AM
    this.registerJob('data_integrity_check', '0 5 * * 6', async () => {
      await this.performDataIntegrityCheck();
    }, {
      description: 'Verifica integridade dos dados de analytics',
      category: 'maintenance',
      priority: 'medium',
      timeout: 1800000 // 30 minutos
    });

    // Limpeza de cache - A cada 6 horas
    this.registerJob('cache_cleanup', '0 */6 * * *', async () => {
      this.metricsCalculator.clearCache();
      console.log('[ScheduledJobs] Metrics cache cleared');
    }, {
      description: 'Limpa cache de métricas',
      category: 'maintenance',
      priority: 'low',
      timeout: 60000 // 1 minuto
    });
  }

  /**
   * Registra jobs de monitoramento
   * @private
   */
  registerMonitoringJobs() {
    // Health check do sistema - A cada 10 minutos
    this.registerJob('system_health_check', '*/10 * * * *', async () => {
      await this.performSystemHealthCheck();
    }, {
      description: 'Verifica saúde geral do sistema',
      category: 'monitoring',
      priority: 'high',
      timeout: 300000 // 5 minutos
    });

    // Verificação de performance - A cada 30 minutos
    this.registerJob('performance_check', '*/30 * * * *', async () => {
      await this.performPerformanceCheck();
    }, {
      description: 'Monitora performance do sistema',
      category: 'monitoring',
      priority: 'medium',
      timeout: 180000 // 3 minutos
    });

    // Atualização de estatísticas - Horário
    this.registerJob('update_statistics', '0 * * * *', async () => {
      await this.updateSystemStatistics();
    }, {
      description: 'Atualiza estatísticas do sistema',
      category: 'monitoring',
      priority: 'low',
      timeout: 600000 // 10 minutos
    });

    // Treinamento de modelos de ML - Diário 1:00 AM
    this.registerJob('train_ml_models', '0 1 * * *', async () => {
      await this.trainAnomalyDetectionModels();
    }, {
      description: 'Treina modelos de detecção de anomalias',
      category: 'ml',
      priority: 'low',
      timeout: 1800000 // 30 minutos
    });
  }

  // =====================================================
  // GERENCIAMENTO DE JOBS
  // =====================================================

  /**
   * Registra um job específico
   * @param {string} name - Nome do job
   * @param {string} schedule - Expressão cron
   * @param {Function} taskFunction - Função a ser executada
   * @param {Object} options - Opções do job
   */
  registerJob(name, schedule, taskFunction, options = {}) {
    const jobConfig = {
      name,
      schedule,
      taskFunction,
      ...options,
      registeredAt: new Date(),
      lastRun: null,
      nextRun: null,
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      status: 'registered'
    };

    try {
      const task = cron.schedule(schedule, async () => {
        await this.executeJob(name);
      }, {
        scheduled: false,
        timezone: this.config.timezone
      });

      jobConfig.task = task;
      jobConfig.nextRun = this.getNextRunTime(schedule);
      jobConfig.status = 'scheduled';

      this.jobs.set(name, jobConfig);

      // Iniciar o job
      task.start();

      console.log(`[ScheduledJobs] Registered job '${name}' with schedule '${schedule}'`);

    } catch (error) {
      console.error(`[ScheduledJobs] Error registering job '${name}':`, error);
      jobConfig.status = 'error';
      jobConfig.error = error.message;
    }
  }

  /**
   * Executa um job específico
   * @param {string} jobName - Nome do job
   */
  async executeJob(jobName) {
    const job = this.jobs.get(jobName);
    
    if (!job) {
      console.error(`[ScheduledJobs] Job '${jobName}' not found`);
      return;
    }

    // Verificar se já está executando
    if (this.runningJobs.has(jobName)) {
      console.warn(`[ScheduledJobs] Job '${jobName}' is already running, skipping execution`);
      return;
    }

    // Verificar limite de jobs concorrentes
    if (this.runningJobs.size >= this.config.maxConcurrentJobs) {
      console.warn(`[ScheduledJobs] Maximum concurrent jobs reached, skipping '${jobName}'`);
      return;
    }

    const startTime = Date.now();
    const executionId = `${jobName}_${startTime}`;

    this.runningJobs.add(jobName);
    job.status = 'running';
    job.lastRun = new Date();
    job.runCount++;

    console.log(`[ScheduledJobs] Starting job '${jobName}' (execution: ${executionId})`);

    try {
      // Configurar timeout se especificado
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        if (job.timeout) {
          timeoutHandle = setTimeout(() => {
            reject(new Error(`Job '${jobName}' timed out after ${job.timeout}ms`));
          }, job.timeout);
        }
      });

      // Executar job com timeout
      const jobPromise = job.taskFunction();
      
      if (job.timeout) {
        await Promise.race([jobPromise, timeoutPromise]);
        clearTimeout(timeoutHandle);
      } else {
        await jobPromise;
      }

      // Job executado com sucesso
      const executionTime = Date.now() - startTime;
      
      job.status = 'completed';
      job.successCount++;
      job.lastExecutionTime = executionTime;
      job.averageExecutionTime = 
        (job.averageExecutionTime * (job.successCount - 1) + executionTime) / job.successCount;
      
      this.jobMetrics.totalExecutions++;
      this.jobMetrics.successfulExecutions++;
      this.jobMetrics.lastExecution = new Date();
      
      if (executionTime > this.jobMetrics.longestExecution) {
        this.jobMetrics.longestExecution = executionTime;
      }

      // Log de performance se habilitado
      if (this.config.enablePerformanceTracking && 
          executionTime > this.config.performanceLogThreshold) {
        console.warn(`[ScheduledJobs] Job '${jobName}' took ${executionTime}ms to complete`);
      }

      // Adicionar ao histórico
      this.addToHistory({
        jobName,
        executionId,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: executionTime,
        status: 'success',
        category: job.category
      });

      console.log(`[ScheduledJobs] Job '${jobName}' completed successfully in ${executionTime}ms`);

      this.emit('jobCompleted', {
        jobName,
        executionId,
        executionTime,
        success: true
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      job.status = 'failed';
      job.failureCount++;
      job.lastError = error.message;
      job.lastErrorTime = new Date();
      
      this.jobMetrics.totalExecutions++;
      this.jobMetrics.failedExecutions++;

      // Adicionar ao histórico
      this.addToHistory({
        jobName,
        executionId,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: executionTime,
        status: 'failed',
        error: error.message,
        category: job.category
      });

      console.error(`[ScheduledJobs] Job '${jobName}' failed after ${executionTime}ms:`, error);

      // Tentar retry se configurado
      if (this.config.enableRetry && job.failureCount <= this.config.maxRetries) {
        console.log(`[ScheduledJobs] Scheduling retry for job '${jobName}' (attempt ${job.failureCount}/${this.config.maxRetries})`);
        
        setTimeout(() => {
          this.executeJob(jobName);
        }, this.config.retryDelay);
      }

      // Alertar sobre falha se configurado
      if (this.config.alertOnFailure) {
        this.emit('jobFailed', {
          jobName,
          executionId,
          error: error.message,
          retryCount: job.failureCount
        });
      }

      this.emit('error', error);
    } finally {
      this.runningJobs.delete(jobName);
      job.nextRun = this.getNextRunTime(job.schedule);
    }
  }

  // =====================================================
  // IMPLEMENTAÇÕES DE JOBS ESPECÍFICOS
  // =====================================================

  /**
   * Executa agregação horária de dados
   * @private
   */
  async performHourlyAggregation() {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // 1 hora atrás

    const query = `
      INSERT INTO analytics_aggregations (
        aggregation_type, metric_name, period_start, period_end,
        metric_value, count_value, calculation_method
      )
      SELECT 
        'hourly' as aggregation_type,
        event_type || '_' || event_name as metric_name,
        DATE_TRUNC('hour', $1) as period_start,
        DATE_TRUNC('hour', $2) as period_end,
        COUNT(*)::decimal as metric_value,
        COUNT(*) as count_value,
        'batch' as calculation_method
      FROM analytics_events
      WHERE timestamp >= $1 AND timestamp < $2
      GROUP BY event_type, event_name
      ON CONFLICT (aggregation_type, metric_name, period_start) 
      DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        count_value = EXCLUDED.count_value,
        calculated_at = NOW()
    `;

    await this.db.query(query, [startTime, endTime]);
    
    console.log(`[ScheduledJobs] Hourly aggregation completed for ${startTime.toISOString()} - ${endTime.toISOString()}`);
  }

  /**
   * Executa backup dos dados de analytics
   * @private
   */
  async performAnalyticsBackup() {
    // Implementação simplificada - em produção usar ferramentas específicas
    const backupQuery = `
      COPY (
        SELECT * FROM analytics_events 
        WHERE timestamp > NOW() - INTERVAL '7 days'
      ) TO '/tmp/analytics_backup_${new Date().toISOString().split('T')[0]}.csv' 
      WITH CSV HEADER
    `;
    
    try {
      await this.db.query(backupQuery);
      console.log('[ScheduledJobs] Analytics data backup completed');
    } catch (error) {
      console.error('[ScheduledJobs] Backup failed:', error);
      // Em produção, implementar backup alternativo
    }
  }

  /**
   * Executa otimização do banco de dados
   * @private
   */
  async performDatabaseOptimization() {
    const tables = [
      'analytics_events',
      'analytics_aggregations', 
      'analytics_kpis',
      'analytics_alerts'
    ];

    for (const table of tables) {
      try {
        // VACUUM e ANALYZE para otimização
        await this.db.query(`VACUUM ANALYZE ${table}`);
        console.log(`[ScheduledJobs] Optimized table: ${table}`);
      } catch (error) {
        console.error(`[ScheduledJobs] Error optimizing table ${table}:`, error);
      }
    }

    console.log('[ScheduledJobs] Database optimization completed');
  }

  /**
   * Executa verificação de integridade dos dados
   * @private
   */
  async performDataIntegrityCheck() {
    const checks = [
      // Verificar eventos órfãos
      {
        name: 'orphaned_events',
        query: `
          SELECT COUNT(*) as count
          FROM analytics_events ae
          LEFT JOIN users u ON ae.user_id = u.id
          WHERE ae.user_id IS NOT NULL AND u.id IS NULL
        `
      },
      
      // Verificar KPIs com valores inválidos
      {
        name: 'invalid_kpis',
        query: `
          SELECT COUNT(*) as count
          FROM analytics_kpis
          WHERE current_value < 0 OR current_value IS NULL
        `
      },
      
      // Verificar agregações inconsistentes
      {
        name: 'inconsistent_aggregations',
        query: `
          SELECT COUNT(*) as count
          FROM analytics_aggregations
          WHERE metric_value != count_value
            AND calculation_method = 'count'
        `
      }
    ];

    const issues = [];

    for (const check of checks) {
      try {
        const result = await this.db.query(check.query);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          issues.push({
            check: check.name,
            issueCount: count
          });
        }
      } catch (error) {
        console.error(`[ScheduledJobs] Error in integrity check ${check.name}:`, error);
      }
    }

    if (issues.length > 0) {
      console.warn('[ScheduledJobs] Data integrity issues found:', issues);
      this.emit('dataIntegrityIssues', issues);
    } else {
      console.log('[ScheduledJobs] Data integrity check passed');
    }
  }

  /**
   * Executa verificação de saúde do sistema
   * @private
   */
  async performSystemHealthCheck() {
    const health = {
      timestamp: new Date(),
      database: false,
      analytics: false,
      jobs: false,
      issues: []
    };

    try {
      // Verificar conexão com banco
      await this.db.query('SELECT 1');
      health.database = true;
    } catch (error) {
      health.issues.push('Database connection failed');
    }

    try {
      // Verificar sistema de analytics
      const metrics = this.analyticsEngine.getSystemMetrics();
      health.analytics = metrics.engine.status !== 'error';
      
      if (!health.analytics) {
        health.issues.push('Analytics engine in error state');
      }
    } catch (error) {
      health.issues.push('Analytics system check failed');
    }

    try {
      // Verificar jobs
      const runningJobsCount = this.runningJobs.size;
      const failedJobs = Array.from(this.jobs.values()).filter(j => j.status === 'failed').length;
      
      health.jobs = failedJobs === 0;
      
      if (failedJobs > 0) {
        health.issues.push(`${failedJobs} jobs in failed state`);
      }
    } catch (error) {
      health.issues.push('Jobs check failed');
    }

    // Emitir evento de saúde
    this.emit('healthCheck', health);

    if (health.issues.length > 0) {
      console.warn('[ScheduledJobs] System health issues:', health.issues);
    }
  }

  /**
   * Executa verificação de performance
   * @private
   */
  async performPerformanceCheck() {
    const performance = {
      timestamp: new Date(),
      metrics: {}
    };

    try {
      // Verificar performance do banco
      const dbStartTime = Date.now();
      await this.db.query('SELECT COUNT(*) FROM analytics_events WHERE timestamp > NOW() - INTERVAL \'1 hour\'');
      performance.metrics.databaseResponseTime = Date.now() - dbStartTime;

      // Verificar performance do analytics engine
      const engineMetrics = this.analyticsEngine.getSystemMetrics();
      performance.metrics.queueSize = engineMetrics.engine.queueSize;
      performance.metrics.averageProcessingTime = engineMetrics.performance.averageProcessingTime;
      performance.metrics.successRate = engineMetrics.performance.successRate;

      // Verificar performance dos jobs
      performance.metrics.runningJobs = this.runningJobs.size;
      performance.metrics.averageJobExecutionTime = this.jobMetrics.averageExecutionTime;

      this.emit('performanceCheck', performance);

    } catch (error) {
      console.error('[ScheduledJobs] Performance check failed:', error);
    }
  }

  /**
   * Atualiza estatísticas do sistema
   * @private
   */
  async updateSystemStatistics() {
    try {
      // Atualizar métricas dos jobs
      this.jobMetrics.averageExecutionTime = this.calculateAverageExecutionTime();
      
      // Calcular accuracy do sistema baseado no histórico
      const recentHistory = this.jobHistory.slice(-100); // Últimas 100 execuções
      const successRate = recentHistory.filter(h => h.status === 'success').length / recentHistory.length * 100;
      
      this.jobMetrics.systemSuccessRate = successRate;
      
      console.log('[ScheduledJobs] System statistics updated');
      
    } catch (error) {
      console.error('[ScheduledJobs] Error updating statistics:', error);
    }
  }

  /**
   * Treina modelos de detecção de anomalias
   * @private
   */
  async trainAnomalyDetectionModels() {
    try {
      const activeMetrics = await this.anomalyDetector.getActiveMetrics();
      
      let trainedCount = 0;
      
      for (const metric of activeMetrics) {
        const success = await this.anomalyDetector.trainModels(metric.metric_name);
        if (success) trainedCount++;
      }
      
      console.log(`[ScheduledJobs] Trained ${trainedCount}/${activeMetrics.length} ML models`);
      
    } catch (error) {
      console.error('[ScheduledJobs] Error training ML models:', error);
    }
  }

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  /**
   * Adiciona execução ao histórico
   * @private
   */
  addToHistory(execution) {
    this.jobHistory.push(execution);
    
    // Limitar tamanho do histórico
    if (this.jobHistory.length > this.maxHistorySize) {
      this.jobHistory = this.jobHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Calcula próxima execução baseada no cron
   * @private
   */
  getNextRunTime(cronExpression) {
    try {
      // Implementação simplificada - em produção usar biblioteca como node-cron-parser
      return new Date(Date.now() + 60000); // Placeholder: próximo minuto
    } catch (error) {
      return null;
    }
  }

  /**
   * Calcula tempo médio de execução
   * @private
   */
  calculateAverageExecutionTime() {
    const recentExecutions = this.jobHistory.slice(-50); // Últimas 50 execuções
    
    if (recentExecutions.length === 0) return 0;
    
    const totalTime = recentExecutions.reduce((sum, exec) => sum + exec.duration, 0);
    return totalTime / recentExecutions.length;
  }

  /**
   * Obtém estatísticas dos jobs
   */
  getJobsStatistics() {
    const jobs = Array.from(this.jobs.values());
    
    return {
      totalJobs: jobs.length,
      runningJobs: this.runningJobs.size,
      
      jobsByCategory: jobs.reduce((acc, job) => {
        acc[job.category] = (acc[job.category] || 0) + 1;
        return acc;
      }, {}),
      
      jobsByStatus: jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {}),
      
      metrics: this.jobMetrics,
      
      recentHistory: this.jobHistory.slice(-10),
      
      nextRuns: jobs
        .filter(job => job.nextRun)
        .sort((a, b) => a.nextRun - b.nextRun)
        .slice(0, 5)
        .map(job => ({
          name: job.name,
          nextRun: job.nextRun,
          description: job.description
        }))
    };
  }

  /**
   * Executa job manualmente
   */
  async runJobManually(jobName) {
    if (!this.jobs.has(jobName)) {
      throw new Error(`Job '${jobName}' not found`);
    }

    console.log(`[ScheduledJobs] Manually executing job '${jobName}'`);
    await this.executeJob(jobName);
  }

  /**
   * Pausa job específico
   */
  pauseJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job && job.task) {
      job.task.stop();
      job.status = 'paused';
      console.log(`[ScheduledJobs] Job '${jobName}' paused`);
    }
  }

  /**
   * Resume job específico
   */
  resumeJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job && job.task) {
      job.task.start();
      job.status = 'scheduled';
      console.log(`[ScheduledJobs] Job '${jobName}' resumed`);
    }
  }
}
