const Activity = require('../models/Activity');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');

// @desc    Get activity log for a ticket
// @route   GET /api/tickets/:ticketId/activity
// @access  Private
const getTicketActivity = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Check if ticket exists and user has access
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const project = await Project.findById(ticket.project);
    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this ticket' });
    }

    // Get activity log
    const activities = await Activity.find({ ticket: ticketId })
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create activity log entry
// @route   POST /api/tickets/:ticketId/activity
// @access  Private
const createActivity = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { action, field, oldValue, newValue, description } = req.body;

    const activity = await Activity.create({
      ticket: ticketId,
      user: req.user._id,
      action,
      field,
      oldValue,
      newValue,
      description,
    });

    const populatedActivity = await Activity.findById(activity._id).populate(
      'user',
      'name email'
    );

    res.status(201).json(populatedActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTicketActivity,
  createActivity,
};