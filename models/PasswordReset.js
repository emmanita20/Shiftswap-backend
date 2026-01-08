/**
 * ==================================================
 * PASSWORD RESET TOKEN MODEL
 * ==================================================
 * Stores password reset tokens for forgot password functionality
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    default: () => new Date(Date.now() + 3600000), // 1 hour from now
    index: { expireAfterSeconds: 0 }, // Auto-delete expired tokens
  },
  used: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Generate a secure random token (static method)
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Instance method to generate token (alternative)
passwordResetSchema.methods.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);

