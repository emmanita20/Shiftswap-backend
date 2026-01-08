const express = require('express');
const router = express.Router();
const shiftOverviewController = require('../controllers/shiftOverviewController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and manager role
router.use(authenticate);
router.use(authorize('manager'));

// Routes
router.get('/calendar', shiftOverviewController.getCalendarView);
router.get('/list', shiftOverviewController.getListView);

module.exports = router;

