import { describe, it, beforeEach, after } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { AuthService } from '../../server/services/authService';
import { pool } from '../../server/config/database.js';

describe('AuthService Unit Tests', () => {
  let authService;
  let queryStub;

  beforeEach(() => {
    authService = new AuthService();
    queryStub = sinon.stub(pool, 'query');
  });

  afterEach(() => {
    sinon.restore();
  });

  after(async () => {
    await pool.end();
  });

  it('should authenticate valid user', async () => {
    const mockUser = {
      rows: [{
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password_hash: '$2a$12$hashedpassword',
        style_data: JSON.stringify({
          display_name: 'Test',
          city: 'São Paulo',
          is_vip: false
        })
      }]
    };
    
    queryStub.resolves(mockUser);
    sinon.stub(bcrypt, 'compare').resolves(true);

    const result = await authService.loginUser('test@example.com', 'password');
    expect(result).to.have.property('auth_token');
    expect(result.user).to.deep.include({
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      displayName: 'Test',
      city: 'São Paulo',
      isVip: false
    });
  });

  it('should reject invalid password', async () => {
    const mockUser = {
      rows: [{
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password_hash: '$2a$12$hashedpassword'
      }]
    };
    
    queryStub.resolves(mockUser);
    sinon.stub(bcrypt, 'compare').resolves(false);

    try {
      await authService.loginUser('test@example.com', 'wrong_password');
      throw new Error('Should have thrown error');
    } catch (err) {
      expect(err.message).to.equal('Invalid credentials');
    }
  });

  it('should handle user not found', async () => {
    queryStub.resolves({ rows: [] });

    try {
      await authService.loginUser('nonexistent@example.com', 'password');
      throw new Error('Should have thrown error');
    } catch (err) {
      expect(err.message).to.equal('Invalid credentials');
    }
  });
});
