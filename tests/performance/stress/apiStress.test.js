const { describe, it } = require('mocha');
const { expect } = require('chai');
const loadtest = require('loadtest');
const config = require('../../../../backend/server/config/environment');

describe('API Stress Tests', () => {
  const BASE_URL = `http://localhost:${config.port}`;

  it('should handle 1000 concurrent connections to health check', function(done) {
    this.timeout(30000);
    
    const options = {
      url: `${BASE_URL}/api/health`,
      maxRequests: 1000,
      concurrency: 1000,
      method: 'GET',
      statusCallback: (error, result, latency) => {
        if (error) return done(error);
      }
    };

    loadtest.loadTest(options, (error, results) => {
      if (error) return done(error);
      expect(results.totalErrors).to.equal(0);
      expect(results.meanLatencyMs).to.be.below(500);
      done();
    });
  });

  it('should maintain availability under heavy load', function(done) {
    this.timeout(60000);
    const options = {
      url: `${BASE_URL}/api/health`,
      maxSeconds: 30,
      concurrency: 100,
      method: 'GET',
      requestsPerSecond: 50,
      statusCallback: (error, result, latency) => {
        if (error) return done(error);
      }
    };

    loadtest.loadTest(options, (error, results) => {
      if (error) return done(error);
      expect(results.totalErrors).to.equal(0);
      expect(results.percentiles[99]).to.be.below(1000);
      done();
    });
  });
});
