const shiftHistoryService = require('../services/shiftHistoryService');

// Get shift history
exports.getShiftHistory = async (req, res, next) => {
  try {
    const { shiftId } = req.params;
    const { limit } = req.query;

    const history = await shiftHistoryService.getShiftHistory(
      shiftId,
      limit ? parseInt(limit) : 50
    );

    res.json({
      success: true,
      count: history.length,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};

// Get history for shifts I'm involved in
exports.getMyShiftHistory = async (req, res, next) => {
  try {
    const ShiftHistory = require('../models/ShiftHistory');
    const Shift = require('../models/Shift');

    // Get shifts where user is postedBy or assignedTo
    const shifts = await Shift.find({
      $or: [
        { postedBy: req.user.id },
        { assignedTo: req.user.id },
      ],
    }).select('_id');

    const shiftIds = shifts.map(s => s._id);

    const history = await ShiftHistory.find({ shift: { $in: shiftIds } })
      .populate('shift', 'title date department')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: history.length,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};

