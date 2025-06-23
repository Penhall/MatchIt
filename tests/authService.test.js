import { AuthService } from '../server/services/authService';
import { pool } from '../server/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../server/config/environment';

jest.mock('../server/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn(),
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    })),
  },
}));

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        displayName: 'Test',
        city: 'Test City',
        gender: 'other',
        age: 25,
      };

      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
        begin: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Email does not exist
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1, email: userData.email, name: userData.name, created_at: 'test' }] }); // Insert user
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Create user profile
      mockClient.begin.mockResolvedValueOnce(null);
      mockClient.commit.mockResolvedValueOnce(null);
      mockClient.release.mockResolvedValueOnce(null);

      const token = 'test_token';
      jest.spyOn(authService, 'generateToken').mockReturnValue(token);

      const result = await authService.registerUser(userData);

      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO users (email, password_hash, name, is_active) VALUES ($1, $2, $3, $4) RETURNING id, email, name, created_at',
        [userData.email, hashedPassword, userData.name, true]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        `INSERT INTO user_profiles (user_id, avatar_url, style_data) 
         VALUES ($1, $2, $3)`,
        [1, null, JSON.stringify({
          display_name: userData.displayName || userData.name,
          city: userData.city || 'Unknown',
          gender: userData.gender || 'other',
          age: userData.age || 25,
          style_completion_percentage: 0,
          bio: '',
          is_vip: false
        })]
      );
      expect(authService.generateToken).toHaveBeenCalledWith({ userId: 1, email: userData.email });
      expect(result).toEqual({
        token: token,
        auth_token: token,
        user: {
          id: 1,
          email: userData.email,
          name: userData.name,
          displayName: userData.displayName || userData.name,
          city: userData.city || 'Unknown',
          isVip: false
        }
      });
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw an error if email already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        displayName: 'Test',
        city: 'Test City',
        gender: 'other',
        age: 25,
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
        begin: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Email exists
      mockClient.begin.mockResolvedValueOnce(null);
      mockClient.rollback.mockResolvedValueOnce(null);

      try {
        await authService.registerUser(userData);
      } catch (error) {
        expect(error.message).toBe('Email already in use');
      }
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database errors during registration', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        displayName: 'Test',
        city: 'Test City',
        gender: 'other',
        age: 25,
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
        begin: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockRejectedValue(new Error('Database error'));
      mockClient.rollback.mockResolvedValueOnce(null);

      try {
        await authService.registerUser(userData);
      } catch (error) {
        expect(error.message).toBe('Database error');
      }
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login an existing user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);

      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: email,
          name: 'Test User',
          password_hash: hashedPassword,
          style_data: JSON.stringify({ displayName: 'Test' , city: 'Test City', isVip: false})
        }]
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      const token = 'test_token';
      jest.spyOn(authService, 'generateToken').mockReturnValue(token);

      const result = await authService.loginUser(email, password);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT u.id, u.email, u.name, u.password_hash, up.style_data
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.email = $1 AND u.is_active = true`,
        [email]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(authService.generateToken).toHaveBeenCalledWith({ userId: 1, email: email });
      expect(result).toEqual({
        token: token,
        auth_token: token,
        user: {
          id: 1,
          email: email,
          name: 'Test User',
          displayName: 'Test',
          city: 'Test City',
          isVip: false
        }
      });
    });

    it('should throw an error for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(authService.loginUser('invalid@example.com', 'password123')).rejects.toThrow('Invalid credentials');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);

      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: email,
          name: 'Test User',
          password_hash: hashedPassword,
          style_data: JSON.stringify({ displayName: 'Test' })
        }]
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(authService.loginUser(email, password)).rejects.toThrow('Invalid credentials');
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: 1, email: 'test@example.com' };
      const token = authService.generateToken(payload);
      const decoded = jwt.verify(token, config.jwt.secret);
      expect(decoded).toEqual(expect.objectContaining(payload));
    });
  });
});
