const Ticket = require('../models/Ticket');
const Project = require('../models/Project');

// @desc    Get all tickets for a project
// @route   GET /api/projects/:projectId/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user is a member of the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    // Get tickets
    const tickets = await Ticket.find({ project: projectId })
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .sort('-createdAt');

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('project', 'title key color icon');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is a member of the project
    const project = await Project.findById(ticket.project._id);
    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this ticket' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new ticket
// @route   POST /api/projects/:projectId/tickets
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, type, priority, assignee, dueDate, tags } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ message: 'Please provide title and description' });
    }

    // Check if user is a member of the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to create tickets in this project' });
    }

    // Get the next ticket number for this project
    const lastTicket = await Ticket.findOne({ project: projectId })
      .sort('-ticketNumber')
      .select('ticketNumber');

    const ticketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // Create ticket
    const ticket = await Ticket.create({
      title,
      description,
      project: projectId,
      ticketNumber,
      ticketKey: `${project.key}-${ticketNumber}`,
      type: type || 'bug',
      priority: priority || 'medium',
      status: 'todo',
      assignee: assignee || null,
      reporter: req.user._id,
      dueDate: dueDate || null,
      tags: tags || [],
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('project', 'title key color icon');

    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is a member of the project
    const project = await Project.findById(ticket.project);
    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    const { title, description, type, priority, status, assignee, dueDate, tags } = req.body;

    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (type) ticket.type = type;
    if (priority) ticket.priority = priority;
    if (status) ticket.status = status;
    if (assignee !== undefined) ticket.assignee = assignee;
    if (dueDate !== undefined) ticket.dueDate = dueDate;
    if (tags) ticket.tags = tags;

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('project', 'title key color icon');

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is reporter or project admin
    const project = await Project.findById(ticket.project);
    const userMember = project.teamMembers.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    const isReporter = ticket.reporter.toString() === req.user._id.toString();
    const isAdmin = userMember && (userMember.role === 'admin' || project.owner.toString() === req.user._id.toString());

    if (!isReporter && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this ticket' });
    }

    await ticket.deleteOne();

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ticket statistics for a project
// @route   GET /api/projects/:projectId/tickets/stats
// @access  Private
const getTicketStats = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user is a member of the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    const stats = await Ticket.aggregate([
      { $match: { project: project._id } },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
              },
            },
          ],
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
              },
            },
          ],
          total: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
};