/**
 * ==================================================
 * SHIFT MODEL
 * ==================================================
 * Defines the structure of Shift documents in the database.
 * A shift represents a work period that needs to be filled.
 */

const mongoose = require('mongoose');

/**
 * SHIFT SCHEMA
 * 
 * Defines all the fields that a shift document contains.
 */
const shiftSchema = new mongoose.Schema({
  // Title/description of the shift
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  
  // Department this shift is for (hospital department)
  // Examples: "Nursing", "Emergency Medicine", "Laboratory", "Radiology",
  //           "Surgery", "ICU", "Cardiology", "Pediatrics", "Pharmacy", etc.
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
  },
  
  // Date of the shift
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  
  // Start time (stored as string, e.g., "09:00")
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true,
  },
  
  // End time (stored as string, e.g., "17:00")
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true,
  },
  
  // User who posted/created this shift
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to User model
    required: [true, 'Posted by user is required'],
  },
  
  // Current status of the shift
  status: {
    type: String,
    enum: ['open', 'requested', 'approved'],  // Can only be one of these
    default: 'open',  // New shifts start as 'open'
    // 'open' = available, no requests yet
    // 'requested' = someone requested to take it, awaiting approval
    // 'approved' = manager approved, shift is assigned
  },
  
  // User who is assigned to work this shift (null until approved)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to User model
    default: null,  // No one assigned initially
  },
  
  // Facility where this shift is located
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',  // Reference to Facility model
    default: null,  // Optional - can be null
  },
  
  // Array of credentials required to take this shift
  // Only users with these credentials can request this shift
  requiredCredentials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credential',  // Reference to Credential model
  }],
  
  // Whether this is an emergency shift (urgent, needs quick filling)
  isEmergency: {
    type: Boolean,
    default: false,  // Most shifts are not emergencies
  },
  
  // Bonus/incentive pay amount for this shift (in dollars)
  incentiveAmount: {
    type: Number,
    default: 0,  // No incentive by default
    min: 0,  // Can't be negative
  },
  
  // Description of the incentive (why there's bonus pay)
  incentiveDescription: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

// Export the Shift model
module.exports = mongoose.model('Shift', shiftSchema);

