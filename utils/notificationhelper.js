const { createNotification } = require('../controllers/notificationController');

// Helper to notify when ticket is assigned
const notifyTicketAssigned = async (ticket, assignee, assignedBy) => {
  if (assignee && assignee.toString() !== assignedBy.toString()) {
    await createNotification({
      user: assignee,
      type: 'ticket_assigned',
      title: 'New ticket assigned',
      message: `You've been assigned to ${ticket.ticketKey}: ${ticket.title}`,
      link: `/projects/${ticket.project}/tickets/${ticket._id}`,
      ticket: ticket._id,
      project: ticket.project,
      actionBy: assignedBy,
    });
  }
};

// Helper to notify when ticket is updated
const notifyTicketUpdated = async (ticket, updatedBy, teamMembers) => {
  const usersToNotify = teamMembers
    .map((m) => m.user._id || m.user)
    .filter((userId) => userId.toString() !== updatedBy.toString());

  for (const userId of usersToNotify) {
    await createNotification({
      user: userId,
      type: 'ticket_updated',
      title: 'Ticket updated',
      message: `${ticket.ticketKey} was updated: ${ticket.title}`,
      link: `/projects/${ticket.project}/tickets/${ticket._id}`,
      ticket: ticket._id,
      project: ticket.project,
      actionBy: updatedBy,
    });
  }
};

// Helper to notify when comment is added
const notifyTicketCommented = async (ticket, comment, commentBy, teamMembers) => {
  const usersToNotify = teamMembers
    .map((m) => m.user._id || m.user)
    .filter((userId) => userId.toString() !== commentBy.toString());

  for (const userId of usersToNotify) {
    await createNotification({
      user: userId,
      type: 'ticket_commented',
      title: 'New comment',
      message: `New comment on ${ticket.ticketKey}: ${comment.substring(0, 50)}${
        comment.length > 50 ? '...' : ''
      }`,
      link: `/projects/${ticket.project}/tickets/${ticket._id}`,
      ticket: ticket._id,
      project: ticket.project,
      actionBy: commentBy,
    });
  }
};

// Helper to notify when user is added to project
const notifyProjectAdded = async (project, user, addedBy) => {
  if (user.toString() !== addedBy.toString()) {
    await createNotification({
      user: user,
      type: 'project_added',
      title: 'Added to project',
      message: `You've been added to ${project.title}`,
      link: `/projects/${project._id}`,
      project: project._id,
      actionBy: addedBy,
    });
  }
};

// Helper to notify when user role changes
const notifyRoleChanged = async (project, user, newRole, changedBy) => {
  if (user.toString() !== changedBy.toString()) {
    await createNotification({
      user: user,
      type: 'project_role_changed',
      title: 'Role updated',
      message: `Your role in ${project.title} was changed to ${newRole}`,
      link: `/projects/${project._id}`,
      project: project._id,
      actionBy: changedBy,
    });
  }
};

module.exports = {
  notifyTicketAssigned,
  notifyTicketUpdated,
  notifyTicketCommented,
  notifyProjectAdded,
  notifyRoleChanged,
};