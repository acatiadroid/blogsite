const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { getClientIp } = require('../middleware/auth');

const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, excerpt } = req.body;
    const userId = req.user.id;
    
    const connection = await pool.getConnection();

    try {
      // Verify user exists before creating post
      const [userExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );

      if (userExists.length === 0) {
        return res.status(404).json({ error: 'User not found. Please re-login.' });
      }

      const [result] = await connection.execute(
        'INSERT INTO posts (user_id, title, content, excerpt) VALUES (?, ?, ?, ?)',
        [userId, title, content, excerpt || content.substring(0, 500)]
      );

      res.status(201).json({ 
        message: 'Post created successfully',
        postId: result.insertId 
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [posts] = await connection.execute(`
        SELECT p.id, p.title, p.excerpt, p.views, p.created_at, p.updated_at, 
               u.username,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `);

      res.json(posts);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      // Get post
      const [posts] = await connection.execute(`
        SELECT p.id, p.title, p.content, p.views, p.created_at, p.updated_at,
               u.username,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [id]);

      if (posts.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const post = posts[0];

      // Increment views
      await connection.execute(
        'UPDATE posts SET views = views + 1 WHERE id = ?',
        [id]
      );

      // Get comments
      const [comments] = await connection.execute(
        'SELECT id, author, email, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC',
        [id]
      );

      res.json({ ...post, comments });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, excerpt } = req.body;
    const userId = req.user.id;
    const connection = await pool.getConnection();

    try {
      // Check ownership
      const [posts] = await connection.execute(
        'SELECT user_id FROM posts WHERE id = ?',
        [id]
      );

      if (posts.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (posts[0].user_id !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await connection.execute(
        'UPDATE posts SET title = ?, content = ?, excerpt = ? WHERE id = ?',
        [title, content, excerpt || content.substring(0, 500), id]
      );

      res.json({ message: 'Post updated successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const connection = await pool.getConnection();

    try {
      // Check ownership
      const [posts] = await connection.execute(
        'SELECT user_id FROM posts WHERE id = ?',
        [id]
      );

      if (posts.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (posts[0].user_id !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await connection.execute('DELETE FROM posts WHERE id = ?', [id]);

      res.json({ message: 'Like recorded successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const ip = getClientIp(req);
    const connection = await pool.getConnection();

    try {
      // Check if post exists
      const [posts] = await connection.execute(
        'SELECT id FROM posts WHERE id = ?',
        [id]
      );

      if (posts.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Try to insert like
      try {
        await connection.execute(
          'INSERT INTO likes (post_id, ip_address) VALUES (?, ?)',
          [id, ip]
        );
        res.json({ message: 'Post liked successfully' });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Already liked this post' });
        }
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost
};
