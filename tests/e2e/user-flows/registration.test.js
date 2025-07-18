const { describe, it } = require('mocha');
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../../backend/server/app');
const User = require('../../../../backend/server/models/User');

describe('User Registration E2E Flow', () => {
  const testUser = {
    email: 'e2e@example.com',
    password: 'E2ETest1234',
    name: 'E2E Test User'
  };

  after(async () => {
    // Cleanup test data
    await User.deleteOne({ email: testUser.email });
  });

  it('should complete registration flow', async () => {
    // Step 1: Register new user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(registerResponse.body).to.have.property('success', true);
    
    // Step 2: Login with new credentials
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(loginResponse.body).to.have.property('token');
    
    // Step 3: Access protected route
    const profileResponse = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(profileResponse.body).to.have.property('email', testUser.email);
  });

  it('should prevent duplicate registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(400);

    expect(response.body).to.have.property('message', 'Email already registered');
  });
});
