const Project = require('../models/Project');
const User = require('../models/User');
const { notifyProjectAdded } = require('../utils/notificationHelper');
// @desc    Get all projects for logged-in user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'teamMembers.user': req.user._id,
    })
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email')
      .sort('-createdAt');

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a team member
    const isMember = project.teamMembers.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, key, color, icon } = req.body;

    // Validation
    if (!title || !description || !key) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if project key already exists
    const keyExists = await Project.findOne({ key: key.toUpperCase() });
    if (keyExists) {
      return res.status(400).json({ message: 'Project key already exists' });
    }

    // Create project WITHOUT pre-save hook
    const project = new Project({
      title,
      description,
      key: key.toUpperCase(),
      owner: req.user._id,
      color: color || '#3b82f6',
      icon: icon || '📁',
      teamMembers: [
        {
          user: req.user._id,
          role: 'admin',
        },
      ], // Manually add owner to team members
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    const userMember = project.teamMembers.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMember || (userMember.role !== 'admin' && project.owner.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { title, description, status, color, icon } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (status) project.status = status;
    if (color) project.color = color;
    if (icon) project.icon = icon;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete the project' });
    }

    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/members
// @access  Private
const addTeamMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    const userMember = project.teamMembers.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMember || (userMember.role !== 'admin' && project.owner.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    // Find user by email
    const newUser = await User.findOne({ email });

    if (!newUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const alreadyMember = project.teamMembers.some(
      (member) => member.user.toString() === newUser._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Add member
    project.teamMembers.push({
      user: newUser._id,
      role: role || 'developer',
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json(updatedProject);

    await notifyProjectAdded(project, newUser._id, req.user._id);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/members/:memberId
// @access  Private
const removeTeamMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or admin
    const userMember = project.teamMembers.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!userMember || (userMember.role !== 'admin' && project.owner.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to remove members' });
    }

    // Cannot remove owner
    if (req.params.memberId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    // Remove member
    project.teamMembers = project.teamMembers.filter(
      (member) => member.user.toString() !== req.params.memberId
    );

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  removeTeamMember,
};