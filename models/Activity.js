const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'created',
        'updated',
        'deleted',
        'status_changed',
        'priority_changed',
        'assigned',
        'unassigned',
        'commented',
        'duplicated',
      ],
      required: true,
    },
    field: {
      type: String,
      default: null,
    },
    oldValue: {
      type: String,
      default: null,
    },
    newValue: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
activitySchema.index({ ticket: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);