/**
 * ==================================================
 * ERROR HANDLING MIDDLEWARE
 * ==================================================
 * This middleware catches all errors from route handlers
 * and sends a user-friendly error response.
 * 
 * In Express, error-handling middleware has 4 parameters (err, req, res, next)
 * Express automatically knows it's an error handler because of the 4 parameters.
 */

const errorHandler = (err, req, res, next) => {
  // Create a copy of the error object
  // We'll modify this to create a user-friendly error response
  let error = { ...err };
  error.message = err.message;

  // Log the full error to console for debugging
  // This helps developers see what went wrong
  console.error(err);

  // ==================================================
  // HANDLE SPECIFIC ERROR TYPES
  // ==================================================

  // Mongoose CastError - happens when invalid ID format is used (e.g., "abc123" instead of proper ObjectId)
  // Example: User tries to get shift with ID "invalid-id"
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key error (error code 11000)
  // Happens when trying to create a document with a field that must be unique
  // Example: Trying to register with an email that already exists
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  // Happens when required fields are missing or invalid
  // Example: Trying to create user without email or with invalid email format
  if (err.name === 'ValidationError') {
    // Extract all validation error messages and join them with commas
    // Object.values() gets all error messages from the errors object
    // .map() extracts the message from each error
    // .join(', ') combines all messages into one string
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // ==================================================
  // SEND ERROR RESPONSE
  // ==================================================
  // Send error response with appropriate status code (default 500 for server errors)
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    // Only show error stack trace in development mode (for debugging)
    // In production, we don't want to expose technical details to users
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

