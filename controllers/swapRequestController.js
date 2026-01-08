/**
 * ==================================================
 * SWAP REQUEST CONTROLLER
 * ==================================================
 * Handles shift swap request operations:
 * - Creating swap requests (requesting to take a shift)
 * - Viewing user's swap requests
 * - Getting swap request details
 */

const ShiftSwapRequest = require("../models/ShiftSwapRequest"); // Swap request database model
const Shift = require("../models/Shift"); // Shift database model
const credentialVerificationService = require("../services/credentialVerificationService"); // Service to check credentials
const overtimeCalculationService = require("../services/overtimeCalculationService"); // Service to check overtime

/**
 * CREATE SWAP REQUEST - Request to take an available shift
 *
 * When a user wants to take a shift, they create a swap request.
 * This request must be approved by a manager.
 *
 * Validation checks:
 * 1. Shift must exist
 * 2. Shift must be open (not already taken)
 * 3. User cannot request their own shift
 * 4. User must have required credentials
 * 5. User cannot request the same shift twice
 *
 * Steps:
 * 1. Get shiftId from request body
 * 2. Verify shift exists and is available
 * 3. Check user credentials
 * 4. Check for overtime (warning only)
 * 5. Check if request already exists
 * 6. Create swap request
 * 7. Update shift status to 'requested'
 * 8. Return the request with overtime warning if applicable
 */
exports.createSwapRequest = async (req, res, next) => {
  try {
    // Get data from request body
    const {
      shiftId,
      swapType,
      preferredReplacementShifts,
      reason,
      responseDeadline,
    } = req.body;

    // ==================================================
    // VALIDATION CHECKS
    // ==================================================

    // Check if shift exists
    // .populate() gets the requiredCredentials details (not just IDs)
    const shift = await Shift.findById(shiftId).populate("requiredCredentials");
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Check if shift is still open (available)
    // If status is 'requested' or 'approved', it's not available
    if (shift.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Shift is not available for swap requests",
      });
    }

    // Prevent users from requesting their own shift
    // .toString() converts MongoDB ObjectId to string for comparison
    if (shift.postedBy.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot request your own shift",
      });
    }

    // Verify user has the required credentials for this shift
    // .map() extracts just the IDs from the credentials array
    const credentialIds = shift.requiredCredentials.map((c) => c._id);
    const credentialCheck =
      await credentialVerificationService.verifyUserCredentials(
        req.user.id,
        credentialIds
      );

    // If user doesn't have required credentials, deny request
    if (!credentialCheck.isValid) {
      return res.status(403).json({
        success: false,
        message: "You do not have the required credentials for this shift",
        credentialCheck, // Include details about what's missing
      });
    }

    // Check if taking this shift would result in overtime
    // This is a warning only - doesn't block the request
    const overtimeCheck = await overtimeCalculationService.checkOvertime(
      req.user.id,
      {
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
      }
    );

    // Check if user already requested this shift
    // Prevents duplicate requests
    const existingRequest = await ShiftSwapRequest.findOne({
      shift: shiftId,
      requestedBy: req.user.id,
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already requested this shift",
      });
    }

    // ==================================================
    // CREATE THE REQUEST
    // ==================================================

    // Create swap request in database with status 'pending'
    // Manager will need to approve it
    const swapRequest = await ShiftSwapRequest.create({
      shift: shiftId, // Which shift
      requestedBy: req.user.id, // Who requested it
      status: "pending", // Waiting for manager approval
      swapType,
      preferredReplacementShifts: preferredReplacementShifts || [],
      reason,
      responseDeadline: new Date(responseDeadline),
    });

    // Update shift status from 'open' to 'requested'
    // This shows the shift has a pending request
    shift.status = "requested";
    await shift.save();

    // Get the request with populated data (shift details, requester info)
    const populatedRequest = await ShiftSwapRequest.findById(swapRequest._id)
      .populate("shift") // Get full shift details
      .populate("requestedBy", "name email") // Get requester name and email
      .populate("preferredReplacementShifts", "title date startTime endTime"); // Get preferred shift details

    // Return success response with request data
    // Include overtime warning if applicable
    res.status(201).json({
      success: true,
      message: "Shift swap request created successfully",
      data: {
        swapRequest: populatedRequest,
        // Include overtime warning if taking shift would exceed hours
        // ...overtimeCheck spreads all overtime check details into the object
        overtimeWarning: overtimeCheck.wouldExceed
          ? {
              message: "Accepting this shift may result in overtime",
              ...overtimeCheck,
            }
          : null,
      },
    });
  } catch (error) {
    // Handle duplicate key error (in case unique constraint fails)
    // This can happen if database has a unique index on shift+requestedBy
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already requested this shift",
      });
    }
    next(error);
  }
};

/**
 * GET MY SWAP REQUESTS - Get all swap requests made by the current user
 *
 * Returns all swap requests (pending, approved, rejected) that
 * the logged-in user has created.
 *
 * Steps:
 * 1. Find all swap requests where requestedBy matches current user
 * 2. Populate related data (shift details, manager info)
 * 3. Sort by creation date (newest first)
 * 4. Return the requests
 */
exports.getMySwapRequests = async (req, res, next) => {
  try {
    // Find all swap requests made by the current user
    const swapRequests = await ShiftSwapRequest.find({
      requestedBy: req.user.id,
    })
      .populate("shift") // Get full shift details
      .populate("manager", "name email") // Get manager info (if assigned)
      .populate("preferredReplacementShifts", "title date startTime endTime") // Get preferred shift details
      .sort({ createdAt: -1 }); // Sort: newest requests first

    // Return the swap requests
    res.json({
      success: true,
      count: swapRequests.length,
      data: { swapRequests },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SWAP REQUEST BY ID - Get detailed information about a specific swap request
 *
 * Returns a single swap request with all related data populated.
 *
 * Steps:
 * 1. Find swap request by ID from URL parameters
 * 2. Populate related data (shift, requester, manager)
 * 3. Check if request exists
 * 4. Return request details
 */
exports.getSwapRequestById = async (req, res, next) => {
  try {
    // Find swap request by ID (from URL: /api/swap-requests/:id)
    const swapRequest = await ShiftSwapRequest.findById(req.params.id)
      .populate("shift") // Get full shift details
      .populate("requestedBy", "name email") // Get requester info
      .populate("manager", "name email") // Get manager info (if assigned)
      .populate("preferredReplacementShifts", "title date startTime endTime"); // Get preferred shift details

    // Check if swap request exists
    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      });
    }

    // Return the swap request
    res.json({
      success: true,
      data: { swapRequest },
    });
  } catch (error) {
    next(error);
  }
};
