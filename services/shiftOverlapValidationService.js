/**
 * ==================================================
 * SHIFT OVERLAP VALIDATION SERVICE
 * ==================================================
 * This service checks if shifts overlap improperly.
 * 
 * Overlap rules:
 * - A shift overlaps if it has the same date and overlapping time ranges
 * - For the same user (assignedTo), shifts cannot overlap
 * - For the same department, shifts can overlap (multiple people can work same time)
 * - Exception: Emergency shifts can overlap with regular shifts
 */

const Shift = require('../models/Shift');

/**
 * Check if two time ranges overlap
 * 
 * @param {string} start1 - Start time of first shift (HH:mm format)
 * @param {string} end1 - End time of first shift (HH:mm format)
 * @param {string} start2 - Start time of second shift (HH:mm format)
 * @param {string} end2 - End time of second shift (HH:mm format)
 * @returns {boolean} - True if time ranges overlap
 */
function timeRangesOverlap(start1, end1, start2, end2) {
  // Convert time strings to minutes for easier comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // Handle overnight shifts (end time is next day)
  // If end time is less than start time, it means the shift goes to next day
  const end1Adjusted = end1Min < start1Min ? end1Min + 24 * 60 : end1Min;
  const end2Adjusted = end2Min < start2Min ? end2Min + 24 * 60 : end2Min;

  // Check if ranges overlap
  // Two ranges overlap if: start1 < end2 AND start2 < end1
  return start1Min < end2Adjusted && start2Min < end1Adjusted;
}

/**
 * Check if a shift overlaps with existing shifts for the same user
 * 
 * @param {string} userId - User ID to check overlaps for
 * @param {Date} date - Shift date
 * @param {string} startTime - Shift start time (HH:mm)
 * @param {string} endTime - Shift end time (HH:mm)
 * @param {string} excludeShiftId - Shift ID to exclude from check (for updates)
 * @returns {Object} - { hasOverlap: boolean, overlappingShifts: Array }
 */
exports.checkUserShiftOverlap = async (userId, date, startTime, endTime, excludeShiftId = null) => {
  // Find all shifts assigned to this user on the same date
  const query = {
    assignedTo: userId,
    date: new Date(date),
    status: { $in: ['open', 'requested', 'approved'] }, // Only check active shifts
  };

  // Exclude current shift if updating
  if (excludeShiftId) {
    query._id = { $ne: excludeShiftId };
  }

  const existingShifts = await Shift.find(query);

  // Check for time overlaps
  const overlappingShifts = existingShifts.filter(shift => {
    return timeRangesOverlap(startTime, endTime, shift.startTime, shift.endTime);
  });

  return {
    hasOverlap: overlappingShifts.length > 0,
    overlappingShifts: overlappingShifts.map(s => ({
      id: s._id,
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
    })),
  };
};

/**
 * Check if a shift overlaps with existing shifts in the same department
 * This is a warning check (doesn't block, but can be used for notifications)
 * 
 * @param {string} department - Department name
 * @param {Date} date - Shift date
 * @param {string} startTime - Shift start time (HH:mm)
 * @param {string} endTime - Shift end time (HH:mm)
 * @param {string} excludeShiftId - Shift ID to exclude from check (for updates)
 * @returns {Object} - { hasOverlap: boolean, overlappingShifts: Array }
 */
exports.checkDepartmentShiftOverlap = async (department, date, startTime, endTime, excludeShiftId = null) => {
  // Find all shifts in the same department on the same date
  const query = {
    department: department,
    date: new Date(date),
    status: { $in: ['open', 'requested', 'approved'] },
  };

  // Exclude current shift if updating
  if (excludeShiftId) {
    query._id = { $ne: excludeShiftId };
  }

  const existingShifts = await Shift.find(query);

  // Check for time overlaps
  const overlappingShifts = existingShifts.filter(shift => {
    return timeRangesOverlap(startTime, endTime, shift.startTime, shift.endTime);
  });

  return {
    hasOverlap: overlappingShifts.length > 0,
    overlappingShifts: overlappingShifts.map(s => ({
      id: s._id,
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      assignedTo: s.assignedTo,
      status: s.status,
    })),
  };
};

/**
 * Validate shift doesn't overlap improperly
 * 
 * @param {Object} shiftData - Shift data to validate
 * @param {string} excludeShiftId - Shift ID to exclude (for updates)
 * @returns {Object} - { isValid: boolean, errors: Array, warnings: Array }
 */
exports.validateShiftOverlap = async (shiftData, excludeShiftId = null) => {
  const { assignedTo, department, date, startTime, endTime } = shiftData;
  const errors = [];
  const warnings = [];

  // If shift is assigned to a user, check for user overlaps
  if (assignedTo) {
    const userOverlap = await exports.checkUserShiftOverlap(
      assignedTo,
      date,
      startTime,
      endTime,
      excludeShiftId
    );

    if (userOverlap.hasOverlap) {
      errors.push({
        type: 'user_overlap',
        message: `This shift overlaps with existing shifts assigned to this user`,
        overlappingShifts: userOverlap.overlappingShifts,
      });
    }
  }

  // Check department overlaps (warning only, multiple people can work same time)
  const deptOverlap = await exports.checkDepartmentShiftOverlap(
    department,
    date,
    startTime,
    endTime,
    excludeShiftId
  );

  if (deptOverlap.hasOverlap) {
    warnings.push({
      type: 'department_overlap',
      message: `Multiple shifts exist in ${department} department for the same time period`,
      overlappingShifts: deptOverlap.overlappingShifts,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

