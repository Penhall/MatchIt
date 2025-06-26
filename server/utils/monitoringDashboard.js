// server/utils/monitoringDashboard.js - Sistema de monitoramento em tempo real
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const os = require('os');
const { performance } = require('perf_hooks');

class MonitoringDashboard extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      system: {
        startTime: Date.now(),
        uptime: 0,
        memory: {},
        cpu: {},
        disk: {},
        network: {}
      },
      application: {
        requests: {
          total: 0,
          success: 0,
          errors: 0,
          average_response_time: 0,
          requests_per_minute: 0
        },
        tournaments: {
          active: 0,
          completed_today: 0,
          total_choices_today: 0,
          average_session_duration: 0
        },
        users: {
          online: 0,
          registered_today: 0,
          total_users: 0
        },
        database: {
          connections: 0,
          slow_queries: 0,
          average_query_time: 0
        },
        cache: {
          hit_rate: 0,
          memory_usage: 0,
          total_keys: 0
        }
      },
      alerts: [],
      performance: {
        memory_leaks: [],
        slow_endpoints: [],
        error_patterns: []
      }
    };

    this.clients = new Set();
    this.intervals = new Map();
    this.requestTimes = [];
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitoramento de sistema a cada 5 segundos
    this.intervals.set('system', setInterval(() => {
      this.updateSystemMetrics();
    }, 5000));

    // Monitoramento de aplicação a cada 10 segundos
    this.intervals.set('application', setInterval(() => {
      this.updateApplicationMetrics();
    }, 10000));

    // Verificação de alertas a cada 30 segundos
    this.intervals.set('alerts', setInterval(() => {
      this.checkAlerts();
    }, 30000));

    // Limpeza de dados antigos a cada hora
    this.intervals.set('cleanup', setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000));
  }

  updateSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.system = {
      startTime: this.metrics.system.startTime,
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        usage_percentage: this.calculateCPUUsage()
      },
      disk: this.getDiskUsage(),
      network: this.getNetworkStats()
    };

    this.broadcastUpdate('system', this.metrics.system);
  }

  calculateCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~(100 * totalIdle / totalTick);
  }

  getDiskUsage() {
    try {
      const stats = require('fs').statSync('.');
      return {
        free: stats.free || 0,
        used: stats.used || 0,
        total: stats.total || 0
      };
    } catch (error) {
      return { free: 0, used: 0, total: 0 };
    }
  }

  getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    let totalBytesReceived = 0;
    let totalBytesSent = 0;

    Object.values(networkInterfaces).forEach(interfaces => {
      interfaces.forEach(iface => {
        if (!iface.internal) {
          totalBytesReceived += iface.bytesReceived || 0;
          totalBytesSent += iface.bytesSent || 0;
        }
      });
    });

    return {
      bytesReceived: totalBytesReceived,
      bytesSent: totalBytesSent
    };
  }

  async updateApplicationMetrics() {
    try {
      // Atualizar métricas de requisições
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      const recentRequests = this.requestTimes.filter(time => time > oneMinuteAgo);
      
      this.metrics.application.requests.requests_per_minute = recentRequests.length;

      // Buscar dados do banco de dados (se disponível)
      if (global.pool) {
        await this.updateDatabaseMetrics();
        await this.updateTournamentMetrics();
        await this.updateUserMetrics();
      }

      // Atualizar métricas de cache (Redis)
      if (global.redisClient) {
        await this.updateCacheMetrics();
      }

      this.broadcastUpdate('application', this.metrics.application);
    } catch (error) {
      console.error('Erro ao atualizar métricas da aplicação:', error);
    }
  }

  async updateDatabaseMetrics() {
    try {
      const poolInfo = global.pool.totalCount ? {
        total: global.pool.totalCount,
        idle: global.pool.idleCount,
        waiting: global.pool.waitingCount
      } : { total: 0, idle: 0, waiting: 0 };

      this.metrics.application.database.connections = poolInfo.total;
    } catch (error) {
      console.error('Erro ao buscar métricas do banco:', error);
    }
  }

  async updateTournamentMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const activeTournaments = await global.pool.query(
        "SELECT COUNT(*) as count FROM tournament_sessions WHERE status = 'active'"
      );
      
      const completedToday = await global.pool.query(
        "SELECT COUNT(*) as count FROM tournament_results WHERE DATE(completed_at) = $1",
        [today]
      );
      
      const choicesToday = await global.pool.query(
        "SELECT COUNT(*) as count FROM tournament_choices WHERE DATE(choice_made_at) = $1",
        [today]
      );

      this.metrics.application.tournaments = {
        active: parseInt(activeTournaments.rows[0].count),
        completed_today: parseInt(completedToday.rows[0].count),
        total_choices_today: parseInt(choicesToday.rows[0].count),
        average_session_duration: await this.calculateAverageSessionDuration()
      };
    } catch (error) {
      console.error('Erro ao buscar métricas de torneio:', error);
    }
  }

  async updateUserMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const totalUsers = await global.pool.query(
        "SELECT COUNT(*) as count FROM users"
      );
      
      const registeredToday = await global.pool.query(
        "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = $1",
        [today]
      );

      this.metrics.application.users = {
        online: this.getOnlineUsersCount(),
        registered_today: parseInt(registeredToday.rows[0].count),
        total_users: parseInt(totalUsers.rows[0].count)
      };
    } catch (error) {
      console.error('Erro ao buscar métricas de usuário:', error);
    }
  }

  async updateCacheMetrics() {
    try {
      if (global.redisClient && global.redisClient.isReady) {
        const info = await global.redisClient.info('memory');
        const keyspace = await global.redisClient.info('keyspace');
        
        this.metrics.application.cache = {
          hit_rate: this.calculateCacheHitRate(),
          memory_usage: this.parseCacheMemoryUsage(info),
          total_keys: this.parseCacheKeyCount(keyspace)
        };
      }
    } catch (error) {
      console.error('Erro ao buscar métricas de cache:', error);
    }
  }

  async calculateAverageSessionDuration() {
    try {
      const result = await global.pool.query(
        "SELECT AVG(session_duration_minutes) as avg FROM tournament_results WHERE completed_at > NOW() - INTERVAL '24 hours'"
      );
      
      return parseFloat(result.rows[0].avg) || 0;
    } catch (error) {
      return 0;
    }
  }

  getOnlineUsersCount() {
    // Implementar lógica para contar usuários online
    // Por exemplo, usando WebSocket connections ou sessões ativas
    return this.clients.size;
  }

  calculateCacheHitRate() {
    // Implementar cálculo de hit rate do cache
    // Por ora, retornar valor simulado
    return Math.random() * 100;
  }

  parseCacheMemoryUsage(info) {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  parseCacheKeyCount(keyspace) {
    const match = keyspace.match(/keys=(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  recordRequest(responseTime, success = true) {
    const now = Date.now();
    this.requestTimes.push(now);
    
    // Manter apenas últimos 1000 requests
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }

    this.metrics.application.requests.total++;
    
    if (success) {
      this.metrics.application.requests.success++;
    } else {
      this.metrics.application.requests.errors++;
    }

    // Calcular tempo médio de resposta
    const recentTimes = this.requestTimes.slice(-100); // Últimas 100 requisições
    this.metrics.application.requests.average_response_time = 
      recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;

    // Detectar endpoints lentos
    if (responseTime > 2000) {
      this.recordSlowEndpoint(responseTime);
    }
  }

  recordSlowEndpoint(responseTime) {
    this.metrics.performance.slow_endpoints.push({
      timestamp: Date.now(),
      responseTime,
      threshold: 2000
    });

    // Manter apenas últimos 50 endpoints lentos
    if (this.metrics.performance.slow_endpoints.length > 50) {
      this.metrics.performance.slow_endpoints.shift();
    }
  }

  checkAlerts() {
    const alerts = [];

    // Verificar uso de memória
    if (this.metrics.system.memory.percentage > 85) {
      alerts.push({
        type: 'memory_high',
        severity: 'warning',
        message: `Uso de memória alto: ${this.metrics.system.memory.percentage.toFixed(1)}%`,
        timestamp: Date.now()
      });
    }

    // Verificar CPU
    if (this.metrics.system.cpu.usage_percentage > 80) {
      alerts.push({
        type: 'cpu_high',
        severity: 'warning',
        message: `Uso de CPU alto: ${this.metrics.system.cpu.usage_percentage.toFixed(1)}%`,
        timestamp: Date.now()
      });
    }

    // Verificar taxa de erro
    const errorRate = this.calculateErrorRate();
    if (errorRate > 5) {
      alerts.push({
        type: 'error_rate_high',
        severity: 'critical',
        message: `Taxa de erro alta: ${errorRate.toFixed(1)}%`,
        timestamp: Date.now()
      });
    }

    // Verificar tempo de resposta
    if (this.metrics.application.requests.average_response_time > 2000) {
      alerts.push({
        type: 'response_time_slow',
        severity: 'warning',
        message: `Tempo de resposta lento: ${this.metrics.application.requests.average_response_time.toFixed(0)}ms`,
        timestamp: Date.now()
      });
    }

    // Adicionar novos alertas
    alerts.forEach(alert => {
      this.addAlert(alert);
    });
  }

  calculateErrorRate() {
    const total = this.metrics.application.requests.total;
    const errors = this.metrics.application.requests.errors;
    return total > 0 ? (errors / total) * 100 : 0;
  }

  addAlert(alert) {
    this.metrics.alerts.push(alert);
    
    // Manter apenas últimos 100 alertas
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts.shift();
    }

    this.broadcastUpdate('alert', alert);
    
    // Emitir evento para sistemas externos
    this.emit('alert', alert);
  }

  cleanupOldData() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    // Limpar tempos de requisição antigos
    this.requestTimes = this.requestTimes.filter(time => time > oneHourAgo);
    
    // Limpar alertas antigos
    this.metrics.alerts = this.metrics.alerts.filter(alert => 
      alert.timestamp > oneHourAgo
    );
    
    // Limpar endpoints lentos antigos
    this.metrics.performance.slow_endpoints = 
      this.metrics.performance.slow_endpoints.filter(endpoint => 
        endpoint.timestamp > oneHourAgo
      );
  }

  // WebSocket para dashboard em tempo real
  setupWebSocket(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      console.log('Cliente de monitoramento conectado:', req.socket.remoteAddress);
      
      this.clients.add(ws);
      
      // Enviar dados iniciais
      ws.send(JSON.stringify({
        type: 'init',
        data: this.getAllMetrics()
      }));
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('Cliente de monitoramento desconectado');
      });
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Erro ao processar mensagem do cliente:', error);
        }
      });
    });
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'get_metrics':
        ws.send(JSON.stringify({
          type: 'metrics',
          data: this.getAllMetrics()
        }));
        break;
        
      case 'get_alerts':
        ws.send(JSON.stringify({
          type: 'alerts',
          data: this.metrics.alerts
        }));
        break;
        
      case 'clear_alerts':
        this.metrics.alerts = [];
        this.broadcastUpdate('alerts_cleared', {});
        break;
    }
  }

  broadcastUpdate(type, data) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getAllMetrics() {
    return {
      system: this.metrics.system,
      application: this.metrics.application,
      alerts: this.metrics.alerts,
      performance: this.metrics.performance,
      timestamp: Date.now()
    };
  }

  // Endpoint HTTP para métricas
  getMetricsEndpoint() {
    return (req, res) => {
      res.json({
        success: true,
        data: this.getAllMetrics()
      });
    };
  }

  // Endpoint para dashboard HTML
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MatchIt - Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            background: #f5f5f5; 
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px;
        }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin-bottom: 20px;
        }
        .metric-card { 
            background: white; 
            border-radius: 8px; 
            padding: 20px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-title { 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 15px; 
            color: #666;
        }
        .metric-value { 
            font-size: 32px; 
            font-weight: 700; 
            margin-bottom: 5px;
        }
        .metric-label { 
            font-size: 14px; 
            color: #999;
        }
        .status-indicator { 
            display: inline-block; 
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
            margin-right: 8px;
        }
        .status-healthy { background: #10B981; }
        .status-warning { background: #F59E0B; }
        .status-critical { background: #EF4444; }
        .alerts-container { 
            background: white; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
        }
        .alert { 
            padding: 12px; 
            border-radius: 6px; 
            margin-bottom: 10px; 
            border-left: 4px solid;
        }
        .alert-warning { 
            background: #FEF3C7; 
            border-color: #F59E0B; 
            color: #92400E;
        }
        .alert-critical { 
            background: #FEE2E2; 
            border-color: #EF4444; 
            color: #991B1B;
        }
        .chart-container { 
            background: white; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
        }
        .refresh-button {
            background: #10B981;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 MatchIt - Dashboard de Monitoramento</h1>
            <p>Sistema de monitoramento em tempo real - Fases 0 e 1</p>
        </div>

        <button class="refresh-button" onclick="location.reload()">🔄 Atualizar</button>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">🖥️ Sistema</div>
                <div class="metric-value" id="uptime">--</div>
                <div class="metric-label">Tempo ativo</div>
                <div style="margin-top: 10px;">
                    <span class="status-indicator" id="system-status"></span>
                    <span id="system-status-text">Verificando...</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-title">📊 Requisições</div>
                <div class="metric-value" id="requests-total">--</div>
                <div class="metric-label">Total hoje</div>
                <div style="margin-top: 10px;">
                    <span id="requests-rpm">-- req/min</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-title">🏆 Torneios</div>
                <div class="metric-value" id="tournaments-active">--</div>
                <div class="metric-label">Ativos agora</div>
                <div style="margin-top: 10px;">
                    <span id="tournaments-completed">-- concluídos hoje</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-title">👥 Usuários</div>
                <div class="metric-value" id="users-online">--</div>
                <div class="metric-label">Online agora</div>
                <div style="margin-top: 10px;">
                    <span id="users-registered">-- registros hoje</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-title">💾 Memória</div>
                <div class="metric-value" id="memory-percentage">--%</div>
                <div class="metric-label">Uso de memória</div>
                <div style="margin-top: 10px;">
                    <span id="memory-used">-- MB usado</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-title">⚡ Performance</div>
                <div class="metric-value" id="response-time">--ms</div>
                <div class="metric-label">Tempo médio de resposta</div>
                <div style="margin-top: 10px;">
                    <span id="error-rate">--% erros</span>
                </div>
            </div>
        </div>

        <div class="alerts-container">
            <h2>🚨 Alertas Ativos</h2>
            <div id="alerts-list">
                <p>Nenhum alerta ativo</p>
            </div>
        </div>

        <div class="chart-container">
            <h2>📈 Gráfico de Requisições</h2>
            <canvas id="requestsChart" width="400" height="200"></canvas>
        </div>
    </div>

    <script>
        let ws;
        let requestsChart;

        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:3000/monitoring');
            
            ws.onopen = function() {
                console.log('Conectado ao sistema de monitoramento');
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                updateDashboard(data);
            };
            
            ws.onclose = function() {
                console.log('Conexão perdida, tentando reconectar...');
                setTimeout(connectWebSocket, 5000);
            };
        }

        function updateDashboard(data) {
            if (data.type === 'init' || data.type === 'system') {
                updateSystemMetrics(data.data.system || data.data);
            }
            
            if (data.type === 'init' || data.type === 'application') {
                updateApplicationMetrics(data.data.application || data.data);
            }
            
            if (data.type === 'alert') {
                addAlert(data.data);
            }
        }

        function updateSystemMetrics(system) {
            document.getElementById('uptime').textContent = formatUptime(system.uptime);
            
            if (system.memory) {
                document.getElementById('memory-percentage').textContent = 
                    system.memory.percentage.toFixed(1) + '%';
                document.getElementById('memory-used').textContent = 
                    (system.memory.used / 1024 / 1024).toFixed(1) + ' MB usado';
                
                const memoryStatus = system.memory.percentage > 85 ? 'critical' : 
                                   system.memory.percentage > 70 ? 'warning' : 'healthy';
                document.getElementById('system-status').className = 
                    'status-indicator status-' + memoryStatus;
                document.getElementById('system-status-text').textContent = 
                    memoryStatus === 'healthy' ? 'Saudável' : 
                    memoryStatus === 'warning' ? 'Atenção' : 'Crítico';
            }
        }

        function updateApplicationMetrics(app) {
            if (app.requests) {
                document.getElementById('requests-total').textContent = app.requests.total;
                document.getElementById('requests-rpm').textContent = 
                    app.requests.requests_per_minute + ' req/min';
                document.getElementById('response-time').textContent = 
                    app.requests.average_response_time.toFixed(0) + 'ms';
                
                const errorRate = app.requests.total > 0 ? 
                    (app.requests.errors / app.requests.total) * 100 : 0;
                document.getElementById('error-rate').textContent = 
                    errorRate.toFixed(1) + '% erros';
            }
            
            if (app.tournaments) {
                document.getElementById('tournaments-active').textContent = app.tournaments.active;
                document.getElementById('tournaments-completed').textContent = 
                    app.tournaments.completed_today + ' concluídos hoje';
            }
            
            if (app.users) {
                document.getElementById('users-online').textContent = app.users.online;
                document.getElementById('users-registered').textContent = 
                    app.users.registered_today + ' registros hoje';
            }
        }

        function addAlert(alert) {
            const alertsList = document.getElementById('alerts-list');
            if (alertsList.children.length === 1 && 
                alertsList.children[0].textContent === 'Nenhum alerta ativo') {
                alertsList.innerHTML = '';
            }
            
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-' + alert.severity;
            alertDiv.innerHTML = 
                '<strong>' + new Date(alert.timestamp).toLocaleTimeString() + '</strong> - ' + 
                alert.message;
            
            alertsList.insertBefore(alertDiv, alertsList.firstChild);
            
            // Manter apenas últimos 10 alertas
            while (alertsList.children.length > 10) {
                alertsList.removeChild(alertsList.lastChild);
            }
        }

        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            
            if (days > 0) return days + 'd ' + hours + 'h';
            if (hours > 0) return hours + 'h ' + minutes + 'm';
            return minutes + 'm';
        }

        function initChart() {
            const ctx = document.getElementById('requestsChart').getContext('2d');
            requestsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Requisições por Minuto',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Inicializar dashboard
        connectWebSocket();
        initChart();
        
        // Atualizar a cada 5 segundos se WebSocket não estiver conectado
        setInterval(function() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                fetch('/api/monitoring/metrics')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            updateDashboard({ type: 'init', data: data.data });
                        }
                    })
                    .catch(console.error);
            }
        }, 5000);
    </script>
</body>
</html>
    `;
  }

  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    if (this.wss) {
      this.wss.close();
    }
  }
}

module.exports = MonitoringDashboard;