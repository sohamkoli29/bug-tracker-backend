const express = require('express');
const router = express.Router();
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Ticket comments routes
router.route('/tickets/:ticketId/comments').get(getComments).post(createComment);

// Individual comment routes
router.route('/comments/:id').put(updateComment).delete(deleteComment);

module.exports = router;