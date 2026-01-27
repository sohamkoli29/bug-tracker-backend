const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a ticket title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a ticket description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please provide a project'],
    },
    ticketNumber: {
      type: Number,
      required: true,
    },
    ticketKey: {
      type: String,
      required: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['bug', 'feature', 'improvement', 'task'],
      default: 'bug',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create compound index for project and ticketNumber
ticketSchema.index({ project: 1, ticketNumber: 1 }, { unique: true });

// Generate ticket key before saving
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const project = await mongoose.model('Project').findById(this.project);
      if (project) {
        this.ticketKey = `${project.key}-${this.ticketNumber}`;
      }
    } catch (error) {
      console.error('Error generating ticket key:', error);
    }
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);