/**
 * ==================================================
 * CREDENTIAL MODEL
 * ==================================================
 * Defines the structure of Credential documents.
 * Credentials represent licenses, certifications, and qualifications
 * required for hospital personnel (e.g., RN license, ACLS certification, etc.)
 */

const mongoose = require('mongoose');

/**
 * CREDENTIAL SCHEMA
 * 
 * Defines credentials/licenses that hospital personnel need.
 * Examples: RN License, BLS Certification, ACLS, Lab Technician License, etc.
 */
const credentialSchema = new mongoose.Schema({
  // Name of the credential (e.g., "Registered Nurse License", "ACLS Certification")
  name: {
    type: String,
    required: [true, 'Credential name is required'],
    trim: true,
    unique: true,  // Each credential type is unique
  },
  
  // Description of what this credential represents
  description: {
    type: String,
    trim: true,
  },
  
  // Type of credential
  category: {
    type: String,
    enum: ['license', 'certification', 'training', 'qualification'],
    default: 'certification',
    // 'license' = Professional license (e.g., RN License, Medical License)
    // 'certification' = Certification (e.g., ACLS, BLS, PALS)
    // 'training' = Training program completion
    // 'qualification' = Other qualifications
  },
  
  // Whether this credential has an expiration date
  // Some credentials expire and need renewal (e.g., licenses, certifications)
  requiresExpiration: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Credential', credentialSchema);

