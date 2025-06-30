// server/services/analytics/report-generator.js (ESM)
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import MetricsCalculator from './metrics-calculator.js';

/**
 * Report Generator - Geração automática de relatórios
 * Responsável por criar, formatar e distribuir relatórios de analytics
 */
class ReportGenerator {
  constructor(config = {}) {
    this.db = config.database || new Pool();
    this.metricsCalculator = new MetricsCalculator(this.db);
    
    this.config = {
      // Configurações de email
      emailHost: config.emailHost || process.env.EMAIL_HOST,
      emailPort: config.emailPort || process.env.EMAIL_PORT || 587,
      emailUser: config.emailUser || process.env.EMAIL_USER,
      emailPass: config.emailPass || process.env.EMAIL_PASS,
      
      // Configurações de relatórios
      reportsDir: config.reportsDir || './reports',
      templatesDir: config.templatesDir || './templates/reports',
      
      // Configurações de distribuição
      defaultRecipients: config.defaultRecipients || [],
      
      // Configurações de formato
      includeCharts: config.includeCharts !== false,
      includeMetadata: config.includeMetadata !== false
    };
    
    // Configurar transportador de email
    this.emailTransporter = null;
    this.setupEmailTransporter();
    
    console.log('[ReportGenerator] Initialized');
  }

  /**
   * Configura transportador de email
   * @private
   */
  async setupEmailTransporter() {
    if (!this.config.emailHost || !this.config.emailUser) {
      console.warn('[ReportGenerator] Email not configured, reports will only be saved locally');
      return;
    }

    try {
      this.emailTransporter = nodemailer.createTransport({
        host: this.config.emailHost,
        port: this.config.emailPort,
        secure: this.config.emailPort === 465,
        auth: {
          user: this.config.emailUser,
          pass: this.config.emailPass
        }
      });

      // Verificar conexão
      await this.emailTransporter.verify();
      console.log('[ReportGenerator] Email transporter configured successfully');

    } catch (error) {
      console.error('[ReportGenerator] Failed to setup email transporter:', error);
      this.emailTransporter = null;
    }
  }

  // =====================================================
  // GERAÇÃO DE RELATÓRIOS
  // =====================================================

  /**
   * Gera relatório executivo diário
   */
  async generateDailyExecutiveReport(date = new Date()) {
    const reportId = `daily_executive_${date.toISOString().split('T')[0]}`;
    
    try {
      console.log(`[ReportGenerator] Generating daily executive report for ${date.toISOString().split('T')[0]}`);

      // Coletar dados
      const [businessMetrics, technicalMetrics, productMetrics] = await Promise.all([
        this.metricsCalculator.calculateBusinessMetrics(date, 'daily'),
        this.metricsCalculator.calculateTechnicalMetrics(date, 'daily'),
        this.metricsCalculator.calculateProductMetrics(date, 'daily')
      ]);

      // Dados adicionais
      const previousDate = new Date(date);
      previousDate.setDate(date.getDate() - 1);
      
      const previousBusinessMetrics = await this.metricsCalculator.calculateBusinessMetrics(previousDate, 'daily');

      // Construir relatório
      const report = {
        id: reportId,
        type: 'daily_executive',
        date: date.toISOString().split('T')[0],
        generatedAt: new Date(),
        
        summary: {
          totalUsers: businessMetrics.engagement.dailyActiveUsers,
          newUsers: businessMetrics.userGrowth.newUsers,
          totalMatches: businessMetrics.matching.totalMatches,
          systemUptime: technicalMetrics.uptime,
          
          // Comparações com dia anterior
          userGrowthChange: this.calculatePercentageChange(
            businessMetrics.engagement.dailyActiveUsers,
            previousBusinessMetrics.engagement.dailyActiveUsers
          ),
          matchGrowthChange: this.calculatePercentageChange(
            businessMetrics.matching.totalMatches,
            previousBusinessMetrics.matching.totalMatches
          )
        },
        
        businessMetrics,
        technicalMetrics,
        productMetrics,
        
        insights: this.generateInsights('daily', {
          current: businessMetrics,
          previous: previousBusinessMetrics,
          technical: technicalMetrics
        }),
        
        alerts: await this.getActiveAlerts(),
        
        metadata: {
          dataQuality: this.assessDataQuality(businessMetrics, technicalMetrics),
          confidenceScore: this.calculateConfidenceScore(businessMetrics),
          coverage: this.calculateDataCoverage(date)
        }
      };

      // Salvar relatório
      await this.saveReport(report);

      // Distribuir se configurado
      if (this.config.defaultRecipients.length > 0) {
        await this.distributeReport(report, this.config.defaultRecipients);
      }

      return report;

    } catch (error) {
      console.error('[ReportGenerator] Error generating daily executive report:', error);
      throw error;
    }
  }

  /**
   * Gera relatório semanal de negócio
   */
  async generateWeeklyBusinessReport(startDate = new Date()) {
    // Calcular início da semana
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() - startDate.getDay());
    
    const reportId = `weekly_business_${weekStart.toISOString().split('T')[0]}`;
    
    try {
      console.log(`[ReportGenerator] Generating weekly business report for week of ${weekStart.toISOString().split('T')[0]}`);

      // Coletar métricas semanais
      const weeklyMetrics = await this.metricsCalculator.calculateBusinessMetrics(weekStart, 'weekly');
      
      // Comparar com semana anterior
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(weekStart.getDate() - 7);
      const previousWeekMetrics = await this.metricsCalculator.calculateBusinessMetrics(previousWeekStart, 'weekly');

      // Análise de coorte
      const cohortAnalysis = await this.generateCohortAnalysis(weekStart);
      
      // Análise de funil
      const funnelAnalysis = await this.generateFunnelAnalysis(weekStart, 'weekly');

      const report = {
        id: reportId,
        type: 'weekly_business',
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        generatedAt: new Date(),
        
        executiveSummary: {
          keyMetrics: {
            weeklyActiveUsers: weeklyMetrics.engagement.weeklyActiveUsers,
            newUsers: weeklyMetrics.userGrowth.newUsers,
            totalMatches: weeklyMetrics.matching.totalMatches,
            retentionRate: weeklyMetrics.userGrowth.retentionRate
          },
          
          weekOverWeekChanges: {
            users: this.calculatePercentageChange(
              weeklyMetrics.engagement.weeklyActiveUsers,
              previousWeekMetrics.engagement.weeklyActiveUsers
            ),
            matches: this.calculatePercentageChange(
              weeklyMetrics.matching.totalMatches,
              previousWeekMetrics.matching.totalMatches
            ),
            retention: this.calculatePercentageChange(
              weeklyMetrics.userGrowth.retentionRate,
              previousWeekMetrics.userGrowth.retentionRate
            )
          },
          
          highlights: this.generateWeeklyHighlights(weeklyMetrics, previousWeekMetrics),
          concerns: this.identifyWeeklyConcerns(weeklyMetrics, previousWeekMetrics)
        },
        
        detailedMetrics: weeklyMetrics,
        cohortAnalysis,
        funnelAnalysis,
        
        trends: await this.generateTrendAnalysis(weekStart, 'weekly'),
        
        recommendations: this.generateRecommendations('weekly', weeklyMetrics),
        
        metadata: {
          dataCompleteness: this.calculateWeeklyDataCompleteness(weekStart),
          analysisConfidence: this.calculateConfidenceScore(weeklyMetrics)
        }
      };

      await this.saveReport(report);
      return report;

    } catch (error) {
      console.error('[ReportGenerator] Error generating weekly business report:', error);
      throw error;
    }
  }

  /**
   * Gera relatório mensal executivo
   */
  async generateMonthlyExecutiveReport(date = new Date()) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const reportId = `monthly_executive_${monthStart.toISOString().split('T')[0].substring(0, 7)}`;
    
    try {
      console.log(`[ReportGenerator] Generating monthly executive report for ${monthStart.toISOString().split('T')[0].substring(0, 7)}`);

      // Coletar dados mensais
      const monthlyMetrics = await this.metricsCalculator.calculateBusinessMetrics(monthStart, 'monthly');
      
      // Comparar com mês anterior
      const previousMonth = new Date(monthStart);
      previousMonth.setMonth(monthStart.getMonth() - 1);
      const previousMonthMetrics = await this.metricsCalculator.calculateBusinessMetrics(previousMonth, 'monthly');

      // Análises especiais para relatório mensal
      const userJourneyAnalysis = await this.generateUserJourneyAnalysis(monthStart);
      const featureAdoptionAnalysis = await this.generateFeatureAdoptionAnalysis(monthStart);
      const competitiveAnalysis = await this.generateCompetitiveAnalysis(monthStart);

      const report = {
        id: reportId,
        type: 'monthly_executive',
        month: monthStart.toISOString().split('T')[0].substring(0, 7),
        generatedAt: new Date(),
        
        executiveSummary: {
          businessGoals: {
            userGrowth: {
              target: 1000, // TODO: Buscar de configuração
              actual: monthlyMetrics.userGrowth.newUsers,
              achievement: (monthlyMetrics.userGrowth.newUsers / 1000) * 100
            },
            engagement: {
              target: 80, // TODO: Buscar de configuração
              actual: monthlyMetrics.engagement.dauMauRatio,
              achievement: (monthlyMetrics.engagement.dauMauRatio / 80) * 100
            },
            matching: {
              target: 25, // TODO: Buscar de configuração
              actual: monthlyMetrics.matching.matchSuccessRate,
              achievement: (monthlyMetrics.matching.matchSuccessRate / 25) * 100
            }
          },
          
          monthOverMonthGrowth: {
            users: this.calculatePercentageChange(
              monthlyMetrics.engagement.monthlyActiveUsers,
              previousMonthMetrics.engagement.monthlyActiveUsers
            ),
            revenue: 0, // TODO: Integrar métricas de revenue
            matches: this.calculatePercentageChange(
              monthlyMetrics.matching.totalMatches,
              previousMonthMetrics.matching.totalMatches
            )
          },
          
          keyInsights: this.generateMonthlyInsights(monthlyMetrics, previousMonthMetrics),
          strategicRecommendations: this.generateStrategicRecommendations(monthlyMetrics)
        },
        
        monthlyMetrics,
        userJourneyAnalysis,
        featureAdoptionAnalysis,
        competitiveAnalysis,
        
        operationalHighlights: {
          systemPerformance: await this.metricsCalculator.calculateTechnicalMetrics(monthStart, 'monthly'),
          productUpdates: [], // TODO: Integrar com changelog
          teamMetrics: {} // TODO: Integrar métricas de equipe
        },
        
        futureOutlook: {
          predictedGrowth: this.predictGrowthTrend(monthlyMetrics),
          upcomingChallenges: this.identifyUpcomingChallenges(monthlyMetrics),
          opportunities: this.identifyOpportunities(monthlyMetrics)
        }
      };

      await this.saveReport(report);
      return report;

    } catch (error) {
      console.error('[ReportGenerator] Error generating monthly executive report:', error);
      throw error;
    }
  }

  // =====================================================
  // ANÁLISES ESPECIALIZADAS
  // =====================================================

  /**
   * Gera análise de coorte
   * @private
   */
  async generateCohortAnalysis(startDate) {
    const query = `
      WITH user_cohorts AS (
        SELECT 
          id as user_id,
          DATE_TRUNC('week', created_at) as cohort_week
        FROM users 
        WHERE created_at >= $1 - INTERVAL '12 weeks'
      ),
      user_activity AS (
        SELECT 
          DISTINCT user_id,
          DATE_TRUNC('week', timestamp) as activity_week
        FROM analytics_events 
        WHERE timestamp >= $1 - INTERVAL '12 weeks'
      )
      SELECT 
        uc.cohort_week,
        COUNT(DISTINCT uc.user_id) as cohort_size,
        COUNT(DISTINCT CASE WHEN ua.activity_week = uc.cohort_week THEN ua.user_id END) as week_0,
        COUNT(DISTINCT CASE WHEN ua.activity_week = uc.cohort_week + INTERVAL '1 week' THEN ua.user_id END) as week_1,
        COUNT(DISTINCT CASE WHEN ua.activity_week = uc.cohort_week + INTERVAL '2 weeks' THEN ua.user_id END) as week_2,
        COUNT(DISTINCT CASE WHEN ua.activity_week = uc.cohort_week + INTERVAL '4 weeks' THEN ua.user_id END) as week_4,
        COUNT(DISTINCT CASE WHEN ua.activity_week = uc.cohort_week + INTERVAL '8 weeks' THEN ua.user_id END) as week_8
      FROM user_cohorts uc
      LEFT JOIN user_activity ua ON uc.user_id = ua.user_id
      GROUP BY uc.cohort_week
      ORDER BY uc.cohort_week DESC
      LIMIT 12
    `;
    
    const result = await this.db.query(query, [startDate]);
    
    return result.rows.map(row => ({
      cohortWeek: row.cohort_week,
      cohortSize: parseInt(row.cohort_size),
      retentionRates: {
        week0: 100,
        week1: this.calculateRetentionRate(row.week_1, row.cohort_size),
        week2: this.calculateRetentionRate(row.week_2, row.cohort_size),
        week4: this.calculateRetentionRate(row.week_4, row.cohort_size),
        week8: this.calculateRetentionRate(row.week_8, row.cohort_size)
      }
    }));
  }

  /**
   * Gera análise de funil
   * @private
   */
  async generateFunnelAnalysis(startDate, period) {
    const periodCondition = this.getPeriodCondition(startDate, period);
    
    const query = `
      WITH funnel_data AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN event_name = 'profile_view' THEN user_id END) as profile_views,
          COUNT(DISTINCT CASE WHEN event_name = 'swipe_right' THEN user_id END) as likes,
          COUNT(DISTINCT CASE WHEN event_name = 'match_created' THEN user_id END) as matches,
          COUNT(DISTINCT CASE WHEN event_name = 'conversation_started' THEN user_id END) as conversations,
          COUNT(DISTINCT CASE WHEN event_name = 'date_planned' THEN user_id END) as dates
        FROM analytics_events 
        WHERE ${periodCondition.replace('created_at', 'timestamp')}
      )
      SELECT * FROM funnel_data
    `;
    
    const result = await this.db.query(query);
    const data = result.rows[0];
    
    return {
      stages: [
        { name: 'Profile Views', users: parseInt(data.profile_views), conversion: 100 },
        { name: 'Likes', users: parseInt(data.likes), conversion: this.calculateConversionRate(data.likes, data.profile_views) },
        { name: 'Matches', users: parseInt(data.matches), conversion: this.calculateConversionRate(data.matches, data.likes) },
        { name: 'Conversations', users: parseInt(data.conversations), conversion: this.calculateConversionRate(data.conversations, data.matches) },
        { name: 'Dates', users: parseInt(data.dates), conversion: this.calculateConversionRate(data.dates, data.conversations) }
      ],
      overallConversion: this.calculateConversionRate(data.dates, data.profile_views),
      bottleneck: this.identifyFunnelBottleneck(data)
    };
  }

  // =====================================================
  // DISTRIBUIÇÃO E SALVAMENTO
  // =====================================================

  /**
   * Salva relatório em arquivo
   * @private
   */
  async saveReport(report) {
    try {
      // Criar diretório se não existir
      await fs.mkdir(this.config.reportsDir, { recursive: true });
      
      // Caminho do arquivo
      const filename = `${report.id}_${report.generatedAt.toISOString().split('T')[0]}.json`;
      const filepath = path.join(this.config.reportsDir, filename);
      
      // Salvar JSON
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      console.log(`[ReportGenerator] Report saved: ${filepath}`);
      
      // Gerar versão HTML se configurado
      if (this.config.includeCharts) {
        await this.generateHTMLReport(report);
      }
      
    } catch (error) {
      console.error('[ReportGenerator] Error saving report:', error);
      throw error;
    }
  }

  /**
   * Distribuir relatório por email
   * @private
   */
  async distributeReport(report, recipients) {
    if (!this.emailTransporter) {
      console.warn('[ReportGenerator] Email not configured, skipping distribution');
      return;
    }

    try {
      const subject = this.generateEmailSubject(report);
      const html = this.generateEmailHTML(report);
      const attachments = await this.generateEmailAttachments(report);

      for (const recipient of recipients) {
        await this.emailTransporter.sendMail({
          from: this.config.emailUser,
          to: recipient,
          subject,
          html,
          attachments
        });
      }

      console.log(`[ReportGenerator] Report distributed to ${recipients.length} recipients`);

    } catch (error) {
      console.error('[ReportGenerator] Error distributing report:', error);
      throw error;
    }
  }

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  /**
   * Calcula mudança percentual
   * @private
   */
  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Calcula taxa de conversão
   * @private
   */
  calculateConversionRate(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return (numerator / denominator) * 100;
  }

  /**
   * Calcula taxa de retenção
   * @private
   */
  calculateRetentionRate(retained, total) {
    if (!total || total === 0) return 0;
    return (retained / total) * 100;
  }

  /**
   * Gera insights baseados nos dados
   * @private
   */
  generateInsights(period, data) {
    const insights = [];
    
    // Análise de crescimento
    if (data.current.userGrowth.growthRate > 10) {
      insights.push({
        type: 'positive',
        category: 'growth',
        message: `Crescimento de usuários acima do esperado: ${data.current.userGrowth.growthRate.toFixed(1)}%`
      });
    }
    
    // Análise de engajamento
    if (data.current.engagement.dauMauRatio > 20) {
      insights.push({
        type: 'positive',
        category: 'engagement',
        message: `Alta qualidade de engajamento: ${data.current.engagement.dauMauRatio.toFixed(1)}% DAU/MAU`
      });
    }
    
    // Análise técnica
    if (data.technical.uptime < 99) {
      insights.push({
        type: 'warning',
        category: 'technical',
        message: `Uptime abaixo do ideal: ${data.technical.uptime.toFixed(1)}%`
      });
    }
    
    return insights;
  }

  /**
   * Obtém alertas ativos
   * @private
   */
  async getActiveAlerts() {
    const query = `
      SELECT 
        alert_name,
        severity,
        metric_name,
        current_value,
        threshold_value,
        detected_at
      FROM analytics_alerts 
      WHERE status = 'active'
      ORDER BY severity DESC, detected_at DESC
      LIMIT 10
    `;
    
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Gera condição SQL para período
   * @private
   */
  getPeriodCondition(date, period) {
    const dateStr = date.toISOString().split('T')[0];
    
    switch (period) {
      case 'daily':
        return `DATE(created_at) = '${dateStr}'`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `created_at >= '${weekStart.toISOString().split('T')[0]}'`;
      case 'monthly':
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        return `created_at >= '${monthStart.toISOString().split('T')[0]}'`;
      default:
        return `DATE(created_at) = '${dateStr}'`;
    }
  }

  // Placeholder methods for additional functionality
  assessDataQuality() { return 'good'; }
  calculateConfidenceScore() { return 0.95; }
  calculateDataCoverage() { return 0.98; }
  generateWeeklyHighlights() { return []; }
  identifyWeeklyConcerns() { return []; }
  generateTrendAnalysis() { return {}; }
  generateRecommendations() { return []; }
  calculateWeeklyDataCompleteness() { return 0.98; }
  generateMonthlyInsights() { return []; }
  generateStrategicRecommendations() { return []; }
  generateUserJourneyAnalysis() { return {}; }
  generateFeatureAdoptionAnalysis() { return {}; }
  generateCompetitiveAnalysis() { return {}; }
  predictGrowthTrend() { return {}; }
  identifyUpcomingChallenges() { return []; }
  identifyOpportunities() { return []; }
  identifyFunnelBottleneck() { return 'likes_to_matches'; }
  generateHTMLReport() { return Promise.resolve(); }
  generateEmailSubject(report) { return `Analytics Report - ${report.type} - ${report.date || report.month}`; }
  generateEmailHTML() { return '<p>Report attached</p>'; }
  generateEmailAttachments() { return Promise.resolve([]); }
}

export default ReportGenerator;
