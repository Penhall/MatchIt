const { describe, it } = require('mocha');
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../backend/server/app');
const db = require('../../../backend/server/config/database');

describe('Auth API Integration Tests', () => {
  before(async () => {
    await db.connect();
  });

  after(async () => {
    await db.disconnect();
  });

  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User'
      })
      .expect(201);

    expect(response.body).to.have.property('success', true);
    expect(response.body).to.have.property('user');
  });

  it('should login with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@example.com',
        password: 'Test1234',
        name: 'Login User'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Test1234'
      })
      .expect(200);

    expect(response.body).to.have.property('success', true);
    expect(response.body).to.have.property('token');
  });

  it('should reject invalid login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'WrongPassword'
      })
      .expect(401);

    expect(response.body).to.have.property('success', false);
  });
});
