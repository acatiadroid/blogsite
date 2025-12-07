const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database module
jest.mock('../config/database', () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const db = require('../config/database');
const authController = require('../controllers/authController');

describe('Auth Controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    jest.clearAllMocks();
    
    // Set JWT secret for tests
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('POST /register', () => {
    it('should register a new user and return a token', async () => {
      // Mock: Check if user exists (should return empty)
      db.execute.mockResolvedValueOnce([[]]);
      // Mock: Insert new user
      db.execute.mockResolvedValueOnce([{ insertId: 1 }]);
      
      const response = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return 400 if user already exists', async () => {
      // Mock: User already exists
      db.execute.mockResolvedValueOnce([[{ id: 1, username: 'existing' }]]);
      
      const response = await request(app)
        .post('/register')
        .send({
          username: 'existing',
          email: 'existing@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
    });

    it('should fail if username is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
    });

    it('should fail if password is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('should login user and return a token', async () => {
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      
      // Mock: Find user by username
      db.execute.mockResolvedValueOnce([[{ 
        id: 1, 
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword 
      }]]);
      
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail with invalid credentials', async () => {
      // Mock: User not found
      db.execute.mockResolvedValueOnce([[]]);
      
      const response = await request(app)
        .post('/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
    });
    
    it('should fail with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10);
      
      // Mock: Find user
      db.execute.mockResolvedValueOnce([[{ 
        id: 1, 
        username: 'testuser',
        password: hashedPassword 
      }]]);
      
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
    });
  });
});
