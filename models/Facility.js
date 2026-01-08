/**
 * ==================================================
 * FACILITY MODEL
 * ==================================================
 * Defines the structure of Facility documents.
 * Represents a hospital or healthcare facility with multiple departments.
 */

const mongoose = require('mongoose');

/**
 * FACILITY SCHEMA
 * 
 * Defines a healthcare facility (hospital, clinic, etc.) with its departments.
 * Each facility can have multiple departments (Nursing, Emergency Medicine, Laboratory, etc.)
 * with department-specific configurations.
 */
const facilitySchema = new mongoose.Schema({
  // Name of the healthcare facility (e.g., "City General Hospital", "Regional Medical Center")
  name: {
    type: String,
    required: [true, 'Facility name is required'],
    trim: true,
  },
  
  // Physical address of the facility
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA',
    },
  },
  
  // Array of departments within this facility
  // Examples: Nursing, Emergency Medicine, Laboratory, Radiology, Surgery, ICU, etc.
  departments: [{
    // Department name (e.g., "Nursing", "Emergency Medicine", "Laboratory")
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Default credentials required for this department
    // (e.g., Nursing might require RN License, BLS Certification)
    defaultRequiredCredentials: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Credential',  // Reference to Credential model
    }],
    
    // Overtime threshold for this department (hours per week)
    // Default is 40 hours per week (standard full-time)
    defaultOvertimeThreshold: {
      type: Number,
      default: 40,  // hours per week
    },
  }],
  
  // Whether this facility is active (can be deactivated if facility closes)
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

module.exports = mongoose.model('Facility', facilitySchema);

