/**
 * ==================================================
 * SHIFTSWAP LITE - MAIN SERVER FILE
 * ==================================================
 * Hospital Shift Management System
 * 
 * This is the entry point of our application.
 * It sets up Express server, connects to MongoDB database,
 * and registers all our routes (API endpoints).
 * 
 * Designed for hospital personnel including:
 * - Doctors
 * - Nurses (RN, LPN, Nurse Practitioners)
 * - Lab Scientists and Technicians
 * - Radiology Staff
 * - Surgical Staff
 * - ICU Staff
 * - Pharmacy Staff
 * - And other hospital personnel
 */

// Import required packages
const express = require('express');      // Express framework for building the API
const mongoose = require('mongoose');    // MongoDB object modeling tool
const cors = require('cors');            // Allows cross-origin requests (frontend can call backend)
require('dotenv').config();              // Loads environment variables from .env file

// Create Express application instance
const app = express();

// ==================================================
// MIDDLEWARE SETUP
// ==================================================
// Middleware are functions that run between receiving a request and sending a response

// CORS (Cross-Origin Resource Sharing) - allows frontend from different ports to access API
app.use(cors());

// Parse incoming JSON data (when frontend sends JSON, convert it to JavaScript object)
app.use(express.json());

// Parse incoming URL-encoded data (form data)
app.use(express.urlencoded({ extended: true }));

// ==================================================
// ROUTE REGISTRATION
// ==================================================
// Import route files - each file handles a group of related endpoints
const authRoutes = require('./routes/auth');                    // Authentication: login, register
const shiftRoutes = require('./routes/shifts');                 // Shift management: create, view shifts
const swapRequestRoutes = require('./routes/swapRequests');     // Swap requests: request to swap shifts
const managerRoutes = require('./routes/manager');              // Manager actions: approve swaps
const notificationRoutes = require('./routes/notifications');   // Notifications: get user notifications
const workHoursRoutes = require('./routes/workHours');          // Work hours: track hours worked
const credentialRoutes = require('./routes/credentials');       // Credentials: manage user credentials
const facilityRoutes = require('./routes/facilities');          // Facilities: manage facilities
const shiftHistoryRoutes = require('./routes/shiftHistory');    // Shift history: view shift changes
const dashboardRoutes = require('./routes/dashboard');          // Dashboard: summary statistics
const shiftOverviewRoutes = require('./routes/shiftOverview');  // Shift overview: calendar and list views
const profileRoutes = require('./routes/profile');              // Profile: mobile/web profile completion
const staffRoutes = require('./routes/staff');                  // Staff directory: manage staff
const emergencyBroadcastRoutes = require('./routes/emergencyBroadcast'); // Emergency broadcast: send broadcasts

// Register routes with base paths
// Example: /api/auth/login becomes: base path (/api/auth) + route path (/login)
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/swap-requests', swapRequestRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/work-hours', workHoursRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/shift-history', shiftHistoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shift-overview', shiftOverviewRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/emergency-broadcast', emergencyBroadcastRoutes);

// ==================================================
// ERROR HANDLING MIDDLEWARE
// ==================================================
// This catches any errors that occur in our routes and sends a proper error response
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ==================================================
// DATABASE CONNECTION
// ==================================================
/**
 * Connect to MongoDB database
 * async/await allows us to wait for the database connection before continuing
 */
const connectDB = async () => {
  try {
    // Connect to MongoDB using connection string from .env file
    // If MONGODB_URI is not set, use default local MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://emmanita20_db_user:mylove1990@cluster0.r3vo5zx.mongodb.net/", {
      useNewUrlParser: true,      // Use new URL parser (recommended)
      useUnifiedTopology: true,   // Use new server discovery engine (recommended)
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    // If connection fails, log error and stop the application
    console.error('MongoDB connection error:', error);
    process.exit(1);  // Exit the Node.js process with error code 1
  }
};

// Call the function to connect to database
connectDB();

// ==================================================
// START THE SERVER
// ==================================================
// Get port number from environment variable, or use 3000 as default
const PORT = process.env.PORT || 3000;

// Start listening for incoming requests on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Export the app so it can be used in tests
module.exports = app;

