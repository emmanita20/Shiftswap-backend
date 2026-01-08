const express = require('express');
const router = express.Router();
const shiftHistoryController = require('../controllers/shiftHistoryController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(authorize('staff', 'manager'));

// Routes
router.get('/my-history', shiftHistoryController.getMyShiftHistory);
router.get('/shift/:shiftId', shiftHistoryController.getShiftHistory);

module.exports = router;

