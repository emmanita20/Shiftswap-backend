const mongoose = require('mongoose');

const workHoursSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'Shift is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  hoursWorked: {
    type: Number,
    required: [true, 'Hours worked is required'],
    min: 0,
  },
  weekStartDate: {
    type: Date,
    required: [true, 'Week start date is required'],
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
workHoursSchema.index({ user: 1, weekStartDate: 1 });
workHoursSchema.index({ user: 1, year: 1, month: 1 });
workHoursSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('WorkHours', workHoursSchema);

