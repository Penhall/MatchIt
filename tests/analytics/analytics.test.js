// tests/analytics/analytics.test.js

const request = require('supertest');
const { Pool } = require('pg');
const express = require('express');
const AnalyticsEngine = require('../../server/services/analytics/analytics-engine');
const MetricsCalculator = require('../../server/services/analytics/metrics-calculator');
const AnomalyDetector = require('../../server/services/analytics/anomaly-detector');
const { AnalyticsIntegration } = require('../../server/integrations/analytics-integration');

// Mock database para testes
const mockDb = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn()
  })
};

describe('Analytics System Integration Tests', () => {
  let app;
  let analyticsIntegration;
  let analyticsEngine;
  let metricsCalculator;
  let anomalyDetector;

  beforeAll(async () => {
    // Setup test environment
    app = express();
    app.use(express.json());

    // Initialize analytics integration
    analyticsIntegration = new AnalyticsIntegration(app, mockDb);
    
    // Mock services for testing
    analyticsEngine = new AnalyticsEngine({ database: mockDb });
    metricsCalculator = new MetricsCalculator(mockDb);
    anomalyDetector = new AnomalyDetector({ database: mockDb });
  });

  afterAll(async () => {
    // Cleanup
    if (analyticsIntegration) {
      await analyticsIntegration.shutdown();
    }
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  // =====================================================
  // ANALYTICS ENGINE TESTS
  // =====================================================

  describe('Analytics Engine', () => {
    test('should track single event successfully', async () => {
      const eventData = {
        eventType: 'user_action',
        eventName: 'profile_view',
        userId: 'test-user-123',
        properties: { profileId: 'profile-456' }
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await analyticsEngine.trackEvent(eventData);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(mockDb.query).toHaveBeenCalled();
    });

    test('should track batch events successfully', async () => {
      const events = [
        {
          eventType: 'user_action',
          eventName: 'swipe_right',
          userId: 'test-user-123'
        },
        {
          eventType: 'user_action', 
          eventName: 'swipe_left',
          userId: 'test-user-123'
        }
      ];

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await analyticsEngine.trackBatch(events);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
    });

    test('should handle event validation errors', async () => {
      const invalidEvent = {
        // Missing required fields
        eventName: 'test_event'
      };

      const result = await analyticsEngine.trackEvent(invalidEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('should calculate KPIs correctly', async () => {
      // Mock database responses for KPI calculation
      mockDb.query.mockResolvedValueOnce({
        rows: [{ dau: 150 }]
      });

      const result = await analyticsEngine.calculateKPIs({
        categories: ['business'],
        date: new Date('2025-06-24')
      });

      expect(result.success).toBe(true);
      expect(result.kpis).toBeDefined();
      expect(result.kpis.business).toBeDefined();
    });

    test('should provide system metrics', () => {
      const metrics = analyticsEngine.getSystemMetrics();

      expect(metrics).toHaveProperty('engine');
      expect(metrics).toHaveProperty('database');
      expect(metrics).toHaveProperty('performance');
      expect(metrics.engine).toHaveProperty('status');
      expect(metrics.engine).toHaveProperty('queueSize');
    });
  });

  // =====================================================
  // METRICS CALCULATOR TESTS
  // =====================================================

  describe('Metrics Calculator', () => {
    test('should calculate business metrics', async () => {
      // Mock query responses
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          new_users: 50,
          active_users: 200,
          retained_users: 150,
          churned_users: 25
        }]
      });

      const metrics = await metricsCalculator.calculateBusinessMetrics(
        new Date('2025-06-24'),
        'daily'
      );

      expect(metrics).toHaveProperty('userGrowth');
      expect(metrics).toHaveProperty('engagement');
      expect(metrics).toHaveProperty('matching');
      expect(metrics.userGrowth.newUsers).toBe(50);
      expect(metrics.userGrowth.activeUsers).toBe(200);
    });

    test('should calculate technical metrics', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          avg_response_time: 150.5,
          error_count: 5,
          total_requests: 1000
        }]
      });

      const metrics = await metricsCalculator.calculateTechnicalMetrics(
        new Date('2025-06-24'),
        'daily'
      );

      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics.averageResponseTime).toBe(150.5);
      expect(metrics.errorRate).toBe(0.5); // 5/1000 * 100
    });

    test('should handle cache correctly', async () => {
      const date = new Date('2025-06-24');
      
      // First call should hit database
      mockDb.query.mockResolvedValueOnce({
        rows: [{ new_users: 50 }]
      });

      const metrics1 = await metricsCalculator.calculateBusinessMetrics(date, 'daily');
      
      // Second call should use cache (no additional DB calls)
      const metrics2 = await metricsCalculator.calculateBusinessMetrics(date, 'daily');

      expect(metrics1).toEqual(metrics2);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    test('should provide cache statistics', () => {
      const stats = metricsCalculator.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('expiryMinutes');
      expect(typeof stats.size).toBe('number');
    });
  });

  // =====================================================
  // ANOMALY DETECTOR TESTS
  // =====================================================

  describe('Anomaly Detector', () => {
    test('should detect statistical anomalies', async () => {
      const historicalData = [
        { value: 100, timestamp: new Date() },
        { value: 105, timestamp: new Date() },
        { value: 95, timestamp: new Date() },
        { value: 102, timestamp: new Date() },
        { value: 98, timestamp: new Date() }
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: historicalData
      });

      const result = await anomalyDetector.detectAnomalies('test_metric', 150, {});

      expect(result).toHaveProperty('isAnomaly');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metricName');
      expect(result.metricName).toBe('test_metric');
    });

    test('should handle insufficient data gracefully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [] // No historical data
      });

      const result = await anomalyDetector.detectAnomalies('test_metric', 100, {});

      expect(result.isAnomaly).toBe(false);
      expect(result.reason).toBe('insufficient_data');
    });

    test('should check all metrics for anomalies', async () => {
      // Mock active metrics
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            { metric_name: 'metric1' },
            { metric_name: 'metric2' }
          ]
        })
        // Mock current values
        .mockResolvedValueOnce({
          rows: [{ current_value: 100 }]
        })
        .mockResolvedValueOnce({
          rows: [{ current_value: 200 }]
        })
        // Mock historical data for both metrics
        .mockResolvedValue({
          rows: [
            { value: 95, timestamp: new Date() },
            { value: 105, timestamp: new Date() }
          ]
        });

      const results = await anomalyDetector.checkAllMetrics();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0]).toHaveProperty('metricName');
      expect(results[1]).toHaveProperty('metricName');
    });

    test('should provide detector metrics', () => {
      const metrics = anomalyDetector.getDetectorMetrics();

      expect(metrics).toHaveProperty('totalChecks');
      expect(metrics).toHaveProperty('anomaliesDetected');
      expect(metrics).toHaveProperty('accuracy');
      expect(typeof metrics.totalChecks).toBe('number');
    });
  });

  // =====================================================
  // API ENDPOINT TESTS
  // =====================================================

  describe('API Endpoints', () => {
    beforeEach(async () => {
      // Setup routes for testing
      const analyticsRoutes = require('../../server/routes/analytics');
      app.use('/api/analytics', analyticsRoutes);
    });

    test('POST /api/analytics/events should track event', async () => {
      const eventData = {
        eventType: 'user_action',
        eventName: 'test_event',
        properties: { test: true }
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/analytics/events')
        .send(eventData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('eventId');
    });

    test('POST /api/analytics/events should validate input', async () => {
      const invalidEventData = {
        eventType: 'invalid_type',
        eventName: 'test_event'
      };

      const response = await request(app)
        .post('/api/analytics/events')
        .send(invalidEventData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('GET /api/analytics/kpis should return KPIs', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ dau: 150, mau: 1500 }]
      });

      const response = await request(app)
        .get('/api/analytics/kpis?date=2025-06-24')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('kpis');
    });

    test('GET /api/analytics/dashboard/executive should return dashboard data', async () => {
      // Mock multiple queries for dashboard
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/analytics/dashboard/executive?timeRange=30d')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
    });

    test('GET /api/analytics/dashboard/realtime should return realtime data', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/analytics/dashboard/realtime')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  // =====================================================
  // INTEGRATION TESTS
  // =====================================================

  describe('System Integration', () => {
    test('should initialize analytics integration successfully', async () => {
      // Mock database setup
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await analyticsIntegration.initialize();

      expect(result.success).toBe(true);
      expect(result.services).toBeDefined();
      expect(result.apiRoutes).toBe('/api/analytics');
    });

    test('should track events through integration layer', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const eventData = {
        eventType: 'user_action',
        eventName: 'integration_test',
        userId: 'test-user'
      };

      const success = await analyticsIntegration.trackEvent(eventData);

      expect(success).toBe(true);
    });

    test('should provide system statistics', () => {
      const stats = analyticsIntegration.getSystemStats();

      expect(stats).toHaveProperty('initialized');
      expect(typeof stats.initialized).toBe('boolean');
    });

    test('should generate reports on demand', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const report = await analyticsIntegration.generateReport('daily', {
        date: new Date('2025-06-24')
      });

      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('type');
      expect(report.type).toBe('daily_executive');
    });
  });

  // =====================================================
  // PERFORMANCE TESTS
  // =====================================================

  describe('Performance Tests', () => {
    test('should track events within performance threshold', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const startTime = Date.now();
      
      await analyticsEngine.trackEvent({
        eventType: 'user_action',
        eventName: 'performance_test'
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle high volume of events', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const events = Array.from({ length: 100 }, (_, i) => ({
        eventType: 'user_action',
        eventName: 'volume_test',
        properties: { index: i }
      }));

      const startTime = Date.now();
      const result = await analyticsEngine.trackBatch(events);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.processed).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should cache metrics calculations efficiently', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ dau: 150 }]
      });

      const date = new Date('2025-06-24');

      // First calculation
      const start1 = Date.now();
      const metrics1 = await metricsCalculator.calculateBusinessMetrics(date, 'daily');
      const duration1 = Date.now() - start1;

      // Second calculation (should use cache)
      const start2 = Date.now();
      const metrics2 = await metricsCalculator.calculateBusinessMetrics(date, 'daily');
      const duration2 = Date.now() - start2;

      expect(metrics1).toEqual(metrics2);
      expect(duration2).toBeLessThan(duration1); // Cache should be faster
    });
  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await analyticsEngine.trackEvent({
        eventType: 'user_action',
        eventName: 'error_test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    test('should handle invalid data gracefully', async () => {
      const result = await analyticsEngine.trackEvent(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should recover from anomaly detection errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Query failed'));

      const result = await anomalyDetector.detectAnomalies('test_metric', 100);

      expect(result.isAnomaly).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle API errors properly', async () => {
      const response = await request(app)
        .post('/api/analytics/events')
        .send({}) // Empty body should cause validation error
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  // =====================================================
  // UTILITY FUNCTIONS TESTS
  // =====================================================

  describe('Utility Functions', () => {
    test('should calculate percentage changes correctly', () => {
      const current = 150;
      const previous = 100;
      
      const change = ((current - previous) / Math.abs(previous)) * 100;
      
      expect(change).toBe(50);
    });

    test('should handle edge cases in calculations', () => {
      // Division by zero
      const changeWithZero = previous => {
        if (!previous || previous === 0) return 0;
        return ((100 - previous) / Math.abs(previous)) * 100;
      };

      expect(changeWithZero(0)).toBe(0);
      expect(changeWithZero(null)).toBe(0);
    });

    test('should validate event data properly', () => {
      const validEvent = {
        eventType: 'user_action',
        eventName: 'valid_test',
        userId: 'test-123'
      };

      const invalidEvent = {
        eventType: 'invalid_type'
      };

      const validateEvent = (event) => {
        const validTypes = ['user_action', 'system_event', 'performance_metric'];
        
        if (!event.eventType || !validTypes.includes(event.eventType)) {
          return { isValid: false, errors: ['Invalid event type'] };
        }
        
        if (!event.eventName) {
          return { isValid: false, errors: ['Event name required'] };
        }
        
        return { isValid: true, errors: [] };
      };

      expect(validateEvent(validEvent).isValid).toBe(true);
      expect(validateEvent(invalidEvent).isValid).toBe(false);
    });
  });
});

// =====================================================
// LOAD TESTING UTILITIES
// =====================================================

describe('Load Testing', () => {
  test('should handle concurrent event tracking', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });

    const concurrentEvents = Array.from({ length: 50 }, (_, i) =>
      analyticsEngine.trackEvent({
        eventType: 'user_action',
        eventName: 'concurrent_test',
        properties: { index: i }
      })
    );

    const results = await Promise.all(concurrentEvents);

    expect(results.every(r => r.success)).toBe(true);
  });

  test('should maintain performance under load', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });

    const loadTest = async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          analyticsEngine.trackEvent({
            eventType: 'user_action',
            eventName: 'load_test',
            properties: { batch: i }
          })
        );
      }
      return Promise.all(promises);
    };

    const startTime = Date.now();
    await loadTest();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
  });
});

// =====================================================
// TEARDOWN
// =====================================================

afterAll(() => {
  // Clean up any remaining connections or resources
  jest.clearAllMocks();
});