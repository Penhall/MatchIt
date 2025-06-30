// server/services/analytics/anomaly-detector.js (ESM)
import pg from 'pg';
const { Pool } = pg;
import EventEmitter from 'events';

/**
 * Anomaly Detector - Sistema de detecção de anomalias
 * Detecta padrões anômalos em métricas e gera alertas automáticos
 */
class AnomalyDetector extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.db = config.database || new Pool();
    
    this.config = {
      // Configurações de detecção
      enableStatisticalDetection: config.enableStatisticalDetection !== false,
      enableTrendDetection: config.enableTrendDetection !== false,
      enableSeasonalDetection: config.enableSeasonalDetection !== false,
      enableThresholdDetection: config.enableThresholdDetection !== false,
      
      // Parâmetros estatísticos
      zScoreThreshold: config.zScoreThreshold || 2.5, // Desvios padrão
      percentileThreshold: config.percentileThreshold || 95, // 95º percentil
      movingAverageWindow: config.movingAverageWindow || 7, // 7 dias
      seasonalWindow: config.seasonalWindow || 30, // 30 dias
      
      // Configurações de sensibilidade
      sensitivity: config.sensitivity || 'medium', // low, medium, high
      minDataPoints: config.minDataPoints || 10,
      confidenceInterval: config.confidenceInterval || 0.95,
      
      // Configurações de alertas
      enableAutoAlerts: config.enableAutoAlerts !== false,
      alertCooldown: config.alertCooldown || 30 * 60 * 1000, // 30 minutos
      
      // Configurações de machine learning
      enableMLDetection: config.enableMLDetection === true,
      learningWindow: config.learningWindow || 90 // 90 dias de dados históricos
    };
    
    // Cache de modelos e padrões
    this.models = new Map();
    this.patterns = new Map();
    this.alertHistory = new Map();
    
    // Métricas de performance do detector
    this.detectorMetrics = {
      totalChecks: 0,
      anomaliesDetected: 0,
      falsePositives: 0,
      accuracy: 0,
      lastCheck: null
    };
    
    console.log('[AnomalyDetector] Initialized with sensitivity:', this.config.sensitivity);
  }

  // =====================================================
  // DETECÇÃO PRINCIPAL
  // =====================================================

  /**
   * Detecta anomalias em uma métrica específica
   * @param {string} metricName - Nome da métrica
   * @param {number} currentValue - Valor atual
   * @param {Object} options - Opções de detecção
   * @returns {Promise<Object>} Resultado da detecção
   */
  async detectAnomalies(metricName, currentValue, options = {}) {
    const startTime = Date.now();
    
    try {
      this.detectorMetrics.totalChecks++;
      this.detectorMetrics.lastCheck = new Date();
      
      console.log(`[AnomalyDetector] Checking anomalies for ${metricName}: ${currentValue}`);
      
      // Obter dados históricos
      const historicalData = await this.getHistoricalData(metricName, options);
      
      if (historicalData.length < this.config.minDataPoints) {
        return {
          isAnomaly: false,
          reason: 'insufficient_data',
          confidence: 0,
          dataPoints: historicalData.length,
          minRequired: this.config.minDataPoints
        };
      }
      
      // Executar diferentes tipos de detecção
      const detectionResults = await Promise.all([
        this.detectStatisticalAnomalies(metricName, currentValue, historicalData, options),
        this.detectTrendAnomalies(metricName, currentValue, historicalData, options),
        this.detectSeasonalAnomalies(metricName, currentValue, historicalData, options),
        this.detectThresholdAnomalies(metricName, currentValue, options)
      ].filter((_, index) => [
        this.config.enableStatisticalDetection,
        this.config.enableTrendDetection,
        this.config.enableSeasonalDetection,
        this.config.enableThresholdDetection
      ][index]));
      
      // Combinar resultados
      const combinedResult = this.combineDetectionResults(detectionResults);
      
      // Aplicar machine learning se habilitado
      if (this.config.enableMLDetection) {
        const mlResult = await this.detectMLAnomalies(metricName, currentValue, historicalData);
        combinedResult.mlScore = mlResult.anomalyScore;
        combinedResult.confidence = Math.max(combinedResult.confidence, mlResult.confidence);
      }
      
      // Verificar cooldown de alertas
      if (combinedResult.isAnomaly) {
        const shouldAlert = this.shouldTriggerAlert(metricName, combinedResult);
        combinedResult.shouldAlert = shouldAlert;
        
        if (shouldAlert) {
          this.detectorMetrics.anomaliesDetected++;
          await this.triggerAnomalyAlert(metricName, currentValue, combinedResult);
        }
      }
      
      // Adicionar metadados
      combinedResult.metricName = metricName;
      combinedResult.currentValue = currentValue;
      combinedResult.timestamp = new Date();
      combinedResult.processingTime = Date.now() - startTime;
      combinedResult.historicalDataPoints = historicalData.length;
      
      // Emitir evento
      this.emit('anomalyCheck', combinedResult);
      
      if (combinedResult.isAnomaly) {
        this.emit('anomalyDetected', combinedResult);
      }
      
      return combinedResult;
      
    } catch (error) {
      console.error('[AnomalyDetector] Error detecting anomalies:', error);
      this.emit('error', error);
      
      return {
        isAnomaly: false,
        error: error.message,
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Executa verificação de anomalias para todas as métricas ativas
   * @returns {Promise<Array>} Resultados de todas as verificações
   */
  async checkAllMetrics() {
    try {
      console.log('[AnomalyDetector] Checking all active metrics for anomalies');
      
      // Obter métricas ativas
      const activeMetrics = await this.getActiveMetrics();
      
      const results = [];
      
      for (const metric of activeMetrics) {
        try {
          // Obter valor atual da métrica
          const currentValue = await this.getCurrentMetricValue(metric.metric_name);
          
          if (currentValue !== null) {
            const result = await this.detectAnomalies(metric.metric_name, currentValue, {
              metricConfig: metric
            });
            
            results.push(result);
          }
          
        } catch (error) {
          console.error(`[AnomalyDetector] Error checking metric ${metric.metric_name}:`, error);
          
          results.push({
            metricName: metric.metric_name,
            isAnomaly: false,
            error: error.message,
            confidence: 0
          });
        }
      }
      
      // Estatísticas da execução
      const anomaliesFound = results.filter(r => r.isAnomaly).length;
      
      console.log(`[AnomalyDetector] Checked ${results.length} metrics, found ${anomaliesFound} anomalies`);
      
      this.emit('batchCheckCompleted', {
        totalChecked: results.length,
        anomaliesFound,
        results
      });
      
      return results;
      
    } catch (error) {
      console.error('[AnomalyDetector] Error in batch anomaly check:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE DETECÇÃO ESPECÍFICOS
  // =====================================================

  /**
   * Detecção estatística baseada em Z-Score e percentis
   * @private
   */
  async detectStatisticalAnomalies(metricName, currentValue, historicalData, options) {
    try {
      const values = historicalData.map(d => d.value);
      
      // Calcular estatísticas básicas
      const mean = this.calculateMean(values);
      const stdDev = this.calculateStandardDeviation(values, mean);
      const zScore = Math.abs((currentValue - mean) / stdDev);
      
      // Calcular percentis
      const sortedValues = [...values].sort((a, b) => a - b);
      const percentile95 = this.calculatePercentile(sortedValues, 0.95);
      const percentile5 = this.calculatePercentile(sortedValues, 0.05);
      
      // Determinar se é anomalia
      const isZScoreAnomaly = zScore > this.config.zScoreThreshold;
      const isPercentileAnomaly = currentValue > percentile95 || currentValue < percentile5;
      
      const isAnomaly = isZScoreAnomaly || isPercentileAnomaly;
      
      return {
        type: 'statistical',
        isAnomaly,
        confidence: isAnomaly ? Math.min(zScore / this.config.zScoreThreshold, 1) : 0,
        details: {
          zScore: zScore.toFixed(3),
          mean: mean.toFixed(3),
          stdDev: stdDev.toFixed(3),
          percentile95: percentile95.toFixed(3),
          percentile5: percentile5.toFixed(3),
          threshold: this.config.zScoreThreshold
        },
        reason: isZScoreAnomaly ? 'z_score_threshold' : isPercentileAnomaly ? 'percentile_threshold' : null
      };
      
    } catch (error) {
      console.error('[AnomalyDetector] Error in statistical detection:', error);
      
      return {
        type: 'statistical',
        isAnomaly: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  /**
   * Detecção de anomalias de tendência
   * @private
   */
  async detectTrendAnomalies(metricName, currentValue, historicalData, options) {
    try {
      if (historicalData.length < this.config.movingAverageWindow) {
        return {
          type: 'trend',
          isAnomaly: false,
          reason: 'insufficient_data_for_trend',
          confidence: 0
        };
      }
      
      // Calcular média móvel
      const recentData = historicalData.slice(-this.config.movingAverageWindow);
      const movingAverage = this.calculateMean(recentData.map(d => d.value));
      
      // Calcular tendência linear
      const trend = this.calculateLinearTrend(recentData.map((d, i) => ({ x: i, y: d.value })));
      
      // Predizer valor esperado
      const expectedValue = movingAverage + (trend.slope * recentData.length);
      const deviation = Math.abs(currentValue - expectedValue);
      const deviationPercentage = (deviation / Math.abs(expectedValue)) * 100;
      
      // Determinar se é anomalia baseado na tendência
      const trendThreshold = this.getTrendThreshold(trend.slope);
      const isAnomaly = deviationPercentage > trendThreshold;
      
      return {
        type: 'trend',
        isAnomaly,
        confidence: isAnomaly ? Math.min(zScore / this.config.zScoreThreshold, 1) : 0, // Corrigido: usar zScore ou similar para confiança
        details: {
          movingAverage: movingAverage.toFixed(3),
          expectedValue: expectedValue.toFixed(3),
          deviation: deviation.toFixed(3),
          deviationPercentage: deviationPercentage.toFixed(2),
          trendSlope: trend.slope.toFixed(6),
          trendR2: trend.r2.toFixed(3)
        },
        reason: isAnomaly ? 'trend_deviation' : null
      };
      
    } catch (error) {
      console.error('[AnomalyDetector] Error in trend detection:', error);
      
      return {
        type: 'trend',
        isAnomaly: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  /**
   * Detecção de anomalias sazonais
   * @private
   */
  async detectSeasonalAnomalies(metricName, currentValue, historicalData, options) {
    try {
      const currentHour = new Date().getHours();
      const currentDayOfWeek = new Date().getDay();
      
      // Filtrar dados históricos para mesmo período (hora e dia da semana)
      const seasonalData = historicalData.filter(d => {
        const dataDate = new Date(d.timestamp);
        return dataDate.getHours() === currentHour && dataDate.getDay() === currentDayOfWeek;
      });
      
      if (seasonalData.length < 3) {
        return {
          type: 'seasonal',
          isAnomaly: false,
          reason: 'insufficient_seasonal_data',
          confidence: 0
        };
      }
      
      // Calcular padrão sazonal
      const seasonalValues = seasonalData.map(d => d.value);
      const seasonalMean = this.calculateMean(seasonalValues);
      const seasonalStdDev = this.calculateStandardDeviation(seasonalValues, seasonalMean);
      
      // Calcular desvio sazonal
      const seasonalZScore = Math.abs((currentValue - seasonalMean) / seasonalStdDev);
      
      const isAnomaly = seasonalZScore > this.config.zScoreThreshold;
      
      return {
        type: 'seasonal',
        isAnomaly,
        confidence: isAnomaly ? Math.min(seasonalZScore / this.config.zScoreThreshold, 1) : 0,
        details: {
          seasonalMean: seasonalMean.toFixed(3),
          seasonalStdDev: seasonalStdDev.toFixed(3),
          seasonalZScore: seasonalZScore.toFixed(3),
          seasonalDataPoints: seasonalData.length,
          currentHour,
          currentDayOfWeek
        },
        reason: isAnomaly ? 'seasonal_deviation' : null
      };
      
    } catch (error) {
      console.error('[AnomalyDetector] Error in seasonal detection:', error);
      
      return {
        type: 'seasonal',
        isAnomaly: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  /**
   * Detecção baseada em thresholds configurados
   * @private
   */
  async detectThresholdAnomalies(metricName, currentValue, options) {
    try {
      // Obter configuração da métrica
      const metricConfig = options.metricConfig || await this.getMetricConfig(metricName);
      
      if (!metricConfig) {
        return {
          type: 'threshold',
          isAnomaly: false,
          reason: 'no_threshold_config',
          confidence: 0
        };
      }
      
      const {
        target_value: target,
        min_expected_value: minThreshold,
        max_expected_value: maxThreshold,
        alert_thresholds: alertThresholds
      } = metricConfig;
      
      let isAnomaly = false;
      let severity = 'info';
      let reason = null;
      
      // Verificar thresholds críticos
      if (alertThresholds) {
        const thresholds = typeof alertThresholds === 'string' 
          ? JSON.parse(alertThresholds) 
          : alertThresholds;
        
        if (thresholds.critical && (currentValue >= thresholds.critical || currentValue <= thresholds.critical)) {
          isAnomaly = true;
          severity = 'critical';
          reason = 'critical_threshold_exceeded';
        } else if (thresholds.warning && (currentValue >= thresholds.warning || currentValue <= thresholds.warning)) {
          isAnomaly = true;
          severity = 'warning';
          reason = 'warning_threshold_exceeded';
        }
      }
      
      // Verificar limites esperados
      if (!isAnomaly && (minThreshold || maxThreshold)) {
        if (minThreshold && currentValue < minThreshold) {
          isAnomaly = true;
          severity = 'medium';
          reason = 'below_minimum_expected';
        } else if (maxThreshold && currentValue > maxThreshold) {
          isAnomaly = true;
          severity = 'medium';
          reason = 'above_maximum_expected';
        }
      }
      
      // Calcular confiança baseada na distância do threshold
      let confidence = 0;
      if (isAnomaly && target) {
        const deviationFromTarget = Math.abs(currentValue - target);
        const targetRange = Math.max(Math.abs(maxThreshold - target), Math.abs(target - minThreshold));
        confidence = Math.min(deviationFromTarget / targetRange, 1);
      }
      
      return {
        type: 'threshold',
        isAnomaly,
        severity,
        confidence,
        details: {
          target,
          minThreshold,
          maxThreshold,
          alertThresholds,
          deviationFromTarget: target ? Math.abs(currentValue - target) : null
        },
        reason
      };
      
    } catch (error) {
      console.error('[AnomalyDetector] Error in threshold detection:', error);
      
      return {
        type: 'threshold',
        isAnomaly: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  // =====================================================
  // MACHINE LEARNING E ALGORITMOS AVANÇADOS
  // =====================================================

  /**
   * Detecção usando algoritmos de ML simples
   * @private
   */
  async detectMLAnomalies(metricName, currentValue, historicalData) {
    try {
      // Implementação simplificada de Isolation Forest
      const anomalyScore = this.calculateIsolationScore(currentValue, historicalData);
      
      // Threshold adaptativo baseado no histórico
      const threshold = this.calculateAdaptiveThreshold(metricName, historicalData);
      
      const isAnomaly = anomalyScore > threshold;
      
      return {
        type: 'ml',
        isAnomaly,
        anomalyScore,
        confidence: isAnomaly ? Math.min(anomalyScore / threshold, 1) : 0,
        details: {
          isolationScore: anomalyScore.toFixed(4),
          adaptiveThreshold: threshold.toFixed(4),
          algorithm: 'simplified_isolation_forest'
        },
        reason: isAnomaly ? 'ml_isolation_score' : null
      };
      
    } catch (error) {
      console.error('[AnomalyDetector] Error in ML detection:', error);
      
      return {
        type: 'ml',
        isAnomaly: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  // =====================================================
  // UTILITÁRIOS E CÁLCULOS
  // =====================================================

  /**
   * Combina resultados de diferentes métodos de detecção
   * @private
   */
  combineDetectionResults(results) {
    const anomalies = results.filter(r => r.isAnomaly);
    
    if (anomalies.length === 0) {
      return {
        isAnomaly: false,
        confidence: 0,
        methods: results.map(r => r.type),
        details: results
      };
    }
    
    // Calcular confiança combinada (média ponderada)
    const weights = {
      statistical: 0.3,
      trend: 0.25,
      seasonal: 0.2,
      threshold: 0.25,
      ml: 0.4
    };
    
    let weightedConfidence = 0;
    let totalWeight = 0;
    
    results.forEach(result => {
      const weight = weights[result.type] || 0.1;
      weightedConfidence += result.confidence * weight;
      totalWeight += weight;
    });
    
    const combinedConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;
    
    // Determinar severidade geral
    const severities = anomalies.map(a => a.severity).filter(Boolean);
    const highestSeverity = this.getHighestSeverity(severities);
    
    return {
      isAnomaly: true,
      confidence: combinedConfidence,
      severity: highestSeverity,
      methods: results.map(r => r.type),
      anomalousResults: anomalies,
      details: results,
      reasons: anomalies.map(a => a.reason).filter(Boolean)
    };
  }

  /**
   * Calcula média
   * @private
   */
  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calcula desvio padrão
   * @private
   */
  calculateStandardDeviation(values, mean) {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calcula percentil
   * @private
   */
  calculatePercentile(sortedValues, percentile) {
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Calcula tendência linear simples
   * @private
   */
  calculateLinearTrend(points) {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calcular R²
    const yMean = sumY / n;
    const totalSumSquares = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
    const residualSumSquares = points.reduce((sum, p) => {
      const predicted = slope * p.x + intercept;
      return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    
    const r2 = 1 - (residualSumSquares / totalSumSquares);
    
    return { slope, intercept, r2 };
  }

  /**
   * Implementação simplificada do Isolation Score
   * @private
   */
  calculateIsolationScore(value, historicalData) {
    const values = historicalData.map(d => d.value);
    
    // Simular árvore de isolamento simples
    let isolationDepth = 0;
    let currentValues = [...values, value];
    
    while (currentValues.length > 1 && isolationDepth < 10) {
      const min = Math.min(...currentValues);
      const max = Math.max(...currentValues);
      const split = min + Math.random() * (max - min);
      
      if (value <= split) {
        currentValues = currentValues.filter(v => v <= split);
      } else {
        currentValues = currentValues.filter(v => v > split);
      }
      
      isolationDepth++;
    }
    
    // Normalizar score (valores menores = mais anômalos)
    return 1 / (isolationDepth + 1);
  }

  /**
   * Obtém dados históricos para uma métrica
   * @private
   */
  async getHistoricalData(metricName, options = {}) {
    const daysBack = options.daysBack || this.config.learningWindow;
    
    const query = `
      SELECT 
        current_value as value,
        calculated_at as timestamp
      FROM analytics_kpis 
      WHERE kpi_name = $1 
        AND calculated_at > NOW() - INTERVAL '${daysBack} days'
      ORDER BY calculated_at ASC
    `;
    
    const result = await this.db.query(query, [metricName]);
    return result.rows.map(row => ({
      value: parseFloat(row.value),
      timestamp: row.timestamp
    }));
  }

  /**
   * Métodos auxiliares (placeholders)
   * @private
   */
  async getActiveMetrics() {
    const query = `
      SELECT DISTINCT kpi_name as metric_name, * 
      FROM analytics_metric_configs 
      WHERE is_active = true
    `;
    
    const result = await this.db.query(query);
    return result.rows;
  }

  async getCurrentMetricValue(metricName) {
    const query = `
      SELECT current_value 
      FROM analytics_kpis 
      WHERE kpi_name = $1 
      ORDER BY calculated_at DESC 
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [metricName]);
    return result.rows.length > 0 ? parseFloat(result.rows[0].current_value) : null;
  }

  async getMetricConfig(metricName) {
    const query = `
      SELECT * FROM analytics_metric_configs 
      WHERE metric_name = $1
    `;
    
    const result = await this.db.query(query, [metricName]);
    return result.rows[0] || null;
  }

  getTrendThreshold(slope) {
    // Ajustar threshold baseado na sensibilidade
    const baseThreshold = {
      low: 50,      // 50%
      medium: 30,   // 30%
      high: 15      // 15%
    }[this.config.sensitivity] || 30;
    
    // Ajustar baseado na inclinação da tendência
    return baseThreshold * (1 + Math.abs(slope) * 10);
  }

  calculateAdaptiveThreshold(metricName, historicalData) {
    // Threshold adaptativo baseado na variabilidade histórica
    const values = historicalData.map(d => d.value);
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values, mean);
    
    return 0.5 + (stdDev / mean) * 0.3; // Baseado no coeficiente de variação
  }

  shouldTriggerAlert(metricName, result) {
    const now = Date.now();
    const lastAlert = this.alertHistory.get(metricName);
    
    if (!lastAlert) {
      this.alertHistory.set(metricName, now);
      return true;
    }
    
    // Verificar cooldown
    if (now - lastAlert < this.config.alertCooldown) {
      return false;
    }
    
    this.alertHistory.set(metricName, now);
    return true;
  }

  async triggerAnomalyAlert(metricName, currentValue, result) {
    const alertData = {
      alert_name: `anomaly_${metricName}`,
      alert_type: 'anomaly',
      severity: result.severity || 'medium',
      metric_name: metricName,
      current_value: currentValue,
      anomaly_score: result.confidence,
      condition_type: 'anomaly_score',
      threshold_value: this.config.zScoreThreshold,
      alert_message: `Anomalia detectada em ${metricName}: ${currentValue} (confiança: ${(result.confidence * 100).toFixed(1)}%)`,
      context_data: JSON.stringify({
        detectionMethods: result.methods,
        reasons: result.reasons,
        details: result.details
      }),
      recommended_actions: [
        'Investigar causa da anomalia',
        'Verificar integridade dos dados',
        'Analisar eventos correlacionados'
      ]
    };
    
    // Inserir alerta no banco
    const insertQuery = `
      INSERT INTO analytics_alerts (
        alert_name, alert_type, severity, metric_name, current_value,
        anomaly_score, condition_type, threshold_value, alert_message,
        context_data, recommended_actions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    
    await this.db.query(insertQuery, [
      alertData.alert_name,
      alertData.alert_type,
      alertData.severity,
      alertData.metric_name,
      alertData.current_value,
      alertData.anomaly_score,
      alertData.condition_type,
      alertData.threshold_value,
      alertData.alert_message,
      alertData.context_data,
      alertData.recommended_actions
    ]);
    
    // Emitir evento de alerta
    this.emit('alertTriggered', alertData);
    
    console.log(`[AnomalyDetector] Alert triggered for ${metricName}: ${alertData.alert_message}`);
  }

  getHighestSeverity(severities) {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    let highest = 'low';
    
    severities.forEach(severity => {
      if (severityOrder.indexOf(severity) > severityOrder.indexOf(highest)) {
        highest = severity;
      }
    });
    
    return highest;
  }

  /**
   * Obtém estatísticas do detector
   */
  getDetectorMetrics() {
    return {
      ...this.detectorMetrics,
      accuracy: this.detectorMetrics.totalChecks > 0 
        ? ((this.detectorMetrics.totalChecks - this.detectorMetrics.falsePositives) / this.detectorMetrics.totalChecks * 100).toFixed(2)
        : 0,
      modelsLoaded: this.models.size,
      patternsIdentified: this.patterns.size
    };
  }

  /**
   * Treina modelos com dados históricos
   */
  async trainModels(metricName) {
    try {
      const historicalData = await this.getHistoricalData(metricName, { daysBack: this.config.learningWindow });
      
      if (historicalData.length < this.config.minDataPoints) {
        console.warn(`[AnomalyDetector] Insufficient data to train model for ${metricName}`);
        return false;
      }
      
      // Treinar modelo simples (estatísticas básicas)
      const values = historicalData.map(d => d.value);
      const model = {
        mean: this.calculateMean(values),
        stdDev: this.calculateStandardDeviation(values, this.calculateMean(values)),
        min: Math.min(...values),
        max: Math.max(...values),
        dataPoints: values.length,
        trainedAt: new Date()
      };
      
      this.models.set(metricName, model);
      
      console.log(`[AnomalyDetector] Model trained for ${metricName} with ${values.length} data points`);
      
      return true;
      
    } catch (error) {
      console.error(`[AnomalyDetector] Error training model for ${metricName}:`, error);
      return false;
    }
  }
}
