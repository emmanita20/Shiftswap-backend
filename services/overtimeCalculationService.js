const WorkHours = require('../models/WorkHours');
const Shift = require('../models/Shift');

/**
 * Calculate hours between start and end time strings
 * @param {String} startTime - Start time (e.g., "09:00")
 * @param {String} endTime - End time (e.g., "17:00")
 * @returns {Number} Hours worked
 */
const calculateHours = (startTime, endTime) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts
  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Add 24 hours for overnight
  }
  
  return diffMinutes / 60;
};

/**
 * Get the start of the week (Sunday) for a given date
 * @param {Date} date
 * @returns {Date}
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Calculate total hours worked in a week
 * @param {ObjectId} userId - User ID
 * @param {Date} date - Date within the week
 * @returns {Promise<Number>} Total hours in the week
 */
exports.getWeeklyHours = async (userId, date) => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const workHours = await WorkHours.find({
    user: userId,
    date: { $gte: weekStart, $lt: weekEnd },
  });

  return workHours.reduce((total, wh) => total + wh.hoursWorked, 0);
};

/**
 * Check if accepting a shift would cause overtime
 * @param {ObjectId} userId - User ID
 * @param {Object} shift - Shift object with date, startTime, endTime
 * @param {Number} overtimeThreshold - Hours threshold (default: 40)
 * @returns {Promise<Object>} { wouldExceed: boolean, currentHours: number, projectedHours: number, threshold: number }
 */
exports.checkOvertime = async (userId, shift, overtimeThreshold = 40) => {
  const shiftDate = new Date(shift.date);
  const currentWeeklyHours = await this.getWeeklyHours(userId, shiftDate);
  
  const shiftHours = calculateHours(shift.startTime, shift.endTime);
  const projectedHours = currentWeeklyHours + shiftHours;
  
  return {
    wouldExceed: projectedHours > overtimeThreshold,
    currentHours: currentWeeklyHours,
    projectedHours,
    threshold: overtimeThreshold,
    shiftHours,
  };
};

/**
 * Record work hours for a shift
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} shiftId - Shift ID
 * @param {Date} date - Shift date
 * @param {String} startTime - Start time
 * @param {String} endTime - End time
 * @returns {Promise<Object>} Created WorkHours document
 */
exports.recordWorkHours = async (userId, shiftId, date, startTime, endTime) => {
  const shiftDate = new Date(date);
  const hoursWorked = calculateHours(startTime, endTime);
  const weekStart = getWeekStart(shiftDate);
  const month = shiftDate.getMonth() + 1;
  const year = shiftDate.getFullYear();

  const workHours = await WorkHours.create({
    user: userId,
    shift: shiftId,
    date: shiftDate,
    hoursWorked,
    weekStartDate: weekStart,
    month,
    year,
  });

  return workHours;
};

/**
 * Get monthly hours for a user
 * @param {ObjectId} userId - User ID
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Promise<Number>} Total hours in the month
 */
exports.getMonthlyHours = async (userId, month, year) => {
  const workHours = await WorkHours.find({
    user: userId,
    month,
    year,
  });

  return workHours.reduce((total, wh) => total + wh.hoursWorked, 0);
};

