const Notification = require('../models/Notification');

// Get notifications for logged-in user
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { filter: filterType, status } = req.query;
    const filter = { user: req.user.id };

    // Filter by type: 'all', 'unread', 'action-required'
    if (filterType === 'unread') {
      filter.isRead = false;
      filter.status = 'new'; // Only show new/unread notifications
    } else if (filterType === 'action-required') {
      filter.requiresAction = true;
      filter.status = { $ne: 'treated' }; // Don't show treated notifications
    }
    // 'all' or no filter shows everything

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    const notifications = await Notification.find(filter)
      .populate('relatedShift')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent notifications

    // Determine display status for each notification
    const notificationsWithStatus = notifications.map(notif => {
      let displayStatus = 'Read';
      if (notif.status === 'new' || !notif.isRead) {
        displayStatus = 'New';
      } else if (notif.status === 'treated') {
        displayStatus = 'Treated';
      }

      return {
        ...notif.toObject(),
        displayStatus,
      };
    });

    res.json({
      success: true,
      count: notificationsWithStatus.length,
      data: { notifications: notificationsWithStatus },
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    notification.isRead = true;
    if (notification.status === 'new') {
      notification.status = 'read';
    }
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, status: 'new' },
      { isRead: true, status: 'read' }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as treated
exports.markAsTreated = async (req, res, next) => {
  try {
    const { notificationId } = req.body;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check if notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    notification.status = 'treated';
    notification.isRead = true;
    notification.requiresAction = false;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as treated',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
};

