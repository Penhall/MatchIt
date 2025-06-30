import request from 'supertest';
import app from '../app';
import { pool } from '../db';

describe('Recommendation Routes - Emotional Module Integration', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM emotional_states');
    await pool.query('DELETE FROM algorithm_weights');
    await pool.query('INSERT INTO users (id, username) VALUES (1, \'testuser\') ON CONFLICT DO NOTHING');
  });

  describe('Full Emotional Analysis Flow', () => {
    it('should complete full emotional analysis flow with impact on weights', async () => {
      // 1. Register emotional state
      const registerResponse = await request(app)
        .post('/emotional/feedback')
        .send({
          userId: 1,
          valence: 0.7,
          arousal: 0.5,
          dominance: 0.8,
          source: 'self_report'
        })
        .expect(200);

      // 2. Verify emotional profile was updated
      const profileResponse = await request(app)
        .get('/emotional/profile/1')
        .expect(200);

      expect(profileResponse.body.current_state.valence).toBe(0.7);

      // 3. Verify weights were adjusted (positive valence should increase content weight)
      const weightsResponse = await request(app)
        .get('/recommendations/weights/1')
        .expect(200);

      expect(weightsResponse.body.contentWeight).toBeGreaterThan(weightsResponse.body.collaborativeWeight);
    });

    it('should use user_emotional_profile view for recommendations', async () => {
      // Insert test data that will be aggregated by the view
      await pool.query(`
        INSERT INTO emotional_states
        (user_id, valence, arousal, dominance, timestamp, source)
        VALUES
        (1, 0.7, 0.5, 0.8, NOW(), 'self_report'),
        (1, 0.6, 0.4, 0.7, NOW() - INTERVAL '1 day', 'self_report'),
        (1, 0.8, 0.6, 0.9, NOW() - INTERVAL '2 days', 'self_report')
      `);

      // Verify view returns correct aggregated data
      const viewResult = await pool.query('SELECT * FROM user_emotional_profile WHERE user_id = 1');
      expect(viewResult.rows[0].avg_valence).toBeCloseTo(0.7);
      expect(viewResult.rows[0].valence_trend).toBe('more_positive');
    });
  });

  describe('Performance Validation', () => {
    it('should respond within 50ms for emotional profile requests', async () => {
      // Warm up cache
      await request(app).get('/emotional/profile/1');

      const start = Date.now();
      await request(app)
        .get('/emotional/profile/1')
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Cache Validation', () => {
    it('should cache emotional profile data', async () => {
      // First request (uncached)
      const firstRequestStart = Date.now();
      await request(app)
        .get('/emotional/profile/1')
        .expect(200);
      const firstRequestDuration = Date.now() - firstRequestStart;

      // Second request (cached)
      const secondRequestStart = Date.now();
      await request(app)
        .get('/emotional/profile/1')
        .expect(200);
      const secondRequestDuration = Date.now() - secondRequestStart;

      expect(secondRequestDuration).toBeLessThan(firstRequestDuration / 2);
    });

    it('should invalidate cache when new emotional state is recorded', async () => {
      // Warm up cache
      await request(app).get('/emotional/profile/1');

      const cachedResponse = await request(app)
        .get('/emotional/profile/1');

      // Record new state
      await request(app)
        .post('/emotional/feedback')
        .send({
          userId: 1,
          valence: 0.5,
          arousal: 0.5,
          dominance: 0.5
        });

      const freshResponse = await request(app)
        .get('/emotional/profile/1');

      expect(freshResponse.body.current_state.valence).not.toBe(cachedResponse.body.current_state?.valence);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with old emotional state format', async () => {
      const response = await request(app)
        .post('/emotional-states')
        .send({
          userId: 1,
          valence: 0.7,
          arousal: 0.5,
          dominance: 0.8,
          source: 'legacy_system'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Performance Metrics', () => {
    it('should include performance metrics in test results', async () => {
      const testCount = 10;
      let totalDuration = 0;

      for (let i = 0; i < testCount; i++) {
        const start = Date.now();
        await request(app)
          .get('/emotional/profile/1')
          .expect(200);
        totalDuration += Date.now() - start;
      }

      const averageLatency = totalDuration / testCount;
      console.log(`[Performance] Average latency for emotional profile: ${averageLatency.toFixed(2)}ms`);
      expect(averageLatency).toBeLessThan(50);
    });
  });
});