/**
 * ==================================================
 * CREDENTIAL VERIFICATION SERVICE
 * ==================================================
 * This service handles checking if users have the required
 * credentials/licenses to take certain shifts.
 */

const User = require('../models/User');

/**
 * VERIFY USER CREDENTIALS
 * 
 * Checks if a user has all required credentials for a shift.
 * Also checks if any credentials have expired.
 * 
 * @param {ObjectId} userId - The user's ID to check
 * @param {Array} requiredCredentialIds - Array of credential IDs that are required
 * @returns {Object} Object with:
 *   - isValid: boolean - True if user has all required, non-expired credentials
 *   - missingCredentials: Array - IDs of credentials user doesn't have
 *   - expiredCredentials: Array - Credentials user has but are expired
 */
exports.verifyUserCredentials = async (userId, requiredCredentialIds) => {
  // If no credentials required, user automatically qualifies
  if (!requiredCredentialIds || requiredCredentialIds.length === 0) {
    return { isValid: true, missingCredentials: [], expiredCredentials: [] };
  }

  // Get user with their credentials populated (get full credential details)
  const user = await User.findById(userId).populate('credentials.credential');
  
  // If user doesn't exist, they don't have any credentials
  if (!user) {
    return { isValid: false, missingCredentials: requiredCredentialIds, expiredCredentials: [] };
  }

  // Get array of credential IDs that the user has (only active ones)
  // .filter() - only get active credentials
  // .map() - extract just the ID from each credential
  // .toString() - convert MongoDB ObjectId to string for comparison
  const userCredentialIds = user.credentials
    .filter(c => c.isActive)
    .map(c => c.credential._id.toString());

  // Arrays to collect missing and expired credentials
  const missingCredentials = [];
  const expiredCredentials = [];
  const now = new Date();  // Current date for expiration checking

  // Check each required credential
  for (const requiredId of requiredCredentialIds) {
    const requiredIdStr = requiredId.toString();
    
    // Find if user has this credential (and it's active)
    const userCred = user.credentials.find(
      c => c.credential._id.toString() === requiredIdStr && c.isActive
    );

    // If user doesn't have this credential, add to missing list
    if (!userCred) {
      missingCredentials.push(requiredIdStr);
    } 
    // If user has it but it's expired, add to expired list
    else if (userCred.expirationDate && new Date(userCred.expirationDate) < now) {
      expiredCredentials.push({
        credentialId: requiredIdStr,
        credentialName: userCred.credential.name,
        expirationDate: userCred.expirationDate,
      });
    }
  }

  // User is valid if they have all credentials and none are expired
  const isValid = missingCredentials.length === 0 && expiredCredentials.length === 0;

  // Return the verification results
  return {
    isValid,
    missingCredentials,
    expiredCredentials,
  };
};

/**
 * FILTER SHIFTS BY CREDENTIALS
 * 
 * Takes an array of shifts and returns only the shifts that
 * the user is qualified to take (has all required credentials).
 * 
 * @param {Array} shifts - Array of shift objects to filter
 * @param {ObjectId} userId - User ID to check credentials for
 * @returns {Array} Array of shifts the user qualifies for
 */
exports.filterShiftsByCredentials = async (shifts, userId) => {
  // Get user with their credentials
  const user = await User.findById(userId).populate('credentials.credential');
  if (!user) return [];  // If user doesn't exist, they can't take any shifts

  // Get current date for expiration checking
  const now = new Date();
  
  // Get array of credential IDs user has that are:
  // 1. Active (isActive = true)
  // 2. Not expired (no expirationDate OR expirationDate is in the future)
  const userActiveCredentialIds = user.credentials
    .filter(c => c.isActive && (!c.expirationDate || new Date(c.expirationDate) >= now))
    .map(c => c.credential._id.toString());

  // Array to store shifts user is qualified for
  const qualifiedShifts = [];

  // Check each shift
  for (const shift of shifts) {
    // If shift has no required credentials, user automatically qualifies
    if (!shift.requiredCredentials || shift.requiredCredentials.length === 0) {
      qualifiedShifts.push(shift);
      continue;  // Skip to next shift
    }

    // Get array of required credential IDs for this shift
    const requiredIds = shift.requiredCredentials.map(id => id.toString());
    
    // Check if user has ALL required credentials
    // .every() returns true only if ALL items in array pass the test
    // .includes() checks if the credential ID is in user's credentials
    const hasAllCredentials = requiredIds.every(id => userActiveCredentialIds.includes(id));

    // If user has all required credentials, add shift to qualified list
    if (hasAllCredentials) {
      qualifiedShifts.push(shift);
    }
  }

  // Return only the shifts user qualifies for
  return qualifiedShifts;
};

