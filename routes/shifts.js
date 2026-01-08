/**
 * ==================================================
 * SHIFT ROUTES
 * ==================================================
 * Defines all shift-related API endpoints.
 * 
 * Base path: /api/shifts
 * 
 * Routes in this file:
 * - POST /api/shifts - Create a new shift
 * - GET /api/shifts/available - Get available shifts user can apply for
 * - GET /api/shifts/emergency - Get emergency shifts
 * - GET /api/shifts/my-shifts - Get shifts posted by current user
 * - GET /api/shifts/:id - Get a specific shift by ID
 * - PUT /api/shifts/:id - Update a shift (Manager or owner only)
 * - DELETE /api/shifts/:id - Delete a shift (Manager only)
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

/**
 * CREATE SHIFT VALIDATION RULES
 * 
 * Validates data when creating a new shift.
 */
const createShiftValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),  // Must be valid date format
  body('startTime').trim().notEmpty().withMessage('Start time is required'),
  body('endTime').trim().notEmpty().withMessage('End time is required'),
  body('requiredCredentials').optional().isArray(),  // Optional, but if provided must be an array
  body('isEmergency').optional().isBoolean(),  // Optional, but if provided must be true/false
  body('incentiveAmount').optional().isNumeric().withMessage('Incentive amount must be a number'),
  body('assignedTo').optional().isMongoId().withMessage('AssignedTo must be a valid user ID'),
  validate,
];

/**
 * UPDATE SHIFT VALIDATION RULES
 * 
 * Validates data when updating a shift.
 */
const updateShiftValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('startTime').optional().trim().notEmpty().withMessage('Start time cannot be empty'),
  body('endTime').optional().trim().notEmpty().withMessage('End time cannot be empty'),
  body('requiredCredentials').optional().isArray(),
  body('isEmergency').optional().isBoolean(),
  body('incentiveAmount').optional().isNumeric().withMessage('Incentive amount must be a number'),
  body('assignedTo').optional().isMongoId().withMessage('AssignedTo must be a valid user ID'),
  body('status').optional().isIn(['open', 'requested', 'approved']).withMessage('Status must be open, requested, or approved'),
  validate,
];

/**
 * ==================================================
 * MIDDLEWARE FOR ALL ROUTES
 * ==================================================
 * 
 * router.use() applies middleware to ALL routes in this file.
 * These run before any route handler.
 */

// Require user to be logged in (authenticated)
router.use(authenticate);

// Require user to have 'staff' or 'manager' role
// This means only staff and managers can access shift routes
router.use(authorize('staff', 'manager'));

/**
 * ==================================================
 * ROUTE DEFINITIONS
 * ==================================================
 */

// POST /api/shifts - Create a new shift
// Uses createShiftValidation to validate input
router.post('/', createShiftValidation, shiftController.createShift);

// GET /api/shifts/available - Get shifts available for the user to apply for
// Filters by department and user credentials
router.get('/available', shiftController.getAvailableShifts);

// GET /api/shifts/emergency - Get emergency shifts in user's department
router.get('/emergency', shiftController.getEmergencyShifts);

// GET /api/shifts/my-shifts - Get all shifts posted by the current user
router.get('/my-shifts', shiftController.getMyShifts);

// GET /api/shifts/my-assigned - Get shifts assigned to the current user
// Used by mobile "My Schedule" and home dashboard
router.get('/my-assigned', shiftController.getMyAssignedShifts);

// GET /api/shifts/:id - Get a specific shift by ID
// :id is a URL parameter (e.g., /api/shifts/123456)
router.get('/:id', shiftController.getShiftById);

// PUT /api/shifts/:id - Update a shift
// Only managers or shift owners can update shifts
// Uses updateShiftValidation to validate input
router.put('/:id', updateShiftValidation, shiftController.updateShift);

// DELETE /api/shifts/:id - Delete a shift
// Only managers can delete shifts
router.delete('/:id', shiftController.deleteShift);

module.exports = router;

