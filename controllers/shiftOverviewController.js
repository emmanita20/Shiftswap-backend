const Shift = require('../models/Shift');

/**
 * Calculate coverage status for a shift
 * Fully Covered: shift has assigned staff
 * Partial Coverage: shift is requested but not yet approved
 * Understaffed: shift is open with no requests
 */
function calculateCoverageStatus(shift) {
  if (shift.status === 'approved' && shift.assignedTo) {
    return 'Fully Covered';
  } else if (shift.status === 'requested') {
    return 'Partial Coverage';
  } else if (shift.status === 'open') {
    return 'Understaffed';
  }
  return 'Unknown';
}

/**
 * GET SHIFT OVERVIEW - Calendar View
 * Returns shifts grouped by date for calendar display
 */
exports.getCalendarView = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Build filter
    const filter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate) {
      // If only start date, get that week
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      filter.date = { $gte: start, $lt: end };
    }

    if (department) {
      filter.department = department;
    }

    // Get shifts
    const shifts = await Shift.find(filter)
      .populate('assignedTo', 'name email')
      .populate('postedBy', 'name email')
      .sort({ date: 1, startTime: 1 });

    // Group shifts by date
    const shiftsByDate = {};
    
    shifts.forEach(shift => {
      const dateKey = shift.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!shiftsByDate[dateKey]) {
        shiftsByDate[dateKey] = [];
      }

      const coverageStatus = calculateCoverageStatus(shift);
      
      shiftsByDate[dateKey].push({
        _id: shift._id,
        title: shift.title,
        startTime: shift.startTime,
        endTime: shift.endTime,
        department: shift.department,
        coverageStatus,
        status: shift.status,
        isEmergency: shift.isEmergency,
        assignedTo: shift.assignedTo?.name || null,
      });
    });

    // Format response
    const calendarData = Object.keys(shiftsByDate).map(date => ({
      date,
      shifts: shiftsByDate[date],
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        calendarData,
        count: shifts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SHIFT OVERVIEW - List View
 * Returns shifts in list format with filtering
 */
exports.getListView = async (req, res, next) => {
  try {
    const { startDate, endDate, department, status, coverageStatus } = req.query;

    // Build filter
    const filter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      filter.date = { $gte: start, $lt: end };
    }

    if (department) {
      filter.department = department;
    }

    if (status) {
      filter.status = status;
    }

    // Get shifts
    let shifts = await Shift.find(filter)
      .populate('assignedTo', 'name email department')
      .populate('postedBy', 'name email')
      .sort({ date: 1, startTime: 1 });

    // Add coverage status to each shift
    shifts = shifts.map(shift => {
      const coverageStatus = calculateCoverageStatus(shift);
      return {
        ...shift.toObject(),
        coverageStatus,
      };
    });

    // Filter by coverage status if provided
    let filteredShifts = shifts;
    if (coverageStatus) {
      filteredShifts = shifts.filter(shift => shift.coverageStatus === coverageStatus);
    }

    res.json({
      success: true,
      count: filteredShifts.length,
      data: {
        shifts: filteredShifts,
      },
    });
  } catch (error) {
    next(error);
  }
};

