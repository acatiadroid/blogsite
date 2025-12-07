const request = require('supertest');
const express = require('express');
const postController = require('../controllers/postController');

jest.mock('../config/database', () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const db = require('../config/database');

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
      // Mock: Check user exists
      db.execute.mockResolvedValueOnce([[{ id: 1, username: 'testuser' }]]);
      // Mock: Insert post
      db.execute.mockResolvedValueOnce([{ insertId: 123 }]);

      const response = await request(app)
        .post('/posts')
        .send({
          userId: 1,
          title: 'Test Post',
          content: '# Test Content',
          excerpt: 'Test excerpt'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 123);
    });

    it('should fail if user does not exist', async () => {
      // Mock: User not found
      db.execute.mockResolvedValueOnce([[]]);

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
        { 
          id: 1, 
          title: 'Post 1',
          excerpt: 'Excerpt 1',
          views: 10, 
          likes: 5, 
          commentCount: 2,
          username: 'user1',
          createdAt: new Date()
        },
        { 
          id: 2, 
          title: 'Post 2',
          excerpt: 'Excerpt 2',
          views: 20, 
          likes: 8, 
          commentCount: 3,
          username: 'user2',
          createdAt: new Date()
        }
      ];
      
      db.execute.mockResolvedValueOnce([mockPosts]);

      const response = await request(app).get('/posts');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /posts/:id', () => {
    it('should retrieve a post by id', async () => {
      const mockPost = {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        excerpt: 'Test excerpt',
        views: 10,
        username: 'testuser',
        createdAt: new Date()
      };
      
      const mockComments = [
        { id: 1, postId: 1, content: 'Comment 1', username: 'user1', createdAt: new Date() }
      ];
      
      // Mock: Get post
      db.execute.mockResolvedValueOnce([[mockPost]]);
      // Mock: Update views
      db.execute.mockResolvedValueOnce([]);
      // Mock: Get comments
      db.execute.mockResolvedValueOnce([mockComments]);

      const response = await request(app).get('/posts/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Test Post');
      expect(response.body).toHaveProperty('comments');
    });

    it('should fail if post does not exist', async () => {
      // Mock: Post not found
      db.execute.mockResolvedValueOnce([[]]);

      const response = await request(app).get('/posts/999');

      expect(response.status).toBe(404);
    });
  });
});
