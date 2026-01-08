const express = require('express');
const router = express.Router();
const workHoursController = require('../controllers/workHoursController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(authorize('staff', 'manager'));

// Routes
router.get('/', workHoursController.getMyWorkHours);
router.get('/weekly', workHoursController.getWeeklyHours);
router.get('/monthly', workHoursController.getMonthlyHours);
router.post('/check-overtime', workHoursController.checkOvertime);

module.exports = router;

