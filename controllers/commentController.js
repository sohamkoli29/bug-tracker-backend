const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const { notifyTicketCommented } = require('../utils/notificationHelper');
// @desc    Get all comments for a ticket
// @route   GET /api/tickets/:ticketId/comments
// @access  Private
const getComments = async (req, res) => {
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

    // Get comments with user details
    const comments = await Comment.find({ ticket: ticketId })
      .populate('user', 'name email')
      .populate({
        path: 'parentComment',
        populate: { path: 'user', select: 'name email' },
      })
      .sort('createdAt');

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new comment
// @route   POST /api/tickets/:ticketId/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text, parentComment } = req.body;

    // Validation
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Please provide comment text' });
    }

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
      return res.status(403).json({ message: 'Not authorized to comment on this ticket' });
    }

    // Create comment
    const comment = await Comment.create({
      ticket: ticketId,
      user: req.user._id,
      text: text.trim(),
      parentComment: parentComment || null,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email')
      .populate({
        path: 'parentComment',
        populate: { path: 'user', select: 'name email' },
      });

    res.status(201).json(populatedComment);
     
await notifyTicketCommented(
  ticket,
  comment.text,
  req.user._id,
  project.teamMembers
);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Please provide comment text' });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment author can update
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.text = text.trim();
    comment.edited = true;
    comment.editedAt = Date.now();

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email')
      .populate({
        path: 'parentComment',
        populate: { path: 'user', select: 'name email' },
      });

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or project admin
    const ticket = await Ticket.findById(comment.ticket);
    const project = await Project.findById(ticket.project);

    const isAuthor = comment.user.toString() === req.user._id.toString();
    const isAdmin =
      project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.some(
        (member) =>
          member.user.toString() === req.user._id.toString() && member.role === 'admin'
      );

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Delete comment and its replies
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};