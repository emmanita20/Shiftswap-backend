/**
 * ==================================================
 * USER MODEL
 * ==================================================
 * Defines the structure and behavior of User documents in MongoDB.
 * This is like a blueprint for what user data looks like in the database.
 */

const mongoose = require('mongoose');  // MongoDB object modeling
const bcrypt = require('bcryptjs');    // Password hashing library

/**
 * USER SCHEMA
 * 
 * Defines the fields (columns) that each user document will have.
 * Mongoose uses this to validate and structure data.
 */
const userSchema = new mongoose.Schema({
  // User's full name
  name: {
    type: String,
    required: [true, 'Name is required'],  // Must have a value
    trim: true,  // Remove whitespace from start/end
  },
  
  // User's email address (used for login)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,  // No two users can have the same email
    lowercase: true,  // Convert to lowercase before saving
    trim: true,  // Remove whitespace
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],  // Must match email pattern
  },
  
  // User's password (will be hashed before saving)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,  // Minimum 6 characters
    select: false,  // Don't include password when querying users (security)
  },
  
  // User's role in the hospital
  // 'staff' = Regular hospital personnel (Doctors, Nurses, Lab Scientists, Technicians, etc.)
  // 'manager' = Department heads, HR managers, administrators who can approve shift swaps
  role: {
    type: String,
    enum: ['staff', 'manager'],  // Can only be one of these values
    required: [true, 'Role is required'],
  },
  
  // Department the user works in (hospital department)
  // Examples: "Nursing", "Emergency Medicine", "Laboratory", "Radiology", 
  //           "Surgery", "ICU", "Cardiology", "Pediatrics", "Pharmacy", etc.
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
  },
  
  // Facility the user is assigned to (optional)
  // Reference to Facility collection (like a foreign key)
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',  // Points to Facility model
    default: null,  // Can be null (no facility assigned)
  },
  
  // Array of user's credentials/licenses
  // Each credential has details like license number, expiration date, etc.
  credentials: [{
    credential: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Credential',  // Points to Credential model
      required: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    issuedDate: {
      type: Date,  // When the credential was issued
    },
    expirationDate: {
      type: Date,  // When the credential expires
    },
    isActive: {
      type: Boolean,
      default: true,  // Credential is active by default
    },
  }],
  
  // Whether the user account is active
  // Managers can deactivate accounts to prevent login
  isActive: {
    type: Boolean,
    default: true,  // Accounts are active by default
  },

  // OPTIONAL FIELDS USED MAINLY BY THE MOBILE APP
  // Phone number for contact/emergency notifications
  phoneNumber: {
    type: String,
    trim: true,
  },

  // Preferred shift type (free text so product can evolve without backend changes)
  // Examples: "Day", "Evening", "Night", "Rotating"
  preferredShiftType: {
    type: String,
    trim: true,
  },

  // Years of experience in current profession
  yearsOfExperience: {
    type: Number,
    min: 0,
  },

  // Internal employee ID used by the hospital
  employeeId: {
    type: String,
    trim: true,
  },

  // Optional free‑form certifications note used during profile setup
  extraCertifications: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

/**
 * PRE-SAVE HOOK (Middleware)
 * 
 * This function runs automatically before saving a user to the database.
 * It hashes the password so we never store plain text passwords.
 * 
 * Only hashes if password was modified (not on every save).
 */
userSchema.pre('save', async function(next) {
  // If password wasn't changed, skip hashing
  // This is important: if we hash an already-hashed password, it breaks login
  if (!this.isModified('password')) return next();
  
  // Hash the password with bcrypt
  // 12 is the "salt rounds" - higher number = more secure but slower
  this.password = await bcrypt.hash(this.password, 12);
  
  // Continue with the save operation
  next();
});

/**
 * INSTANCE METHOD - Compare Password
 * 
 * This method is available on user instances (user.comparePassword()).
 * It securely compares a plain text password with the stored hashed password.
 * 
 * @param {string} candidatePassword - The password to check (from login form)
 * @returns {boolean} - True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  // bcrypt.compare() hashes the candidate password and compares with stored hash
  // Returns true if they match, false if they don't
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create the User model
const User = mongoose.model('User', userSchema);

// Drop the old 'username' index if it exists (legacy from previous schema)
// This fixes the E11000 duplicate key error
// Run this after database connection is established
if (mongoose.connection.readyState === 1) {
  // Connection is already open
  User.collection.dropIndex('username_1').catch(() => {
    // Index doesn't exist or already dropped - that's fine
  });
} else {
  // Wait for connection
  mongoose.connection.once('open', () => {
    User.collection.dropIndex('username_1').catch(() => {
      // Index doesn't exist or already dropped - that's fine
    });
  });
}

// Export the User model so it can be used in other files
module.exports = User;

