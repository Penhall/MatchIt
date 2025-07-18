// screens/AnalyticsDashboard.tsx

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl, Alert } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useAnalytics } from '../hooks/analytics/useAnalytics';
import { BusinessKPIs, AnalyticsEvent } from '../types/analytics';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Activity, 
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

interface ExecutiveDashboardProps {
  userId?: string;
  timeRange?: '7d' | '30d' | '90d';
  refreshInterval?: number;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  userId,
  timeRange = '30d',
  refreshInterval = 30000 // 30 segundos
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>(timeRange);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'business' | 'technical' | 'realtime'>('overview');

  const {
    executiveDashboard,
    realtimeDashboard,
    businessMetrics,
    technicalMetrics,
    isLoading,
    error,
    refreshDashboard,
    trackEvent
  } = useAnalytics();

  // Atualização automática
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboard(selectedTimeRange);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedTimeRange, refreshInterval]);

  // Carregar dados iniciais
  useEffect(() => {
    refreshDashboard(selectedTimeRange);
  }, [selectedTimeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDashboard(selectedTimeRange);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTimeRangeChange = (range: '7d' | '30d' | '90d') => {
    setSelectedTimeRange(range);
    trackEvent({
      eventType: 'user_action',
      eventName: 'dashboard_timerange_changed',
      properties: { newRange: range, previousRange: selectedTimeRange }
    });
  };

  if (isLoading && !executiveDashboard) {
    return (
      <View style={styles.loadingContainer}>
        <Activity size={24} color="#6366f1" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={24} color="#ef4444" />
        <Text style={styles.errorText}>Erro ao carregar dados</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#6366f1']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Executivo</Text>
        <Text style={styles.subtitle}>
          Visão geral do desempenho • {selectedTimeRange}
        </Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {['7d', '30d', '90d'].map((range) => (
          <View
            key={range}
            style={[
              styles.timeRangeButton,
              selectedTimeRange === range && styles.timeRangeButtonActive
            ]}
            onTouchEnd={() => handleTimeRangeChange(range as '7d' | '30d' | '90d')}
          >
            <Text style={[
              styles.timeRangeText,
              selectedTimeRange === range && styles.timeRangeTextActive
            ]}>
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
            </Text>
          </View>
        ))}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Visão Geral' },
          { key: 'business', label: 'Negócio' },
          { key: 'technical', label: 'Técnico' },
          { key: 'realtime', label: 'Tempo Real' }
        ].map((tab) => (
          <View
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive
            ]}
            onTouchEnd={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <OverviewTab 
          dashboard={executiveDashboard}
          screenWidth={screenWidth}
        />
      )}

      {activeTab === 'business' && (
        <BusinessTab 
          metrics={businessMetrics}
          screenWidth={screenWidth}
        />
      )}

      {activeTab === 'technical' && (
        <TechnicalTab 
          metrics={technicalMetrics}
          screenWidth={screenWidth}
        />
      )}

      {activeTab === 'realtime' && (
        <RealtimeTab 
          dashboard={realtimeDashboard}
          screenWidth={screenWidth}
        />
      )}
    </ScrollView>
  );
};

// =====================================================
// COMPONENTES DE ABAS
// =====================================================

const OverviewTab: React.FC<{ dashboard: any; screenWidth: number }> = ({
  dashboard,
  screenWidth
}) => {
  if (!dashboard) return null;

  const kpiCards = [
    {
      title: 'Usuários Ativos',
      value: dashboard.summary?.totalUsers || 0,
      icon: Users,
      color: '#6366f1',
      trend: dashboard.kpis?.business?.growthRate || 0
    },
    {
      title: 'Matches Totais',
      value: dashboard.summary?.totalMatches || 0,
      icon: Heart,
      color: '#ec4899',
      trend: dashboard.kpis?.business?.matchSuccessRate || 0
    },
    {
      title: 'Tempo Resposta',
      value: `${dashboard.summary?.averageResponseTime || 0}ms`,
      icon: Clock,
      color: '#10b981',
      trend: dashboard.kpis?.technical?.responseTime || 0
    },
    {
      title: 'Uptime Sistema',
      value: `${dashboard.summary?.systemUptime || 0}%`,
      icon: Activity,
      color: '#f59e0b',
      trend: dashboard.kpis?.technical?.uptime || 0
    }
  ];

  return (
    <View style={styles.tabContent}>
      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        {kpiCards.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            trend={kpi.trend}
          />
        ))}
      </View>

      {/* Trend Chart */}
      {dashboard.trends?.userGrowth && dashboard.trends.userGrowth.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Crescimento de Usuários</Text>
          <LineChart
            data={{
              labels: dashboard.trends.userGrowth.map((_, i) => `D${i + 1}`),
              datasets: [{
                data: dashboard.trends.userGrowth.map((point: any) => point.value || 0)
              }]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>
      )}

      {/* Engagement Chart */}
      {dashboard.trends?.engagement && dashboard.trends.engagement.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Engajamento Diário</Text>
          <BarChart
            data={{
              labels: dashboard.trends.engagement.map((_, i) => `D${i + 1}`),
              datasets: [{
                data: dashboard.trends.engagement.map((point: any) => point.value || 0)
              }]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>
      )}
    </View>
  );
};

const BusinessTab: React.FC<{ metrics: BusinessKPIs; screenWidth: number }> = ({
  metrics,
  screenWidth
}) => {
  if (!metrics) return null;

  return (
    <View style={styles.tabContent}>
      {/* User Growth Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Crescimento de Usuários</Text>
        <View style={styles.metricsGrid}>
          <MetricCard title="Novos Usuários" value={metrics.userGrowth?.newUsers || 0} />
          <MetricCard title="Usuários Ativos" value={metrics.userGrowth?.activeUsers || 0} />
          <MetricCard title="Taxa de Crescimento" value={`${metrics.userGrowth?.growthRate || 0}%`} />
          <MetricCard title="Taxa de Churn" value={`${metrics.userGrowth?.churnRate || 0}%`} />
        </View>
      </View>

      {/* Engagement Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Engajamento</Text>
        <View style={styles.metricsGrid}>
          <MetricCard title="DAU" value={metrics.engagement?.dailyActiveUsers || 0} />
          <MetricCard title="MAU" value={metrics.engagement?.monthlyActiveUsers || 0} />
          <MetricCard title="Sessões/Usuário" value={metrics.engagement?.averageSessionsPerUser?.toFixed(1) || '0'} />
          <MetricCard title="Duração Média" value={`${Math.round(metrics.engagement?.averageTimePerUser || 0)}min`} />
        </View>
      </View>

      {/* Matching Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Matching</Text>
        <View style={styles.metricsGrid}>
          <MetricCard title="Total Matches" value={metrics.matching?.totalMatches || 0} />
          <MetricCard title="Taxa de Sucesso" value={`${metrics.matching?.matchSuccessRate || 0}%`} />
          <MetricCard title="Conversas Iniciadas" value={`${metrics.matching?.conversationStartRate || 0}%`} />
          <MetricCard title="Tempo p/ Primeiro Match" value={`${Math.round(metrics.matching?.timeToFirstMatch || 0)}min`} />
        </View>
      </View>

      {/* Conversion Funnel */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Funil de Conversão</Text>
        <View style={styles.funnelContainer}>
          <FunnelStep label="Visualizações" value={100} isFirst />
          <FunnelStep label="Likes" value={75} />
          <FunnelStep label="Matches" value={45} />
          <FunnelStep label="Conversas" value={25} />
          <FunnelStep label="Encontros" value={10} isLast />
        </View>
      </View>
    </View>
  );
};

const TechnicalTab: React.FC<{ metrics: any; screenWidth: number }> = ({
  metrics,
  screenWidth
}) => {
  if (!metrics) return null;

  return (
    <View style={styles.tabContent}>
      {/* Performance Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.metricsGrid}>
          <MetricCard 
            title="Tempo de Resposta" 
            value={`${metrics.averageResponseTime || 0}ms`}
            status={metrics.averageResponseTime < 500 ? 'good' : metrics.averageResponseTime < 1000 ? 'warning' : 'critical'}
          />
          <MetricCard 
            title="P95 Response Time" 
            value={`${metrics.p95ResponseTime || 0}ms`}
            status={metrics.p95ResponseTime < 1000 ? 'good' : metrics.p95ResponseTime < 2000 ? 'warning' : 'critical'}
          />
          <MetricCard 
            title="Taxa de Erro" 
            value={`${metrics.errorRate || 0}%`}
            status={metrics.errorRate < 1 ? 'good' : metrics.errorRate < 5 ? 'warning' : 'critical'}
          />
          <MetricCard 
            title="Uptime" 
            value={`${metrics.uptime || 0}%`}
            status={metrics.uptime > 99.5 ? 'good' : metrics.uptime > 99 ? 'warning' : 'critical'}
          />
        </View>
      </View>

      {/* System Resources */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Recursos do Sistema</Text>
        <View style={styles.metricsGrid}>
          <MetricCard title="Requisições Totais" value={metrics.totalRequests || 0} />
          <MetricCard title="Erros" value={metrics.errorCount || 0} />
          <MetricCard title="Cache Hit Rate" value={`${metrics.cacheHitRate || 0}%`} />
          <MetricCard title="Throughput" value={`${metrics.throughput || 0}/s`} />
        </View>
      </View>

      {/* Performance Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance ao Longo do Tempo</Text>
        {/* Placeholder para gráfico de performance */}
        <View style={styles.placeholderChart}>
          <Text style={styles.placeholderText}>Gráfico de Performance</Text>
          <Text style={styles.placeholderSubtext}>Dados em tempo real</Text>
        </View>
      </View>
    </View>
  );
};

const RealtimeTab: React.FC<{ dashboard: any; screenWidth: number }> = ({
  dashboard,
  screenWidth
}) => {
  if (!dashboard) return null;

  return (
    <View style={styles.tabContent}>
      {/* System Status */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: dashboard.systemStatus?.healthy ? '#10b981' : '#ef4444' }
        ]} />
        <Text style={styles.statusText}>
          Sistema {dashboard.systemStatus?.healthy ? 'Saudável' : 'Com Problemas'}
        </Text>
        <Text style={styles.statusTimestamp}>
          Última atualização: {new Date(dashboard.timestamp).toLocaleTimeString()}
        </Text>
      </View>

      {/* Live Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Métricas ao Vivo</Text>
        <View style={styles.metricsGrid}>
          <MetricCard 
            title="Eventos/min" 
            value={dashboard.liveMetrics?.eventsPerMinute || 0}
            isLive
          />
          <MetricCard 
            title="Usuários Ativos" 
            value={dashboard.liveMetrics?.activeUsers || 0}
            isLive
          />
          <MetricCard 
            title="Carga do Sistema" 
            value={`${Math.round((dashboard.liveMetrics?.systemLoad || 0) * 100)}%`}
            isLive
          />
          <MetricCard 
            title="Queue Size" 
            value={dashboard.systemStatus?.engine?.queueSize || 0}
            isLive
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        <View style={styles.activityList}>
          {dashboard.recentActivity?.slice(0, 10).map((activity: any, index: number) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Activity size={16} color="#6366f1" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.event_name}</Text>
                <Text style={styles.activitySubtitle}>
                  {activity.count} eventos • {activity.unique_users} usuários únicos
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Active Alerts */}
      {dashboard.activeAlerts && dashboard.activeAlerts.length > 0 && (
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Alertas Ativos</Text>
          <View style={styles.alertsList}>
            {dashboard.activeAlerts.map((alert: any, index: number) => (
              <View key={index} style={[
                styles.alertItem,
                { borderLeftColor: getAlertColor(alert.severity) }
              ]}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.alert_name}</Text>
                  <Text style={[
                    styles.alertSeverity,
                    { color: getAlertColor(alert.severity) }
                  ]}>
                    {alert.severity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.alertValue}>
                  Valor atual: {alert.current_value} (limite: {alert.threshold_value})
                </Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.detected_at).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: number;
}> = ({ title, value, icon: Icon, color, trend }) => (
  <View style={styles.kpiCard}>
    <View style={styles.kpiHeader}>
      <Icon size={20} color={color} />
      {trend !== undefined && (
        <View style={[
          styles.trendContainer,
          { backgroundColor: trend >= 0 ? '#dcfce7' : '#fef2f2' }
        ]}>
          <TrendingUp 
            size={12} 
            color={trend >= 0 ? '#16a34a' : '#dc2626'}
            style={{ transform: [{ rotate: trend >= 0 ? '0deg' : '180deg' }] }}
          />
          <Text style={[
            styles.trendText,
            { color: trend >= 0 ? '#16a34a' : '#dc2626' }
          ]}>
            {Math.abs(trend).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
  </View>
);

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  status?: 'good' | 'warning' | 'critical';
  isLive?: boolean;
}> = ({ title, value, status, isLive }) => (
  <View style={[
    styles.metricCard,
    status && { borderLeftColor: getStatusColor(status) }
  ]}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricTitle}>{title}</Text>
      {isLive && <View style={styles.liveIndicator} />}
    </View>
    <Text style={[
      styles.metricValue,
      status && { color: getStatusColor(status) }
    ]}>
      {value}
    </Text>
  </View>
);

const FunnelStep: React.FC<{
  label: string;
  value: number;
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ label, value, isFirst, isLast }) => (
  <View style={styles.funnelStep}>
    <View style={[
      styles.funnelBar,
      { width: `${value}%` },
      isFirst && styles.funnelBarFirst,
      isLast && styles.funnelBarLast
    ]} />
    <View style={styles.funnelLabel}>
      <Text style={styles.funnelLabelText}>{label}</Text>
      <Text style={styles.funnelValue}>{value}%</Text>
    </View>
  </View>
);

// =====================================================
// UTILITÁRIOS
// =====================================================

const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
  switch (status) {
    case 'good': return '#10b981';
    case 'warning': return '#f59e0b';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

const getAlertColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 8
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#6366f1'
  }
};

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20
  },
  errorText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center'
  },
  errorSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827'
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6'
  },
  timeRangeButtonActive: {
    backgroundColor: '#6366f1'
  },
  timeRangeText: {
    fontSize: 14,
    color: '#6b7280'
  },
  timeRangeTextActive: {
    color: '#ffffff',
    fontWeight: '600'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: '#6366f1'
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280'
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600'
  },
  tabContent: {
    padding: 16
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginRight: '2%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  kpiTitle: {
    fontSize: 12,
    color: '#6b7280'
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
  },
  chart: {
    borderRadius: 8
  },
  placeholderChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280'
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4
  },
  metricsSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginRight: '2%',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  metricTitle: {
    fontSize: 12,
    color: '#6b7280'
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981'
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1
  },
  statusTimestamp: {
    fontSize: 12,
    color: '#6b7280'
  },
  funnelContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16
  },
  funnelStep: {
    marginBottom: 12
  },
  funnelBar: {
    height: 24,
    backgroundColor: '#6366f1',
    borderRadius: 4,
    marginBottom: 4
  },
  funnelBarFirst: {
    backgroundColor: '#3b82f6'
  },
  funnelBarLast: {
    backgroundColor: '#8b5cf6'
  },
  funnelLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  funnelLabelText: {
    fontSize: 12,
    color: '#6b7280'
  },
  funnelValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827'
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827'
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  alertsList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  alertItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderLeftWidth: 4
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827'
  },
  alertSeverity: {
    fontSize: 10,
    fontWeight: '700'
  },
  alertValue: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2
  },
  alertTime: {
    fontSize: 10,
    color: '#9ca3af'
  }
});

export default ExecutiveDashboard;