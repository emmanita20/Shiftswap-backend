const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Validation rules
const markAsReadValidation = [
  body('notificationId').notEmpty().withMessage('Notification ID is required'),
  validate,
];

const markAsTreatedValidation = [
  body('notificationId').notEmpty().withMessage('Notification ID is required'),
  validate,
];

// Routes
router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/mark-read', markAsReadValidation, notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.post('/mark-treated', markAsTreatedValidation, notificationController.markAsTreated);

module.exports = router;

