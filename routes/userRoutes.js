const express = require('express');
const router = express.Router();
const {
  updateProfile,
  changePassword,
  updatePreferences,
  deleteAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.put('/preferences', updatePreferences);
router.delete('/account', deleteAccount);

module.exports = router;