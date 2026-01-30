const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} = require('../controllers/notificationcontroller');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/').get(getNotifications);
router.route('/read-all').put(markAllAsRead);
router.route('/clear-read').delete(clearReadNotifications);
router.route('/:id/read').put(markAsRead);
router.route('/:id').delete(deleteNotification);

module.exports = router;