const express = require('express');
const { body } = require('express-validator');
const { addComment, getComments } = require('../controllers/commentController');

const router = express.Router();

router.post('/:postId/comments', [
  body('author').trim().notEmpty().withMessage('Author name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('content').trim().notEmpty().withMessage('Comment content is required')
], addComment);

router.get('/:postId/comments', getComments);

module.exports = router;
