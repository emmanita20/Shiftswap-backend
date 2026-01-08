/**
 * ==================================================
 * AUTHENTICATION CONTROLLER
 * ==================================================
 * This file handles user authentication:
 * - User registration (sign up)
 * - User login
 * - Get current user info
 */

const jwt = require('jsonwebtoken');    // For creating authentication tokens
const User = require('../models/User'); // User database model
const PasswordReset = require('../models/PasswordReset'); // Password reset token model
const crypto = require('crypto'); // For generating secure tokens

/**
 * Helper function to generate JWT token
 * JWT tokens are like temporary ID cards that prove a user is logged in
 * 
 * @param {string} userId - The user's ID from database
 * @returns {string} JWT token that expires in 7 days
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },  // Data to store in token (user ID)
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',  // Secret key to sign token
    { expiresIn: '7d' }  // Token expires after 7 days
  );
};

/**
 * REGISTER - Create a new user account
 * 
 * Steps:
 * 1. Get user data from request body
 * 2. Check if email already exists
 * 3. Create new user in database (password is automatically hashed by User model)
 * 4. Generate authentication token
 * 5. Return user info and token
 */
exports.register = async (req, res, next) => {
  try {
    // Extract data from request body (sent from frontend)
    const { name, email, password, role, department } = req.body;

    // Check if user with this email already exists
    // We don't want duplicate emails in the system
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create new user in database
    // User.create() automatically hashes the password (see User model)
    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
    });

    // Generate authentication token for the new user
    // This token allows the user to access protected routes
    const token = generateToken(user._id);

    // Send success response with user data and token
    // Status 201 = "Created" - successfully created a new resource
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        // Only send safe user data (not password!)
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
        token,  // Frontend will store this token and send it with future requests
      },
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
};

/**
 * LOGIN - Authenticate existing user
 * 
 * Steps:
 * 1. Get email and password from request
 * 2. Find user by email (include password field which is normally hidden)
 * 3. Check if user exists and is active
 * 4. Compare provided password with stored password (using bcrypt)
 * 5. Generate token if password is correct
 * 6. Return user info and token
 */
exports.login = async (req, res, next) => {
  try {
    // Get login credentials from request body
    const { email, password } = req.body;

    // Find user by email
    // .select('+password') includes the password field (normally hidden for security)
    // We need it to compare with the provided password
    const user = await User.findOne({ email }).select('+password');
    
    // If user doesn't exist, return error
    // We use generic "Invalid credentials" message for security
    // (Don't tell attackers if email exists or not)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user account is active
    // Managers can deactivate accounts, preventing login
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    // Verify password
    // comparePassword() uses bcrypt to securely compare passwords
    // It hashes the provided password and compares with stored hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Password is correct! Generate authentication token
    const token = generateToken(user._id);

    // Send success response with user data and token
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        // Return user information (without password)
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
        token,  // Frontend stores this token for future requests
      },
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
};

/**
 * GET ME - Get current logged-in user's information
 * 
 * This endpoint requires authentication (user must be logged in).
 * The authenticate middleware sets req.user with the current user's info.
 * 
 * Steps:
 * 1. Get user ID from req.user (set by authenticate middleware)
 * 2. Find user in database and populate related data (facility, credentials)
 * 3. Return user information
 */
exports.getMe = async (req, res, next) => {
  try {
    // Find user by ID (from req.user set by authenticate middleware)
    // .populate() replaces IDs with actual data from related collections
    // - 'facility' -> get facility name
    // - 'credentials.credential' -> get credential details
    const user = await User.findById(req.user.id)
      .populate('facility', 'name')  // Get facility name (not just ID)
      .populate('credentials.credential', 'name description category');  // Get credential details
    
    // Send user information
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          facility: user.facility,  // Facility object with name
          // Only return active credentials (filter out inactive ones)
          credentials: user.credentials.filter(c => c.isActive),
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
};

/**
 * LOGOUT - Logout current user
 * 
 * Note: Since we're using stateless JWT tokens, logout is primarily handled client-side
 * by deleting the token. This endpoint provides a server-side confirmation.
 * 
 * For true server-side logout, you would need to implement a token blacklist.
 * For now, this endpoint just confirms the logout request.
 */
exports.logout = async (req, res, next) => {
  try {
    // Logout is primarily handled client-side by removing the token
    // This endpoint confirms the logout request
    // In production, you might want to implement token blacklisting here
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      data: {
        message: 'Please remove the token from client storage',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * FORGOT PASSWORD - Request password reset
 * 
 * Steps:
 * 1. Get email from request
 * 2. Find user by email
 * 3. Generate secure reset token
 * 4. Save token to database with expiration (1 hour)
 * 5. Return success (in production, send email with reset link)
 * 
 * Note: In production, you would send an email with the reset link
 * For now, we return the token in the response (for testing)
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    // Always return success message (don't reveal if email exists)
    // This prevents email enumeration attacks
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate secure reset token
    const resetToken = PasswordReset.generateToken();
    
    // Save reset token to database
    await PasswordReset.create({
      user: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });

    // In production, send email with reset link
    // For now, return token in response (for testing purposes only)
    // TODO: Replace with email sending service (SendGrid, AWS SES, etc.)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In production, remove this data object - only send email
      // This is here for testing purposes
      data: {
        resetToken, // Remove in production
        resetLink,  // Remove in production
        expiresIn: '1 hour',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * RESET PASSWORD - Reset password using reset token
 * 
 * Steps:
 * 1. Get token and new password from request
 * 2. Find valid reset token in database
 * 3. Check if token is expired or already used
 * 4. Find user associated with token
 * 5. Update user password
 * 6. Mark token as used
 * 7. Return success
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Find reset token
    const passwordReset = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Find user
    const user = await User.findById(passwordReset.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update password (will be hashed automatically by User model)
    user.password = password;
    await user.save();

    // Mark token as used
    passwordReset.used = true;
    await passwordReset.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

