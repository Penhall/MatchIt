// server/services/analytics/metrics-calculator.js (ESM)
import pg from 'pg';
const { Pool } = pg;

/**
 * Metrics Calculator - Responsável por todos os cálculos de KPIs e métricas
 * Calcula métricas de negócio, técnicas e de produto
 */
class MetricsCalculator {
  constructor(database = null) {
    this.db = database || new Pool();
    
    // Cache de métricas calculadas
    this.metricsCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    
    console.log('[MetricsCalculator] Initialized');
  }

  // =====================================================
  // MÉTRICAS DE NEGÓCIO
  // =====================================================
  
  /**
   * Calcula todas as métricas de negócio para um período
   * @param {Date} date - Data para cálculo
   * @param {string} period - Período (daily, weekly, monthly)
   * @returns {Promise<Object>} Métricas de negócio
   */
  async calculateBusinessMetrics(date, period = 'daily') {
    const cacheKey = `business_${period}_${date.toISOString().split('T')[0]}`;
    
    // Verificar cache
    if (this.metricsCache.has(cacheKey)) {
      const cached = this.metricsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }
    
    try {
      console.log(`[MetricsCalculator] Calculating business metrics for ${date.toISOString().split('T')[0]}`);
      
      const metrics = {
        // Crescimento de usuários
        userGrowth: await this.calculateUserGrowthMetrics(date, period),
        
        // Engajamento
        engagement: await this.calculateEngagementMetrics(date, period),
        
        // Matching e conversões
        matching: await this.calculateMatchingMetrics(date, period),
        
        // Retenção
        retention: await this.calculateRetentionMetrics(date, period),
        
        // Qualidade
        quality: await this.calculateQualityMetrics(date, period)
      };
      
      // Salvar no cache
      this.metricsCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });
      
      return metrics;
      
    } catch (error) {
      console.error('[MetricsCalculator] Error calculating business metrics:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas de crescimento de usuários
   * @private
   */
  async calculateUserGrowthMetrics(date, period) {
    const dateStr = date.toISOString().split('T')[0];
    const periodCondition = this.getPeriodCondition(date, period);
    const previousPeriodCondition = this.getPreviousPeriodCondition(date, period);
    
    const query = `
      WITH current_period AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN DATE(created_at) ${periodCondition} THEN id END) as new_users,
          COUNT(DISTINCT CASE WHEN ae.user_id IS NOT NULL AND ${periodCondition.replace('created_at', 'ae.timestamp')} THEN ae.user_id END) as active_users
        FROM users u
        LEFT JOIN analytics_events ae ON u.id = ae.user_id
      ),
      previous_period AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN DATE(created_at) ${previousPeriodCondition} THEN id END) as prev_new_users,
          COUNT(DISTINCT CASE WHEN ae.user_id IS NOT NULL AND ${previousPeriodCondition.replace('created_at', 'ae.timestamp')} THEN ae.user_id END) as prev_active_users
        FROM users u
        LEFT JOIN analytics_events ae ON u.id = ae.user_id
      ),
      retention_data AS (
        SELECT COUNT(DISTINCT user_id) as retained_users
        FROM analytics_events 
        WHERE ${periodCondition.replace('created_at', 'timestamp')}
          AND user_id IN (
            SELECT DISTINCT user_id 
            FROM analytics_events 
            WHERE ${previousPeriodCondition.replace('created_at', 'timestamp')}
          )
      )
      SELECT 
        cp.new_users,
        cp.active_users,
        pp.prev_new_users,
        pp.prev_active_users,
        rd.retained_users,
        (cp.active_users - rd.retained_users) as churned_users
      FROM current_period cp, previous_period pp, retention_data rd
    `;
    
    const result = await this.db.query(query);
    const row = result.rows[0];
    
    return {
      newUsers: parseInt(row.new_users) || 0,
      activeUsers: parseInt(row.active_users) || 0,
      retainedUsers: parseInt(row.retained_users) || 0,
      churnedUsers: parseInt(row.churned_users) || 0,
      growthRate: this.calculateGrowthRate(row.new_users, row.prev_new_users),
      churnRate: this.calculateChurnRate(row.churned_users, row.prev_active_users),
      retentionRate: this.calculateRetentionRate(row.retained_users, row.prev_active_users)
    };
  }

  /**
   * Calcula métricas de engajamento
   * @private
   */
  async calculateEngagementMetrics(date, period) {
    const periodCondition = this.getPeriodCondition(date, period);
    
    const query = `
      WITH session_data AS (
        SELECT 
          session_id,
          user_id,
          COUNT(*) as events_per_session,
          EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp)))/60 as session_duration_minutes,
          DATE(MIN(timestamp)) as session_date
        FROM analytics_events 
        WHERE ${periodCondition.replace('created_at', 'timestamp')}
        GROUP BY session_id, user_id
      ),
      user_sessions AS (
        SELECT 
          user_id,
          COUNT(DISTINCT session_id) as sessions_count,
          AVG(session_duration_minutes) as avg_session_duration,
          SUM(events_per_session) as total_events
        FROM session_data
        GROUP BY user_id
      ),
      daily_active AS (
        SELECT 
          COUNT(DISTINCT user_id) as dau,
          COUNT(DISTINCT session_id) as daily_sessions
        FROM analytics_events 
        WHERE DATE(timestamp) = $1
      ),
      weekly_active AS (
        SELECT COUNT(DISTINCT user_id) as wau
        FROM analytics_events 
        WHERE timestamp >= $1::date - INTERVAL '7 days' 
          AND timestamp < $1::date + INTERVAL '1 day'
      ),
      monthly_active AS (
        SELECT COUNT(DISTINCT user_id) as mau
        FROM analytics_events 
        WHERE timestamp >= $1::date - INTERVAL '30 days' 
          AND timestamp < $1::date + INTERVAL '1 day'
      )
      SELECT 
        COALESCE(AVG(us.sessions_count), 0) as avg_sessions_per_user,
        COALESCE(AVG(us.avg_session_duration), 0) as avg_session_duration,
        COALESCE(AVG(us.total_events), 0) as avg_events_per_user,
        da.dau,
        wa.wau,
        ma.mau,
        da.daily_sessions,
        CASE WHEN wa.wau > 0 THEN (da.dau::float / wa.wau * 100) ELSE 0 END as dau_wau_ratio,
        CASE WHEN ma.mau > 0 THEN (da.dau::float / ma.mau * 100) ELSE 0 END as dau_mau_ratio
      FROM user_sessions us
      CROSS JOIN daily_active da
      CROSS JOIN weekly_active wa
      CROSS JOIN monthly_active ma
    `;
    
    const result = await this.db.query(query, [date.toISOString().split('T')[0]]);
    const row = result.rows[0] || {};
    
    return {
      averageSessionsPerUser: parseFloat(row.avg_sessions_per_user) || 0,
      averageSessionDuration: parseFloat(row.avg_session_duration) || 0,
      averageEventsPerUser: parseFloat(row.avg_events_per_user) || 0,
      dailyActiveUsers: parseInt(row.dau) || 0,
      weeklyActiveUsers: parseInt(row.wau) || 0,
      monthlyActiveUsers: parseInt(row.mau) || 0,
      dailySessions: parseInt(row.daily_sessions) || 0,
      dauWauRatio: parseFloat(row.dau_wau_ratio) || 0,
      dauMauRatio: parseFloat(row.dau_mau_ratio) || 0
    };
  }

  /**
   * Calcula métricas de matching e conversões
   * @private
   */
  async calculateMatchingMetrics(date, period) {
    const periodCondition = this.getPeriodCondition(date, period);
    
    const query = `
      WITH matching_events AS (
        SELECT 
          COUNT(CASE WHEN event_name = 'swipe_right' THEN 1 END) as total_likes,
          COUNT(CASE WHEN event_name = 'swipe_left' THEN 1 END) as total_passes,
          COUNT(CASE WHEN event_name = 'match_created' THEN 1 END) as total_matches,
          COUNT(CASE WHEN event_name = 'conversation_started' THEN 1 END) as conversations_started,
          COUNT(CASE WHEN event_name = 'message_sent' THEN 1 END) as messages_sent,
          COUNT(CASE WHEN event_name = 'date_planned' THEN 1 END) as dates_planned,
          COUNT(DISTINCT user_id) as active_users
        FROM analytics_events 
        WHERE ${periodCondition.replace('created_at', 'timestamp')}
          AND event_type = 'user_action'
      ),
      user_metrics AS (
        SELECT 
          AVG(CASE WHEN event_name = 'match_created' THEN 1 ELSE 0 END) as avg_matches_per_user,
          AVG(CASE WHEN event_name = 'conversation_started' THEN 1 ELSE 0 END) as avg_conversations_per_user
        FROM (
          SELECT 
            user_id,
            event_name,
            COUNT(*) as event_count
          FROM analytics_events 
          WHERE ${periodCondition.replace('created_at', 'timestamp')}
            AND event_type = 'user_action'
            AND event_name IN ('match_created', 'conversation_started')
          GROUP BY user_id, event_name
        ) user_events
      )
      SELECT 
        me.total_likes,
        me.total_matches,
        me.conversations_started,
        me.messages_sent,
        me.dates_planned,
        me.active_users,
        um.avg_matches_per_user,
        um.avg_conversations_per_user,
        CASE WHEN me.total_likes > 0 THEN (me.total_matches::float / me.total_likes * 100) ELSE 0 END as match_success_rate,
        CASE WHEN me.total_matches > 0 THEN (me.conversations_started::float / me.total_matches * 100) ELSE 0 END as conversation_start_rate,
        CASE WHEN me.conversations_started > 0 THEN (me.dates_planned::float / me.conversations_started * 100) ELSE 0 END as date_conversion_rate
      FROM matching_events me
      CROSS JOIN user_metrics um
    `;
    
    const result = await this.db.query(query);
    const row = result.rows[0] || {};
    
    return {
      totalMatches: parseInt(row.total_matches) || 0,
      totalLikes: parseInt(row.total_likes) || 0,
      conversationsStarted: parseInt(row.conversations_started) || 0,
      datesPlanned: parseInt(row.dates_planned) || 0,
      averageMatchesPerUser: parseFloat(row.avg_matches_per_user) || 0,
      matchSuccessRate: parseFloat(row.match_success_rate) || 0,
      conversationStartRate: parseFloat(row.conversation_start_rate) || 0,
      dateConversionRate: parseFloat(row.date_conversion_rate) || 0
    };
  }

  // =====================================================
  // MÉTRICAS TÉCNICAS
  // =====================================================

  /**
   * Calcula métricas técnicas de performance
   */
  async calculateTechnicalMetrics(date, period = 'daily') {
    const periodCondition = this.getPeriodCondition(date, period);
    
    const query = `
      WITH performance_events AS (
        SELECT 
          event_properties->>'responseTime' as response_time,
          event_properties->>'errorCode' as error_code,
          event_properties->>'endpoint' as endpoint
        FROM analytics_events 
        WHERE ${periodCondition.replace('created_at', 'timestamp')}
          AND event_type = 'performance_metric'
          AND event_properties->>'responseTime' IS NOT NULL
      )
      SELECT 
        AVG(CAST(response_time AS FLOAT)) as avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY CAST(response_time AS FLOAT)) as p95_response_time,
        COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END) as error_count,
        COUNT(*) as total_requests,
        CASE WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN error_code IS NOT NULL THEN 1 END)::float / COUNT(*) * 100) ELSE 0 END as error_rate
      FROM performance_events
    `;
    
    const result = await this.db.query(query);
    const row = result.rows[0] || {};
    
    return {
      averageResponseTime: parseFloat(row.avg_response_time) || 0,
      p95ResponseTime: parseFloat(row.p95_response_time) || 0,
      errorRate: parseFloat(row.error_rate) || 0,
      totalRequests: parseInt(row.total_requests) || 0,
      errorCount: parseInt(row.error_count) || 0,
      uptime: this.calculateUptime(row.error_rate)
    };
  }

  // =====================================================
  // MÉTRICAS DE PRODUTO
  // =====================================================

  /**
   * Calcula métricas de adoção de features
   */
  async calculateProductMetrics(date, period = 'daily') {
    const periodCondition = this.getPeriodCondition(date, period);
    
    const query = `
      WITH feature_adoption AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN event_name = 'style_preferences_completed' THEN user_id END) as style_users,
          COUNT(DISTINCT CASE WHEN event_name = 'emotional_profile_completed' THEN user_id END) as emotional_users,
          COUNT(DISTINCT CASE WHEN event_name = 'profile_photo_uploaded' THEN user_id END) as photo_users,
          COUNT(DISTINCT user_id) as total_active_users
        FROM analytics_events 
        WHERE ${periodCondition.replace('created_at', 'timestamp')}
      ),
      profile_completion AS (
        SELECT 
          COUNT(CASE WHEN u.bio IS NOT NULL AND u.bio != '' THEN 1 END) as users_with_bio,
          COUNT(CASE WHEN up.age IS NOT NULL THEN 1 END) as users_with_age,
          COUNT(*) as total_users
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE DATE(u.created_at) ${periodCondition}
      )
      SELECT 
        fa.style_users,
        fa.emotional_users,
        fa.photo_users,
        fa.total_active_users,
        pc.users_with_bio,
        pc.users_with_age,
        pc.total_users,
        CASE WHEN fa.total_active_users > 0 THEN (fa.style_users::float / fa.total_active_users * 100) ELSE 0 END as style_adoption_rate,
        CASE WHEN fa.total_active_users > 0 THEN (fa.emotional_users::float / fa.total_active_users * 100) ELSE 0 END as emotional_adoption_rate,
        CASE WHEN pc.total_users > 0 THEN (pc.users_with_bio::float / pc.total_users * 100) ELSE 0 END as bio_completion_rate
      FROM feature_adoption fa
      CROSS JOIN profile_completion pc
    `;
    
    const result = await this.db.query(query);
    const row = result.rows[0] || {};
    
    return {
      stylePreferencesAdoption: parseFloat(row.style_adoption_rate) || 0,
      emotionalProfileAdoption: parseFloat(row.emotional_adoption_rate) || 0,
      profileCompletionRate: parseFloat(row.bio_completion_rate) || 0,
      activeUsers: parseInt(row.total_active_users) || 0
    };
  }

  // =====================================================
  // CÁLCULOS DE RETENÇÃO
  // =====================================================

  /**
   * Calcula métricas detalhadas de retenção
   */
  async calculateRetentionMetrics(date, period) {
    const cohortAnalysis = await this.calculateCohortRetention(date);
    const dayNRetention = await this.calculateDayNRetention(date, [1, 3, 7, 14, 30]);
    
    return {
      cohortRetention: cohortAnalysis,
      dayNRetention: dayNRetention,
      overallRetentionRate: this.calculateOverallRetention(dayNRetention)
    };
  }

  /**
   * Análise de coorte de retenção
   * @private
   */
  async calculateCohortRetention(date) {
    const query = `
      WITH user_cohorts AS (
        SELECT 
          id as user_id,
          DATE_TRUNC('week', created_at) as cohort_week
        FROM users 
        WHERE created_at >= $1::date - INTERVAL '12 weeks'
      ),
      user_activity AS (
        SELECT 
          DISTINCT user_id,
          DATE_TRUNC('week', timestamp) as activity_week
        FROM analytics_events 
        WHERE timestamp >= $1::date - INTERVAL '12 weeks'
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
      LIMIT 8
    `;
    
    const result = await this.db.query(query, [date]);
    
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

  // =====================================================
  // UTILITÁRIOS DE CÁLCULO
  // =====================================================

  /**
   * Calcula taxa de crescimento
   * @private
   */
  calculateGrowthRate(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Calcula taxa de churn
   * @private
   */
  calculateChurnRate(churned, total) {
    if (!total || total === 0) return 0;
    return (churned / total) * 100;
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
   * Calcula uptime baseado na taxa de erro
   * @private
   */
  calculateUptime(errorRate) {
    return Math.max(0, 100 - (errorRate || 0));
  }

  /**
   * Gera condição SQL para período
   * @private
   */
  getPeriodCondition(date, period) {
    const dateStr = date.toISOString().split('T')[0];
    
    switch (period) {
      case 'daily':
        return `= '${dateStr}'`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `>= '${weekStart.toISOString().split('T')[0]}'`;
      case 'monthly':
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        return `>= '${monthStart.toISOString().split('T')[0]}'`;
      default:
        return `= '${dateStr}'`;
    }
  }

  /**
   * Gera condição SQL para período anterior
   * @private
   */
  getPreviousPeriodCondition(date, period) {
    let previousDate;
    
    switch (period) {
      case 'daily':
        previousDate = new Date(date);
        previousDate.setDate(date.getDate() - 1);
        break;
      case 'weekly':
        previousDate = new Date(date);
        previousDate.setDate(date.getDate() - 7);
        break;
      case 'monthly':
        previousDate = new Date(date);
        previousDate.setMonth(date.getMonth() - 1);
        break;
      default:
        previousDate = new Date(date);
        previousDate.setDate(date.getDate() - 1);
    }
    
    return this.getPeriodCondition(previousDate, period);
  }

  /**
   * Limpa cache de métricas
   */
  clearCache() {
    this.metricsCache.clear();
    console.log('[MetricsCalculator] Cache cleared');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return {
      size: this.metricsCache.size,
      expiryMinutes: this.cacheExpiry / (60 * 1000)
    };
  }
}
