const ShiftSwapRequest = require('../models/ShiftSwapRequest');
const Shift = require('../models/Shift');
const Notification = require('../models/Notification');
const overtimeCalculationService = require('../services/overtimeCalculationService');
const shiftHistoryService = require('../services/shiftHistoryService');

// View all pending shift swap requests with search and filters
exports.getPendingRequests = async (req, res, next) => {
  try {
    const { search, type, priority } = req.query;

    // Build filter
    const filter = { status: 'pending' };

    // Build query for shifts
    const shiftFilter = {};
    
    // Filter by priority (high priority = emergency shifts)
    if (priority === 'high') {
      shiftFilter.isEmergency = true;
    }

    // Get all pending requests with populated data
    let pendingRequests = await ShiftSwapRequest.find(filter)
      .populate({
        path: 'shift',
        match: shiftFilter,
      })
      .populate('requestedBy', 'name email department role')
      .sort({ 'shift.isEmergency': -1, createdAt: 1 });

    // Filter out requests where shift doesn't match (for priority filter)
    pendingRequests = pendingRequests.filter(req => req.shift !== null);

    // Apply search filter (search by employee name or request details)
    if (search) {
      const searchLower = search.toLowerCase();
      pendingRequests = pendingRequests.filter(request => {
        const employeeName = request.requestedBy?.name?.toLowerCase() || '';
        const department = request.requestedBy?.department?.toLowerCase() || '';
        const shiftTitle = request.shift?.title?.toLowerCase() || '';
        return employeeName.includes(searchLower) || 
               department.includes(searchLower) || 
               shiftTitle.includes(searchLower);
      });
    }

    // Filter by type (currently only swap requests, but structure allows for future types)
    // Type filter would apply here if we had multiple request types

    // Add overtime warnings for each request
    const requestsWithOvertime = await Promise.all(
      pendingRequests.map(async (request) => {
        const overtimeCheck = await overtimeCalculationService.checkOvertime(
          request.requestedBy._id,
          {
            date: request.shift.date,
            startTime: request.shift.startTime,
            endTime: request.shift.endTime,
          }
        );

        return {
          ...request.toObject(),
          overtimeWarning: overtimeCheck.wouldExceed ? overtimeCheck : null,
        };
      })
    );

    // Calculate summary statistics
    const totalPending = await ShiftSwapRequest.countDocuments({ status: 'pending' });
    
    // Count high priority properly (emergency shifts)
    const highPriorityRequests = await ShiftSwapRequest.find({ status: 'pending' })
      .populate({
        path: 'shift',
        match: { isEmergency: true },
      });
    const highPriority = highPriorityRequests.filter(req => req.shift !== null).length;

    // Time off requests count (currently 0 as we only have swap requests)
    // This is for future implementation when time off requests are added
    const timeOffRequestCount = 0;

    res.json({
      success: true,
      count: requestsWithOvertime.length,
      data: {
        swapRequests: requestsWithOvertime,
        summary: {
          totalPending,
          highPriority,
          timeOffRequest: timeOffRequestCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Approve a shift request
exports.approveRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const swapRequest = await ShiftSwapRequest.findById(requestId)
      .populate('shift')
      .populate('requestedBy');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found',
      });
    }

    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending',
      });
    }

    // Update swap request
    swapRequest.status = 'approved';
    swapRequest.manager = req.user.id;
    await swapRequest.save();

    // Check overtime before approving
    const overtimeCheck = await overtimeCalculationService.checkOvertime(
      swapRequest.requestedBy._id,
      {
        date: swapRequest.shift.date,
        startTime: swapRequest.shift.startTime,
        endTime: swapRequest.shift.endTime,
      }
    );

    // Update shift: assign to requesting staff and set status to approved
    const shift = await Shift.findById(swapRequest.shift._id);
    const previousAssignedTo = shift.assignedTo;
    shift.assignedTo = swapRequest.requestedBy._id;
    shift.status = 'approved';
    await shift.save();

    // Record work hours
    await overtimeCalculationService.recordWorkHours(
      swapRequest.requestedBy._id,
      shift._id,
      shift.date,
      shift.startTime,
      shift.endTime
    );

    // Record history
    await shiftHistoryService.recordHistory(
      shift._id,
      'approved',
      req.user.id,
      { assignedTo: previousAssignedTo, status: 'requested' },
      { assignedTo: swapRequest.requestedBy._id, status: 'approved' },
      'Shift swap request approved by manager'
    );

    // Create notification for the requesting staff
    const notificationMessage = overtimeCheck.wouldExceed
      ? `Your shift swap request for "${shift.title}" on ${shift.date.toDateString()} has been approved. Note: This will result in overtime (${overtimeCheck.projectedHours.toFixed(1)} hours this week).`
      : `Your shift swap request for "${shift.title}" on ${shift.date.toDateString()} has been approved.`;

    await Notification.create({
      user: swapRequest.requestedBy._id,
      message: notificationMessage,
      type: 'approval',
      relatedShift: shift._id,
    });

    const updatedRequest = await ShiftSwapRequest.findById(requestId)
      .populate('shift')
      .populate('requestedBy', 'name email')
      .populate('manager', 'name email');

    res.json({
      success: true,
      message: 'Shift swap request approved successfully',
      data: {
        swapRequest: updatedRequest,
        overtimeWarning: overtimeCheck.wouldExceed ? overtimeCheck : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reject a shift request
exports.rejectRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const swapRequest = await ShiftSwapRequest.findById(requestId)
      .populate('shift')
      .populate('requestedBy');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found',
      });
    }

    if (swapRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending',
      });
    }

    // Update swap request
    swapRequest.status = 'rejected';
    swapRequest.manager = req.user.id;
    await swapRequest.save();

    // Update shift: set status back to 'open'
    const shift = await Shift.findById(swapRequest.shift._id);
    const previousStatus = shift.status;
    shift.status = 'open';
    await shift.save();

    // Record history
    await shiftHistoryService.recordHistory(
      shift._id,
      'rejected',
      req.user.id,
      { status: previousStatus },
      { status: 'open' },
      'Shift swap request rejected by manager'
    );

    // Create notification for the requesting staff
    await Notification.create({
      user: swapRequest.requestedBy._id,
      message: `Your shift swap request for "${shift.title}" on ${shift.date.toDateString()} has been rejected.`,
      type: 'rejection',
      relatedShift: shift._id,
    });

    const updatedRequest = await ShiftSwapRequest.findById(requestId)
      .populate('shift')
      .populate('requestedBy', 'name email')
      .populate('manager', 'name email');

    res.json({
      success: true,
      message: 'Shift swap request rejected successfully',
      data: { swapRequest: updatedRequest },
    });
  } catch (error) {
    next(error);
  }
};

