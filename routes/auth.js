/**
 * ==================================================
 * AUTHENTICATION ROUTES
 * ==================================================
 * Defines all authentication-related API endpoints.
 * 
 * Routes in this file:
 * - POST /api/auth/register - Create a new user account
 * - POST /api/auth/login - Login with email and password
 * - GET /api/auth/me - Get current logged-in user's info
 */

const express = require('express');
const { body } = require('express-validator');  // Validation library
const router = express.Router();  // Create router instance
const authController = require('../controllers/authController');  // Controller with route handlers
const { authenticate } = require('../middleware/auth');  // Middleware to check if user is logged in
const validate = require('../middleware/validation');  // Middleware to check validation results

/**
 * REGISTRATION VALIDATION RULES
 * 
 * These rules validate the data sent when registering a new user.
 * Each rule checks a field and returns an error message if validation fails.
 */
const registerValidation = [
  // Name must not be empty
  body('name').trim().notEmpty().withMessage('Name is required'),
  
  // Email must be a valid email format
  body('email').isEmail().withMessage('Please provide a valid email'),
  
  // Password must be at least 6 characters long
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  // Role must be either 'staff' or 'manager'
  body('role').isIn(['staff', 'manager']).withMessage('Role must be staff or manager'),
  
  // Department must not be empty
  body('department').trim().notEmpty().withMessage('Department is required'),
  
  // Run the validate middleware to check if any validation failed
  validate,
];

/**
 * LOGIN VALIDATION RULES
 * 
 * These rules validate the data sent when logging in.
 */
const loginValidation = [
  // Email must be a valid email format
  body('email').isEmail().withMessage('Please provide a valid email'),
  
  // Password must be provided (not empty)
  body('password').notEmpty().withMessage('Password is required'),
  
  // Run the validate middleware to check if any validation failed
  validate,
];

/**
 * FORGOT PASSWORD VALIDATION RULES
 */
const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  validate,
];

/**
 * RESET PASSWORD VALIDATION RULES
 */
const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

/**
 * ==================================================
 * ROUTE DEFINITIONS
 * ==================================================
 */

// POST /api/auth/register - Register a new user
// Uses registerValidation middleware to validate input before controller runs
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login - Login with email and password
// Uses loginValidation middleware to validate input before controller runs
router.post('/login', loginValidation, authController.login);

// POST /api/auth/logout - Logout current user
// Uses authenticate middleware to ensure user is logged in
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me - Get current user's information
// Uses authenticate middleware to ensure user is logged in
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/forgot-password - Request password reset
// Uses forgotPasswordValidation middleware to validate input
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
// Uses resetPasswordValidation middleware to validate input
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Export the router so it can be used in server.js
module.exports = router;

