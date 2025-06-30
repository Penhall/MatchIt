-- server/migrations/003_analytics_schema.sql

-- =====================================================
-- ANALYTICS CORE TABLES
-- =====================================================

-- Tabela principal de eventos granulares
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    event_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    
    -- Dados do evento
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_properties JSONB,
    
    -- Contexto temporal
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_timezone VARCHAR(50),
    
    -- Contexto técnico
    device_info JSONB,
    app_version VARCHAR(20),
    platform_version VARCHAR(50),
    
    -- Localização e rede
    location_info JSONB,
    network_info JSONB,
    
    -- Metadados
    source VARCHAR(50) DEFAULT 'mobile_app',
    environment VARCHAR(20) DEFAULT 'production',
    experiment_groups TEXT[],
    
    -- Indices de performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'user_action', 'system_event', 'performance_metric', 'business_metric',
        'error_event', 'recommendation_event', 'conversion_event', 
        'engagement_event', 'retention_event', 'monetization_event'
    )),
    CONSTRAINT valid_source CHECK (source IN (
        'mobile_app', 'web_app', 'desktop_app', 'api', 'background_job', 'admin_panel', 'external_service'
    ))
);

-- Tabela de agregações pré-calculadas
CREATE TABLE IF NOT EXISTS analytics_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação da agregação
    aggregation_type VARCHAR(50) NOT NULL, -- 'daily', 'hourly', 'weekly', 'monthly'
    metric_name VARCHAR(100) NOT NULL,
    dimension_values JSONB, -- {'user_segment': 'premium', 'country': 'BR'}
    
    -- Período
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Valores calculados
    metric_value DECIMAL(15,4),
    count_value BIGINT,
    sum_value DECIMAL(15,4),
    avg_value DECIMAL(10,4),
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    
    -- Metadados
    calculation_method VARCHAR(50), -- 'real_time', 'batch', 'manual'
    data_quality_score DECIMAL(3,2), -- 0.00 to 1.00
    sample_size BIGINT,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(aggregation_type, metric_name, dimension_values, period_start)
);

-- Tabela de KPIs principais
CREATE TABLE IF NOT EXISTS analytics_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    kpi_name VARCHAR(100) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL, -- 'business', 'technical', 'product'
    kpi_subcategory VARCHAR(50),
    
    -- Período
    date DATE NOT NULL,
    time_granularity VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'
    
    -- Valores
    current_value DECIMAL(15,4) NOT NULL,
    previous_value DECIMAL(15,4),
    target_value DECIMAL(15,4),
    benchmark_value DECIMAL(15,4),
    
    -- Cálculos derivados
    change_absolute DECIMAL(15,4),
    change_percentage DECIMAL(8,2),
    performance_vs_target DECIMAL(8,2),
    performance_vs_benchmark DECIMAL(8,2),
    
    -- Qualidade e confiabilidade
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    data_freshness_minutes INTEGER DEFAULT 0,
    calculation_notes TEXT,
    
    -- Segmentação
    segment_filters JSONB,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(kpi_name, date, time_granularity, segment_filters),
    CONSTRAINT valid_kpi_category CHECK (kpi_category IN ('business', 'technical', 'product')),
    CONSTRAINT valid_confidence CHECK (confidence_score BETWEEN 0.00 AND 1.00)
);

-- Tabela de alertas e anomalias
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    alert_name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'anomaly', 'trend', 'custom'
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Condições
    metric_name VARCHAR(100) NOT NULL,
    condition_type VARCHAR(50) NOT NULL, -- 'greater_than', 'less_than', 'change_percentage', 'anomaly_score'
    threshold_value DECIMAL(15,4),
    
    -- Valores atuais
    current_value DECIMAL(15,4) NOT NULL,
    previous_value DECIMAL(15,4),
    anomaly_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'suppressed'
    
    -- Detalhes
    alert_message TEXT NOT NULL,
    context_data JSONB,
    recommended_actions TEXT[],
    
    -- Responsáveis
    assigned_to VARCHAR(100),
    priority_score INTEGER DEFAULT 50, -- 1-100
    
    -- Timestamps
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_alert_type CHECK (alert_type IN ('threshold', 'anomaly', 'trend', 'custom')),
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    CONSTRAINT valid_anomaly_score CHECK (anomaly_score IS NULL OR anomaly_score BETWEEN 0.00 AND 1.00)
);

-- Tabela de configurações de métricas
CREATE TABLE IF NOT EXISTS analytics_metric_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    metric_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    
    -- Configuração de cálculo
    calculation_method VARCHAR(100) NOT NULL, -- 'sum', 'avg', 'count', 'ratio', 'custom'
    calculation_query TEXT,
    refresh_interval_minutes INTEGER DEFAULT 60,
    
    -- Configuração de exibição
    unit VARCHAR(20), -- '%', '$', 'users', 'sessions', etc.
    decimal_places INTEGER DEFAULT 2,
    format_type VARCHAR(20) DEFAULT 'number', -- 'number', 'percentage', 'currency', 'duration'
    
    -- Limites e alertas
    min_expected_value DECIMAL(15,4),
    max_expected_value DECIMAL(15,4),
    alert_thresholds JSONB, -- {'warning': 100, 'critical': 200}
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_realtime BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    owner VARCHAR(100),
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Eventos - índices principais
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_timestamp 
    ON analytics_events(user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_timestamp 
    ON analytics_events(event_type, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_session_timestamp 
    ON analytics_events(session_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_timestamp_only 
    ON analytics_events(timestamp DESC);

-- Eventos - índices para análises
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_properties_gin 
    ON analytics_events USING GIN(event_properties);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_device_gin 
    ON analytics_events USING GIN(device_info);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_location_gin 
    ON analytics_events USING GIN(location_info);

-- Agregações - índices principais
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_aggregations_metric_period 
    ON analytics_aggregations(metric_name, period_start DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_aggregations_type_period 
    ON analytics_aggregations(aggregation_type, period_start DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_aggregations_dimensions_gin 
    ON analytics_aggregations USING GIN(dimension_values);

-- KPIs - índices principais
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_kpis_name_date 
    ON analytics_kpis(kpi_name, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_kpis_category_date 
    ON analytics_kpis(kpi_category, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_kpis_calculated_at 
    ON analytics_kpis(calculated_at DESC);

-- Alertas - índices principais
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_alerts_status_severity 
    ON analytics_alerts(status, severity, detected_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_alerts_metric_detected 
    ON analytics_alerts(metric_name, detected_at DESC);

-- =====================================================
-- VIEWS PARA CONSULTAS FREQUENTES
-- =====================================================

-- View de eventos recentes (últimas 24 horas)
CREATE OR REPLACE VIEW recent_analytics_events AS
SELECT 
    event_type,
    event_name,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(timestamp) as first_occurrence,
    MAX(timestamp) as last_occurrence
FROM analytics_events 
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type, event_name
ORDER BY event_count DESC;

-- View de KPIs principais
CREATE OR REPLACE VIEW current_business_kpis AS
SELECT 
    kpi_name,
    kpi_category,
    current_value,
    target_value,
    change_percentage,
    performance_vs_target,
    confidence_score,
    calculated_at
FROM analytics_kpis 
WHERE date = CURRENT_DATE 
    AND time_granularity = 'daily'
    AND kpi_category = 'business'
ORDER BY kpi_name;

-- View de alertas ativos
CREATE OR REPLACE VIEW active_analytics_alerts AS
SELECT 
    alert_name,
    severity,
    metric_name,
    current_value,
    threshold_value,
    alert_message,
    detected_at,
    priority_score
FROM analytics_alerts 
WHERE status = 'active'
ORDER BY severity DESC, priority_score DESC, detected_at DESC;

-- View de performance do sistema
CREATE OR REPLACE VIEW system_performance_summary AS
SELECT 
    DATE(calculated_at) as date,
    AVG(CASE WHEN kpi_name = 'api_response_time' THEN current_value END) as avg_response_time,
    AVG(CASE WHEN kpi_name = 'error_rate' THEN current_value END) as avg_error_rate,
    AVG(CASE WHEN kpi_name = 'uptime_percentage' THEN current_value END) as avg_uptime,
    COUNT(CASE WHEN kpi_category = 'technical' THEN 1 END) as technical_metrics_count
FROM analytics_kpis
WHERE kpi_category = 'technical' 
    AND calculated_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(calculated_at)
ORDER BY date DESC;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular crescimento percentual
CREATE OR REPLACE FUNCTION calculate_growth_percentage(current_val DECIMAL, previous_val DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF previous_val = 0 OR previous_val IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(((current_val - previous_val) / ABS(previous_val)) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para determinar status de performance
CREATE OR REPLACE FUNCTION get_performance_status(current_val DECIMAL, target_val DECIMAL, tolerance DECIMAL DEFAULT 0.05)
RETURNS TEXT AS $$
DECLARE
    difference_ratio DECIMAL;
BEGIN
    IF target_val = 0 OR target_val IS NULL THEN
        RETURN 'unknown';
    END IF;
    
    difference_ratio = ABS(current_val - target_val) / ABS(target_val);
    
    IF difference_ratio <= tolerance THEN
        RETURN 'on_target';
    ELSIF current_val > target_val THEN
        RETURN 'above_target';
    ELSE
        RETURN 'below_target';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para limpar dados antigos (manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Limpar eventos mais antigos que 90 dias
    DELETE FROM analytics_events 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar agregações mais antigas que 1 ano
    DELETE FROM analytics_aggregations 
    WHERE period_start < NOW() - INTERVAL '1 year';
    
    -- Limpar alertas resolvidos mais antigos que 30 dias
    DELETE FROM analytics_alerts 
    WHERE status = 'resolved' 
        AND resolved_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar timestamp de modificação
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas que precisam
CREATE TRIGGER trigger_analytics_metric_configs_updated_at
    BEFORE UPDATE ON analytics_metric_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp();

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE analytics_events IS 'Tabela principal para armazenar todos os eventos de analytics do sistema';
COMMENT ON TABLE analytics_aggregations IS 'Dados pré-agregados para consultas rápidas de métricas';
COMMENT ON TABLE analytics_kpis IS 'KPIs principais do negócio, técnicos e de produto';
COMMENT ON TABLE analytics_alerts IS 'Sistema de alertas e detecção de anomalias';
COMMENT ON TABLE analytics_metric_configs IS 'Configurações de métricas e seus parâmetros de cálculo';

COMMENT ON COLUMN analytics_events.event_properties IS 'Propriedades específicas do evento em formato JSON';
COMMENT ON COLUMN analytics_events.device_info IS 'Informações do dispositivo (tipo, OS, versão, etc.)';
COMMENT ON COLUMN analytics_events.location_info IS 'Dados de localização (país, região, cidade, coordenadas)';
COMMENT ON COLUMN analytics_events.network_info IS 'Informações de rede (tipo de conexão, velocidade, etc.)';

COMMENT ON COLUMN analytics_kpis.confidence_score IS 'Score de confiabilidade do dado (0.00 a 1.00)';
COMMENT ON COLUMN analytics_kpis.data_freshness_minutes IS 'Idade do dado em minutos';
COMMENT ON COLUMN analytics_kpis.segment_filters IS 'Filtros de segmentação aplicados ao KPI';

-- =====================================================
-- DADOS INICIAIS DE CONFIGURAÇÃO
-- =====================================================

-- Configurações de métricas básicas
INSERT INTO analytics_metric_configs (
    metric_name, display_name, description, category, calculation_method, unit, format_type
) VALUES 
('daily_active_users', 'Daily Active Users', 'Número de usuários únicos ativos por dia', 'business', 'count', 'users', 'number'),
('monthly_active_users', 'Monthly Active Users', 'Número de usuários únicos ativos por mês', 'business', 'count', 'users', 'number'),
('session_duration_avg', 'Duração Média da Sessão', 'Tempo médio de duração das sessões', 'product', 'avg', 'minutes', 'duration'),
('match_success_rate', 'Taxa de Sucesso de Match', 'Percentual de likes que viram matches', 'business', 'ratio', '%', 'percentage'),
('api_response_time', 'Tempo de Resposta da API', 'Tempo médio de resposta da API', 'technical', 'avg', 'ms', 'number'),
('error_rate', 'Taxa de Erro', 'Percentual de requisições com erro', 'technical', 'ratio', '%', 'percentage'),
('user_retention_7d', 'Retenção 7 dias', 'Percentual de usuários que retornam em 7 dias', 'business', 'ratio', '%', 'percentage'),
('conversation_start_rate', 'Taxa de Início de Conversa', 'Percentual de matches que iniciam conversa', 'business', 'ratio', '%', 'percentage')
ON CONFLICT (metric_name) DO NOTHING;

-- Commit das alterações
COMMIT;