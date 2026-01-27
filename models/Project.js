const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a project description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    key: {
      type: String,
      required: [true, 'Please provide a project key'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Project key cannot be more than 10 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'developer', 'viewer'],
          default: 'developer',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'on-hold'],
      default: 'active',
    },
    color: {
      type: String,
      default: '#3b82f6', // Default blue color
    },
    icon: {
      type: String,
      default: '📁',
    },
  },
  {
    timestamps: true,
  }
);

// Add owner to team members automatically
projectSchema.pre('save', function (next) {
  if (this.isNew) {
    this.teamMembers.push({
      user: this.owner,
      role: 'admin',
    });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);