/**
 * ==================================================
 * STAFF ROUTES
 * ==================================================
 * Defines all staff directory API endpoints.
 * 
 * Base path: /api/staff
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// All routes require manager role
router.use(authorize('manager'));

// Validation rules
const updateStaffStatusValidation = [
  body('isActive').optional().isBoolean(),
  body('department').optional().trim().notEmpty(),
  body('role').optional().isIn(['staff', 'manager']),
  validate,
];

// Routes
router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.patch('/:id/status', updateStaffStatusValidation, staffController.updateStaffStatus);

module.exports = router;

