const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and manager role
router.use(authenticate);
router.use(authorize('manager'));

// Routes
router.get('/', dashboardController.getDashboardSummary);

module.exports = router;

