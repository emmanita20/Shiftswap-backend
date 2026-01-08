const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['approval', 'rejection', 'shift_assigned', 'emergency_broadcast'],
    required: [true, 'Notification type is required'],
  },
  relatedShift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['new', 'read', 'treated'],
    default: 'new',
  },
  requiresAction: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);

