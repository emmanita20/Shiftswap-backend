/**
 * ==================================================
 * EMERGENCY BROADCAST CONTROLLER
 * ==================================================
 * Handles emergency broadcast operations:
 * - Send emergency broadcast messages to all staff
 * - Filter recipients by availability and qualifications
 * - Track broadcast delivery
 */

const User = require('../models/User');
const Notification = require('../models/Notification');
const Shift = require('../models/Shift');
const overtimeCalculationService = require('../services/overtimeCalculationService');

/**
 * SEND EMERGENCY BROADCAST - Send emergency message to all available staff
 * 
 * Features:
 * - Sends to all active staff or filtered by department/qualifications
 * - Creates notifications for all recipients
 * - Can specify time coverage needed (Now + 4/8/12 hours)
 * - Supports multiple delivery channels (notifications, future: SMS, email)
 * 
 * Request body:
 * - message: Broadcast message text
 * - department: (optional) Filter by department
 * - coverageHours: (optional) Hours from now for coverage (4, 8, or 12)
 * - deliveryChannels: (optional) Array of channels ['mobile', 'email']
 * - additionalInstructions: (optional) Additional instructions
 */
exports.sendEmergencyBroadcast = async (req, res, next) => {
  try {
    const {
      message,
      department,
      coverageHours,
      deliveryChannels = ['notification'],
      additionalInstructions,
    } = req.body;

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Broadcast message is required',
      });
    }

    // Build recipient filter
    const recipientFilter = {
      isActive: true,
      role: 'staff', // Only send to staff, not managers
    };

    // Filter by department if provided
    if (department && department !== 'All') {
      recipientFilter.department = department;
    }

    // Get all eligible staff
    const eligibleStaff = await User.find(recipientFilter)
      .populate('credentials.credential', 'name')
      .select('-password');

    // Calculate coverage time window if provided
    let coverageStartTime = null;
    let coverageEndTime = null;
    if (coverageHours) {
      coverageStartTime = new Date();
      coverageEndTime = new Date();
      coverageEndTime.setHours(coverageEndTime.getHours() + parseInt(coverageHours));
    }

    // Create notifications for all eligible staff
    const notificationPromises = eligibleStaff.map(async (staff) => {
      // Build notification message
      let notificationMessage = message;
      
      if (coverageHours) {
        notificationMessage += `\n\nUrgent coverage needed: ${coverageStartTime.toLocaleTimeString()} - ${coverageEndTime.toLocaleTimeString()}`;
      }
      
      if (additionalInstructions) {
        notificationMessage += `\n\nAdditional Instructions: ${additionalInstructions}`;
      }

      // Create notification
      return Notification.create({
        user: staff._id,
        message: notificationMessage,
        type: 'emergency_broadcast',
        isRead: false,
        status: 'new',
        requiresAction: true, // Emergency broadcasts require action
      });
    });

    // Wait for all notifications to be created
    const notifications = await Promise.all(notificationPromises);

    // Get count of staff who might be available (not currently on shift)
    const now = new Date();
    const activeShifts = await Shift.find({
      assignedTo: { $in: eligibleStaff.map(s => s._id) },
      date: { $lte: now },
      status: 'approved',
    })
      .populate('assignedTo', '_id')
      .select('assignedTo endTime');

    // Filter out staff currently on shift
    const currentlyOnShift = new Set();
    activeShifts.forEach(shift => {
      if (shift.assignedTo) {
        const endTime = new Date(shift.date);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        endTime.setHours(endHour, endMin, 0, 0);
        
        // Handle overnight shifts
        if (endTime < new Date(shift.date)) {
          endTime.setDate(endTime.getDate() + 1);
        }
        
        if (endTime > now) {
          currentlyOnShift.add(shift.assignedTo._id.toString());
        }
      }
    });

    const availableStaff = eligibleStaff.filter(
      staff => !currentlyOnShift.has(staff._id.toString())
    );

    // TODO: In production, integrate with SMS/Email services
    // For now, we only create notifications
    // Future implementation:
    // - Send SMS via Twilio or similar
    // - Send email via SendGrid or similar
    // - Track delivery status

    res.status(201).json({
      success: true,
      message: 'Emergency broadcast sent successfully',
      data: {
        broadcast: {
          message,
          department: department || 'All Departments',
          coverageHours: coverageHours || null,
          coverageWindow: coverageHours ? {
            start: coverageStartTime,
            end: coverageEndTime,
          } : null,
          additionalInstructions: additionalInstructions || null,
          deliveryChannels,
        },
        statistics: {
          totalRecipients: eligibleStaff.length,
          availableStaff: availableStaff.length,
          currentlyOnShift: currentlyOnShift.size,
          notificationsSent: notifications.length,
        },
        recipients: eligibleStaff.map(staff => ({
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          isAvailable: !currentlyOnShift.has(staff._id.toString()),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET BROADCAST HISTORY - Get history of emergency broadcasts (Manager only)
 */
exports.getBroadcastHistory = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    // Get all emergency broadcast notifications
    const broadcasts = await Notification.find({
      type: 'emergency_broadcast',
    })
      .populate('user', 'name email department')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Group by broadcast (same message sent at same time)
    const groupedBroadcasts = {};
    broadcasts.forEach(notif => {
      const key = `${notif.message.substring(0, 50)}-${notif.createdAt.toISOString().split('T')[0]}`;
      if (!groupedBroadcasts[key]) {
        groupedBroadcasts[key] = {
          message: notif.message,
          createdAt: notif.createdAt,
          recipients: [],
          readCount: 0,
          unreadCount: 0,
        };
      }
      groupedBroadcasts[key].recipients.push({
        user: notif.user,
        isRead: notif.isRead,
        status: notif.status,
      });
      if (notif.isRead) {
        groupedBroadcasts[key].readCount++;
      } else {
        groupedBroadcasts[key].unreadCount++;
      }
    });

    const broadcastHistory = Object.values(groupedBroadcasts);

    res.json({
      success: true,
      count: broadcastHistory.length,
      data: {
        broadcasts: broadcastHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

