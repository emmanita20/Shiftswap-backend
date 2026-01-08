const mongoose = require('mongoose');

const shiftHistorySchema = new mongoose.Schema({
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'Shift is required'],
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'assigned', 'unassigned', 'status_changed', 'approved', 'rejected'],
    required: [true, 'Action is required'],
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performed by user is required'],
  },
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

shiftHistorySchema.index({ shift: 1, createdAt: -1 });
shiftHistorySchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('ShiftHistory', shiftHistorySchema);

