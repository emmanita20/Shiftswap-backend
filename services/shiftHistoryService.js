const ShiftHistory = require('../models/ShiftHistory');

/**
 * Record a shift history event
 * @param {ObjectId} shiftId - Shift ID
 * @param {String} action - Action type
 * @param {ObjectId} performedBy - User ID who performed the action
 * @param {*} previousValue - Previous value
 * @param {*} newValue - New value
 * @param {String} description - Optional description
 * @returns {Promise<Object>} Created ShiftHistory document
 */
exports.recordHistory = async (shiftId, action, performedBy, previousValue = null, newValue = null, description = null) => {
  const history = await ShiftHistory.create({
    shift: shiftId,
    action,
    performedBy,
    previousValue,
    newValue,
    description,
  });

  return history;
};

/**
 * Get shift history
 * @param {ObjectId} shiftId - Shift ID
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} Array of history records
 */
exports.getShiftHistory = async (shiftId, limit = 50) => {
  return await ShiftHistory.find({ shift: shiftId })
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

