const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Validation rules
const createFacilityValidation = [
  body('name').trim().notEmpty().withMessage('Facility name is required'),
  validate,
];

const updateFacilityValidation = [
  validate,
];

// Routes
router.get('/', facilityController.getAllFacilities);
router.get('/:id', facilityController.getFacilityById);

// Manager only routes
router.post('/', authorize('manager'), createFacilityValidation, facilityController.createFacility);
router.put('/:id', authorize('manager'), updateFacilityValidation, facilityController.updateFacility);

module.exports = router;

