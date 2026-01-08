/**
 * ==================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ==================================================
 * Middleware functions that run before route handlers
 * to check if user is logged in and has permission.
 */

const jwt = require('jsonwebtoken');    // JSON Web Token - used for authentication
const User = require('../models/User'); // User model to fetch user data

/**
 * AUTHENTICATE MIDDLEWARE
 * 
 * This middleware checks if the user is logged in by:
 * 1. Getting the token from the request headers
 * 2. Verifying the token is valid
 * 3. Finding the user in the database
 * 4. Attaching user info to the request object
 * 
 * If authentication fails, it stops the request and returns an error.
 * If successful, it calls next() to continue to the route handler.
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>" - so we split by space and take the second part
    const token = req.headers.authorization?.split(' ')[1];

    // If no token provided, user is not authenticated
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please provide a token.' 
      });
    }

    // Verify the token is valid and hasn't expired
    // jwt.verify() will throw an error if token is invalid
    // decoded contains the data we put in the token (like userId)
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    );

    // Find the user in database using the userId from the token
    // .select('-password') means: get all fields EXCEPT password (for security)
    const user = await User.findById(decoded.userId).select('-password');

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive user.' 
      });
    }

    // Attach user information to the request object
    // Now route handlers can access req.user without querying database again
    req.user = user;
    
    // Call next() to continue to the next middleware or route handler
    next();
  } catch (error) {
    // If token verification fails (invalid, expired, etc.), return error
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

/**
 * AUTHORIZE MIDDLEWARE (Role-based access control)
 * 
 * This middleware checks if the user has the right role/permission.
 * It's a "higher-order function" - a function that returns another function.
 * 
 * Usage example: authorize('manager') - only managers can access
 * Usage example: authorize('staff', 'manager') - both staff and managers can access
 * 
 * @param {...string} roles - One or more allowed roles (e.g., 'staff', 'manager')
 * @returns {Function} Middleware function that checks user role
 */
const authorize = (...roles) => {
  // Return a middleware function
  return (req, res, next) => {
    // Check if the current user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      // User doesn't have required role - deny access
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    // User has required role - allow access
    next();
  };
};

// Export both functions so they can be used in routes
module.exports = { authenticate, authorize };

