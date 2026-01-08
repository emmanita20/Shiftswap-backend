/**
 * ==================================================
 * EMERGENCY BROADCAST ROUTES
 * ==================================================
 * Defines all emergency broadcast API endpoints.
 * 
 * Base path: /api/emergency-broadcast
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const emergencyBroadcastController = require('../controllers/emergencyBroadcastController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// All routes require manager role
router.use(authorize('manager'));

// Validation rules
const sendBroadcastValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Broadcast message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  body('department').optional().trim(),
  body('coverageHours').optional().isIn([4, 8, 12]).withMessage('Coverage hours must be 4, 8, or 12'),
  body('deliveryChannels').optional().isArray(),
  body('additionalInstructions').optional().trim().isLength({ max: 500 }),
  validate,
];

// Routes
router.post('/send', sendBroadcastValidation, emergencyBroadcastController.sendEmergencyBroadcast);
router.get('/history', emergencyBroadcastController.getBroadcastHistory);

module.exports = router;

