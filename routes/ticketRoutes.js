const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Project tickets routes
router.route('/projects/:projectId/tickets').get(getTickets).post(createTicket);

router.route('/projects/:projectId/tickets/stats').get(getTicketStats);

// Individual ticket routes
router.route('/tickets/:id').get(getTicket).put(updateTicket).delete(deleteTicket);

module.exports = router;