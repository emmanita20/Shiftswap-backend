const Shift = require('../models/Shift');
const ShiftSwapRequest = require('../models/ShiftSwapRequest');
const Notification = require('../models/Notification');

/**
 * GET DASHBOARD SUMMARY
 * Returns summary statistics and filtered shift list for the dashboard
 */
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const { date, department, status } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate summary statistics
    const pendingApprovalsCount = await ShiftSwapRequest.countDocuments({ status: 'pending' });
    
    const todaysShiftsCount = await Shift.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    const emergencyAlertsCount = await Shift.countDocuments({
      isEmergency: true,
      status: { $in: ['open', 'requested'] },
    });

    // Build filter for shift list
    const shiftFilter = {};
    
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      shiftFilter.date = { $gte: filterDate, $lt: nextDay };
    }

    if (department) {
      shiftFilter.department = department;
    }

    if (status) {
      shiftFilter.status = status;
    }

    // Get filtered shifts with assigned staff information
    const shifts = await Shift.find(shiftFilter)
      .populate('assignedTo', 'name email department')
      .populate('postedBy', 'name email')
      .sort({ date: 1, startTime: 1 })
      .limit(100);

    // Format shifts for display
    const formattedShifts = shifts.map(shift => ({
      _id: shift._id,
      title: shift.title,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      staffName: shift.assignedTo ? shift.assignedTo.name : 'Unassigned',
      department: shift.department,
      status: shift.status,
      isEmergency: shift.isEmergency,
      postedBy: shift.postedBy?.name || 'Unknown',
    }));

    res.json({
      success: true,
      data: {
        summary: {
          pendingApprovals: pendingApprovalsCount,
          todaysShifts: todaysShiftsCount,
          emergencyAlerts: emergencyAlertsCount,
        },
        shifts: formattedShifts,
        count: formattedShifts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

