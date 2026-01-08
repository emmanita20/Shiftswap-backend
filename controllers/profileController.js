/**
 * ==================================================
 * PROFILE CONTROLLER
 * ==================================================
 * Handles profile completion / update flows used
 * primarily by the mobile app:
 * - Get current user's full profile
 * - Update profile fields in one or more steps
 */

const User = require('../models/User');

// GET /api/profile - Get current user's full profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('facility', 'name')
      .populate('credentials.credential', 'name description category')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/profile - Update profile (step 1 or 2)
// Accepts any subset of profile fields so frontend/mobile
// devs can call this once per step.
exports.updateMyProfile = async (req, res, next) => {
  try {
    const {
      // Step 1 fields
      department,
      role,
      facility,
      employeeId,
      // Step 2 fields
      phoneNumber,
      preferredShiftType,
      yearsOfExperience,
      extraCertifications,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update only provided fields
    if (department !== undefined) user.department = department;
    if (role !== undefined) user.role = role;
    if (facility !== undefined) user.facility = facility;
    if (employeeId !== undefined) user.employeeId = employeeId;

    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (preferredShiftType !== undefined) user.preferredShiftType = preferredShiftType;
    if (yearsOfExperience !== undefined) user.yearsOfExperience = yearsOfExperience;
    if (extraCertifications !== undefined) user.extraCertifications = extraCertifications;

    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .populate('facility', 'name')
      .populate('credentials.credential', 'name description category')
      .select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};


