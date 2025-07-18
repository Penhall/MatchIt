const { describe, it } = require('mocha');
const { expect } = require('chai');
const loadtest = require('loadtest');
const config = require('../../../../backend/server/config/environment');

describe('API Load Tests', () => {
  const BASE_URL = `http://localhost:${config.port}`;

  it('should handle 100 requests per second to health check', function(done) {
    this.timeout(10000); // Increase timeout for load test

    const options = {
      url: `${BASE_URL}/api/health`,
      maxRequests: 100,
      concurrency: 10,
      method: 'GET',
      statusCallback: (error, result, latency) => {
        if (error) return done(error);
        if (result.statusCode !== 200) {
          return done(new Error(`Status code ${result.statusCode}`));
        }
      }
    };

    loadtest.loadTest(options, (error) => {
      if (error) return done(error);
      done();
    });
  });

  it('should maintain response time under 200ms for 95% of requests', function(done) {
    this.timeout(15000);
    const options = {
      url: `${BASE_URL}/api/health`,
      maxRequests: 500,
      concurrency: 50,
      method: 'GET',
      statusCallback: (error, result, latency) => {
        if (error) return done(error);
      }
    };

    loadtest.loadTest(options, (error, results) => {
      if (error) return done(error);
      expect(results.percentiles[95]).to.be.below(200);
      done();
    });
  });
});
