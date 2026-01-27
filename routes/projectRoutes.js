const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/').get(getProjects).post(createProject);

router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

router.post('/:id/members', addTeamMember);
router.delete('/:id/members/:memberId', removeTeamMember);

module.exports = router;