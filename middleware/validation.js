/**
 * ==================================================
 * VALIDATION MIDDLEWARE
 * ==================================================
 * This middleware checks if request data is valid
 * based on validation rules defined in routes.
 * 
 * It works with express-validator package.
 */

const { validationResult } = require('express-validator');

/**
 * VALIDATE MIDDLEWARE
 * 
 * This middleware checks if there are any validation errors
 * from express-validator rules. If errors exist, it stops
 * the request and returns the errors. If no errors, it
 * continues to the next middleware/route handler.
 * 
 * Usage: Add validation rules in routes, then use this middleware
 * Example: router.post('/register', [validation rules], validate, controller)
 */
const validate = (req, res, next) => {
  // Get validation errors from express-validator
  // validationResult() extracts errors from the request object
  const errors = validationResult(req);
  
  // Check if there are any validation errors
  if (!errors.isEmpty()) {
    // If errors exist, send error response and stop the request
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),  // Array of error objects with field names and messages
    });
  }
  
  // No errors - continue to the next middleware or route handler
  next();
};

module.exports = validate;

