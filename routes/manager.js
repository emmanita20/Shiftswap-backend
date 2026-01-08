const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// All routes require authentication and manager role
router.use(authenticate);
router.use(authorize('manager'));

// Validation rules
const approveRequestValidation = [
  body('requestId').notEmpty().withMessage('Request ID is required'),
  validate,
];

const rejectRequestValidation = [
  body('requestId').notEmpty().withMessage('Request ID is required'),
  validate,
];

// Routes
router.get('/pending-requests', managerController.getPendingRequests);
router.post('/approve', approveRequestValidation, managerController.approveRequest);
router.post('/reject', rejectRequestValidation, managerController.rejectRequest);

module.exports = router;

