const { validationResult } = require('express-validator');
const pool = require('../config/database');

const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId } = req.params;
    const { author, email, content } = req.body;
    const connection = await pool.getConnection();

    try {
      // Check if post exists
      const [posts] = await connection.execute(
        'SELECT id FROM posts WHERE id = ?',
        [postId]
      );

      if (posts.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Add comment
      const [result] = await connection.execute(
        'INSERT INTO comments (post_id, author, email, content) VALUES (?, ?, ?, ?)',
        [postId, author, email, content]
      );

      res.status(201).json({ 
        message: 'Comment added successfully',
        commentId: result.insertId 
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const connection = await pool.getConnection();

    try {
      const [comments] = await connection.execute(
        'SELECT id, author, email, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC',
        [postId]
      );

      res.json(comments);
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  addComment,
  getComments
};
