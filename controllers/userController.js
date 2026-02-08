const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    console.log('Update profile request:', { userId: req.user._id, name, email });

    // Validation
    if (!name || !email) {
      return res.status(400).json({ message: 'Please provided all fields' });
    }

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.user._id } // Exclude current user
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user using findByIdAndUpdate to avoid password hashing
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        name: name.trim(),
        email: email.toLowerCase().trim()
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validators
      }
    ).select('-password'); // Don't return password

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile updated successfully for user:', updatedUser._id);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Error updating profile',
      error: error.message 
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    console.log('Change password request for user:', req.user._id);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as current
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({ 
        message: 'New password must be different from current password' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for user:', user._id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      message: 'Error changing password',
      error: error.message 
    });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const { notifications, theme } = req.body;

    console.log('Update preferences request:', { userId: req.user._id, notifications, theme });

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {
        notifications: {
          emailNotifications: true,
          issueAssigned: true,
          issueUpdated: true,
          comments: true,
          mentions: true,
        },
        theme: 'light',
      };
    }

    // Update preferences
    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications,
      };
    }

    if (theme) {
      user.preferences.theme = theme;
    }

    await user.save();

    console.log('Preferences updated successfully for user:', user._id);

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ 
      message: 'Error updating preferences',
      error: error.message 
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    console.log('Delete account request for user:', req.user._id);

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Verify password before deletion
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // TODO: Clean up user's data (projects, tickets, comments, etc.)
    // This should be done in a transaction or with proper cascade deletion

    await user.deleteOne();

    console.log('Account deleted successfully for user:', req.user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      message: 'Error deleting account',
      error: error.message 
    });
  }
};

module.exports = {
  updateProfile,
  changePassword,
  updatePreferences,
  deleteAccount,
};