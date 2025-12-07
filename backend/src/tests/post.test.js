const request = require('supertest');
const express = require('express');
const postController = require('../controllers/postController');

jest.mock('../db', () => ({
  query: jest.fn()
}));

const db = require('../db');

describe('Post Controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/posts', postController.createPost);
    app.get('/posts', postController.getAllPosts);
    app.get('/posts/:id', postController.getPostById);
    app.put('/posts/:id', postController.updatePost);
    app.delete('/posts/:id', postController.deletePost);
    app.post('/posts/:id/like', postController.likePost);
    jest.clearAllMocks();
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      db.query.mockResolvedValueOnce([[]]);
      db.query.mockResolvedValueOnce([[{ insertId: 1 }]]);

      const response = await request(app)
        .post('/posts')
        .send({
          userId: 1,
          title: 'Test Post',
          content: '# Test Content',
          excerpt: 'Test excerpt'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should fail if user does not exist', async () => {
      db.query.mockResolvedValue([[]]);

      const response = await request(app)
        .post('/posts')
        .send({
          userId: 999,
          title: 'Test Post',
          content: 'Test',
          excerpt: 'excerpt'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /posts', () => {
    it('should retrieve all posts', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', views: 10, likes: 5, comments: 2 },
        { id: 2, title: 'Post 2', views: 20, likes: 8, comments: 3 }
      ];
      
      db.query.mockResolvedValue([mockPosts]);

      const response = await request(app).get('/posts');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /posts/:id', () => {
    it('should retrieve a post by id', async () => {
      const mockPost = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        views: 10
      };
      
      db.query.mockResolvedValueOnce([[mockPost]]);
      db.query.mockResolvedValueOnce([[]]); // Update views
      db.query.mockResolvedValueOnce([[]]);  // Get comments

      const response = await request(app).get('/posts/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title');
    });

    it('should fail if post does not exist', async () => {
      db.query.mockResolvedValue([[]]);

      const response = await request(app).get('/posts/999');

      expect(response.status).toBe(404);
    });
  });
});
