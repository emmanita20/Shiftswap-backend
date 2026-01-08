const WorkHours = require('../models/WorkHours');
const overtimeCalculationService = require('../services/overtimeCalculationService');

// Get work hours for logged-in user
exports.getMyWorkHours = async (req, res, next) => {
  try {
    const { weekStartDate, month, year } = req.query;
    const filter = { user: req.user.id };

    if (weekStartDate) {
      const weekStart = new Date(weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      filter.date = { $gte: weekStart, $lt: weekEnd };
    } else if (month && year) {
      filter.month = parseInt(month);
      filter.year = parseInt(year);
    }

    const workHours = await WorkHours.find(filter)
      .populate('shift', 'title date startTime endTime department')
      .sort({ date: -1 });

    const totalHours = workHours.reduce((sum, wh) => sum + wh.hoursWorked, 0);

    res.json({
      success: true,
      count: workHours.length,
      totalHours,
      data: { workHours },
    });
  } catch (error) {
    next(error);
  }
};

// Get weekly hours summary
exports.getWeeklyHours = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const weeklyHours = await overtimeCalculationService.getWeeklyHours(req.user.id, targetDate);

    res.json({
      success: true,
      data: {
        weeklyHours,
        date: targetDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly hours summary
exports.getMonthlyHours = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const monthlyHours = await overtimeCalculationService.getMonthlyHours(
      req.user.id,
      targetMonth,
      targetYear
    );

    res.json({
      success: true,
      data: {
        monthlyHours,
        month: targetMonth,
        year: targetYear,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Check overtime for a potential shift
exports.checkOvertime = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, startTime, and endTime are required',
      });
    }

    const overtimeCheck = await overtimeCalculationService.checkOvertime(req.user.id, {
      date,
      startTime,
      endTime,
    });

    res.json({
      success: true,
      data: overtimeCheck,
    });
  } catch (error) {
    next(error);
  }
};

