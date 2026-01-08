/**
 * ==================================================
 * PROFILE ROUTES
 * ==================================================
 * Base path: /api/profile
 *
 * Used by both web and mobile clients to:
 * - Get current user's profile
 * - Update profile fields (in one or more steps)
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// All routes require authentication (staff or manager)
router.use(authenticate);
router.use(authorize('staff', 'manager'));

// Validation for profile update
const updateProfileValidation = [
  body('department').optional().trim().notEmpty(),
  body('role').optional().isIn(['staff', 'manager']),
  body('facility').optional().isMongoId(),
  body('employeeId').optional().trim().notEmpty(),
  body('phoneNumber').optional().trim().notEmpty(),
  body('preferredShiftType').optional().trim().notEmpty(),
  body('yearsOfExperience').optional().isNumeric(),
  body('extraCertifications').optional().trim(),
  validate,
];

// Routes
router.get('/', profileController.getMyProfile);
router.put('/', updateProfileValidation, profileController.updateMyProfile);

module.exports = router;


