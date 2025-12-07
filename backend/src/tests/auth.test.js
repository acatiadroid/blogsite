const request = require('supertest');
const express = require('express');
const authController = require('../controllers/authController');

// Mock database module
jest.mock('../db', () => ({
  query: jest.fn()
}));

const db = require('../db');

describe('Auth Controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user and return a token', async () => {
      db.query.mockResolvedValue([[]]);
      
      const response = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail if username is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
    });

    it('should fail if password is missing', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('should login user and return a token', async () => {
      const hashedPassword = '$2a$10$test'; // Mock bcrypt hash
      db.query.mockResolvedValue([[{ id: 1, username: 'testuser', password: hashedPassword }]]);
      
      const response = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail with invalid credentials', async () => {
      db.query.mockResolvedValue([[]]);
      
      const response = await request(app)
        .post('/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
    });
  });
});
