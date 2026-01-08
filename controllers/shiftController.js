/**
 * ==================================================
 * SHIFT CONTROLLER
 * ==================================================
 * Handles all shift-related operations:
 * - Creating shifts
 * - Viewing available shifts
 * - Getting shift details
 * - Managing emergency shifts
 */

const Shift = require('../models/Shift');  // Shift database model
const shiftHistoryService = require('../services/shiftHistoryService');  // Service to track shift history

/**
 * CREATE SHIFT - Create a new shift posting
 * 
 * Steps:
 * 1. Get shift data from request body
 * 2. Validate shift doesn't overlap improperly (if assignedTo is provided)
 * 3. Create shift in database with status 'open'
 * 4. Record this action in shift history (audit trail)
 * 5. Populate related data (who posted it, facility, credentials)
 * 6. Return the created shift
 */
exports.createShift = async (req, res, next) => {
  try {
    // Extract shift data from request body
    const { 
      title, 
      department, 
      date, 
      startTime, 
      endTime, 
      facility, 
      requiredCredentials, 
      isEmergency, 
      incentiveAmount, 
      incentiveDescription,
      assignedTo  // Optional: can assign shift directly when creating
    } = req.body;

    // Validate overlap if shift is being assigned to a user
    if (assignedTo) {
      const shiftOverlapValidationService = require('../services/shiftOverlapValidationService');
      
      const overlapCheck = await shiftOverlapValidationService.validateShiftOverlap({
        assignedTo,
        department,
        date,
        startTime,
        endTime,
      });

      // If overlap validation fails, return error
      if (!overlapCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Shift overlap validation failed',
          errors: overlapCheck.errors,
          warnings: overlapCheck.warnings,
        });
      }

      // Store warnings to include in response
      if (overlapCheck.warnings.length > 0) {
        req.overlapWarnings = overlapCheck.warnings;
      }
    }

    // Create shift in database
    // req.user.id comes from authenticate middleware (the logged-in user)
    // || operator provides default values if data is not provided
    const shift = await Shift.create({
      title,
      department,
      date,
      startTime,
      endTime,
      postedBy: req.user.id,  // User who posted this shift
      status: assignedTo ? 'approved' : 'open',  // If assigned, set to approved; otherwise open
      assignedTo: assignedTo || null,  // Assign if provided
      facility: facility || req.user.facility || null,  // Use provided facility, or user's facility, or null
      requiredCredentials: requiredCredentials || [],  // Required credentials (empty array if none)
      isEmergency: isEmergency || false,  // Is this an emergency shift?
      incentiveAmount: incentiveAmount || 0,  // Bonus pay amount (default 0)
      incentiveDescription: incentiveDescription || null,  // Description of incentive
    });

    // Record this action in shift history (for audit trail)
    // This helps track all changes to shifts
    await shiftHistoryService.recordHistory(
      shift._id,        // Which shift
      'created',        // What action
      req.user.id,      // Who did it
      null,             // Previous state (none for creation)
      shift,            // New state (the created shift)
      'Shift created'   // Description
    );

    // Get the shift with populated related data
    // .populate() replaces IDs with actual objects from other collections
    const populatedShift = await Shift.findById(shift._id)
      .populate('postedBy', 'name email')  // Get poster's name and email
      .populate('assignedTo', 'name email')  // Get assigned user if any
      .populate('facility', 'name')        // Get facility name
      .populate('requiredCredentials', 'name description');  // Get credential details

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: { 
        shift: populatedShift,
        warnings: req.overlapWarnings || [],  // Include overlap warnings if any
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET AVAILABLE SHIFTS - Get shifts that are open and the user can apply for
 * 
 * This endpoint filters shifts by:
 * - Status must be 'open'
 * - Department (user's department by default)
 * - User's credentials (only shows shifts user qualifies for)
 * - Optional filters: emergency status, facility
 * 
 * Steps:
 * 1. Build filter object based on query parameters
 * 2. Find shifts matching the filter
 * 3. Filter shifts based on user's credentials (remove shifts user can't take)
 * 4. Sort: emergency shifts first, then by date/time
 * 5. Return filtered and sorted shifts
 */
exports.getAvailableShifts = async (req, res, next) => {
  try {
    // Get filter parameters from URL query string
    // Example: /api/shifts/available?department=Sales&emergency=true
    const { department, emergency, facility } = req.query;
    const credentialVerificationService = require('../services/credentialVerificationService');
    
    // Start with base filter - only get open shifts
    const filter = { status: 'open' };

    // Filter by department
    // If department is provided in query, use it; otherwise use user's department
    if (department) {
      filter.department = department;
    } else {
      filter.department = req.user.department;
    }

    // Filter by emergency status if provided
    // Query parameters come as strings, so check for 'true'
    if (emergency === 'true') {
      filter.isEmergency = true;
    }

    // Filter by facility if provided
    if (facility) {
      filter.facility = facility;
    }

    // Find shifts matching the filter
    // .populate() gets related data (poster info, facility, credentials)
    // .sort() orders results: emergency first (-1 = descending), then by date/time (1 = ascending)
    let shifts = await Shift.find(filter)
      .populate('postedBy', 'name email')
      .populate('facility', 'name')
      .populate('requiredCredentials', 'name description category')
      .sort({ isEmergency: -1, date: 1, startTime: 1 });  // Emergency shifts appear first

    // Further filter by user credentials
    // Remove shifts that require credentials the user doesn't have
    shifts = await credentialVerificationService.filterShiftsByCredentials(shifts, req.user.id);

    // Return the filtered shifts
    res.json({
      success: true,
      count: shifts.length,
      data: { shifts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET MY SHIFTS - Get all shifts posted by the current user
 * 
 * Shows all shifts the logged-in user has created,
 * regardless of status (open, requested, approved).
 * 
 * Steps:
 * 1. Find all shifts where postedBy matches current user ID
 * 2. Populate related data (poster, assigned user)
 * 3. Sort by date (newest first)
 * 4. Return shifts
 */
exports.getMyShifts = async (req, res, next) => {
  try {
    // Find all shifts posted by the current user
    const shifts = await Shift.find({ postedBy: req.user.id })
      .populate('postedBy', 'name email')     // Get poster info
      .populate('assignedTo', 'name email')   // Get assigned user info (if assigned)
      .sort({ date: -1, createdAt: -1 });     // Sort: newest dates first, then newest created

    // Return the shifts
    res.json({
      success: true,
      count: shifts.length,
      data: { shifts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SHIFT BY ID - Get detailed information about a specific shift
 * 
 * Returns shift details along with information about whether
 * the current user is qualified to take this shift.
 * 
 * Steps:
 * 1. Find shift by ID from URL parameters
 * 2. Populate all related data
 * 3. Check if shift exists
 * 4. Verify if current user has required credentials
 * 5. Return shift details and qualification status
 */
exports.getShiftById = async (req, res, next) => {
  try {
    // Find shift by ID (from URL: /api/shifts/:id)
    // req.params.id gets the :id part of the URL
    const shift = await Shift.findById(req.params.id)
      .populate('postedBy', 'name email')          // Who posted the shift
      .populate('assignedTo', 'name email')        // Who it's assigned to (if any)
      .populate('facility', 'name address')        // Facility details
      .populate('requiredCredentials', 'name description category');  // Required credentials

    // Check if shift exists
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    // Check if current user has the required credentials for this shift
    // This helps frontend show if user can apply or not
    const credentialVerificationService = require('../services/credentialVerificationService');
    
    // Get array of credential IDs from the shift
    // .map() extracts the _id from each credential
    const credentialIds = shift.requiredCredentials.map(c => c._id);
    
    // Check if user has all required credentials
    const credentialCheck = await credentialVerificationService.verifyUserCredentials(
      req.user.id,
      credentialIds
    );

    // Return shift details and qualification info
    res.json({
      success: true,
      data: {
        shift,                              // The shift details
        userQualified: credentialCheck.isValid,  // Can user take this shift?
        credentialCheck,                    // Detailed credential check info
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET EMERGENCY SHIFTS - Get all emergency shifts in user's department
 * 
 * Returns only open emergency shifts that:
 * - Are in the user's department
 * - User has credentials for
 * - Are sorted by date/time (earliest first)
 * 
 * Emergency shifts are urgent and need to be filled quickly.
 */
exports.getEmergencyShifts = async (req, res, next) => {
  try {
    const credentialVerificationService = require('../services/credentialVerificationService');
    
    // Find emergency shifts in user's department
    const shifts = await Shift.find({
      status: 'open',              // Must be open (available)
      isEmergency: true,           // Must be emergency
      department: req.user.department,  // Must be in user's department
    })
      .populate('postedBy', 'name email')
      .populate('facility', 'name')
      .populate('requiredCredentials', 'name description')
      .sort({ date: 1, startTime: 1 });  // Sort: earliest dates/times first

    // Filter to only shifts user is qualified for (has required credentials)
    const qualifiedShifts = await credentialVerificationService.filterShiftsByCredentials(shifts, req.user.id);

    // Return the emergency shifts
    res.json({
      success: true,
      count: qualifiedShifts.length,
      data: { shifts: qualifiedShifts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET MY ASSIGNED SHIFTS - Shifts where current user is assignedTo
 *
 * This powers the mobile "My Schedule" and home dashboard cards.
 *
 * Query params:
 * - view: 'upcoming' | 'past' | undefined (all)
 *
 * Upcoming = today and future, Past = before today.
 */
exports.getMyAssignedShifts = async (req, res, next) => {
  try {
    const { view } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = {
      assignedTo: req.user.id,
    };

    if (view === 'upcoming') {
      filter.date = { $gte: today };
    } else if (view === 'past') {
      filter.date = { $lt: today };
    }

    const shifts = await Shift.find(filter)
      .populate('facility', 'name')
      .populate('postedBy', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: shifts.length,
      data: {
        shifts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE SHIFT - Update an existing shift (Manager only)
 * 
 * Steps:
 * 1. Check if shift exists
 * 2. Check if user is manager or shift owner
 * 3. Validate overlap (if assignedTo or time/date changed)
 * 4. Update shift in database
 * 5. Record history
 * 6. Return updated shift
 */
exports.updateShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id;
    const {
      title,
      department,
      date,
      startTime,
      endTime,
      facility,
      requiredCredentials,
      isEmergency,
      incentiveAmount,
      incentiveDescription,
      assignedTo,
      status,
    } = req.body;

    // Find the shift
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    // Check authorization: Only manager or shift owner can update
    const isManager = req.user.role === 'manager';
    const isOwner = shift.postedBy.toString() === req.user.id;
    
    if (!isManager && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers or shift owners can update shifts.',
      });
    }

    // Store previous values for history
    const previousShift = { ...shift.toObject() };

    // Check if time/date or assignedTo changed (need overlap validation)
    const timeChanged = date && (date !== shift.date.toISOString().split('T')[0]) ||
                        startTime && startTime !== shift.startTime ||
                        endTime && endTime !== shift.endTime;
    const assignedChanged = assignedTo && assignedTo.toString() !== (shift.assignedTo?.toString() || '');

    // Validate overlap if time/date or assignment changed
    if (timeChanged || assignedChanged) {
      const shiftOverlapValidationService = require('../services/shiftOverlapValidationService');
      
      const overlapCheck = await shiftOverlapValidationService.validateShiftOverlap(
        {
          assignedTo: assignedTo || shift.assignedTo,
          department: department || shift.department,
          date: date || shift.date,
          startTime: startTime || shift.startTime,
          endTime: endTime || shift.endTime,
        },
        shiftId // Exclude current shift from overlap check
      );

      // If overlap validation fails, return error
      if (!overlapCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Shift overlap validation failed',
          errors: overlapCheck.errors,
          warnings: overlapCheck.warnings,
        });
      }

      // Include warnings in response if any
      if (overlapCheck.warnings.length > 0) {
        // Warnings don't block, but we'll include them in response
        req.overlapWarnings = overlapCheck.warnings;
      }
    }

    // Update shift fields
    if (title !== undefined) shift.title = title;
    if (department !== undefined) shift.department = department;
    if (date !== undefined) shift.date = date;
    if (startTime !== undefined) shift.startTime = startTime;
    if (endTime !== undefined) shift.endTime = endTime;
    if (facility !== undefined) shift.facility = facility;
    if (requiredCredentials !== undefined) shift.requiredCredentials = requiredCredentials;
    if (isEmergency !== undefined) shift.isEmergency = isEmergency;
    if (incentiveAmount !== undefined) shift.incentiveAmount = incentiveAmount;
    if (incentiveDescription !== undefined) shift.incentiveDescription = incentiveDescription;
    if (assignedTo !== undefined) shift.assignedTo = assignedTo;
    if (status !== undefined) shift.status = status;

    // Save updated shift
    await shift.save();

    // Record history
    await shiftHistoryService.recordHistory(
      shift._id,
      'updated',
      req.user.id,
      previousShift,
      shift.toObject(),
      'Shift updated'
    );

    // Get updated shift with populated data
    const updatedShift = await Shift.findById(shift._id)
      .populate('postedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('facility', 'name')
      .populate('requiredCredentials', 'name description category');

    // Return success response
    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: {
        shift: updatedShift,
        warnings: req.overlapWarnings || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE SHIFT - Delete an existing shift (Manager only)
 * 
 * Steps:
 * 1. Check if shift exists
 * 2. Check if user is manager
 * 3. Check if shift can be deleted (not approved/assigned)
 * 4. Delete shift
 * 5. Record history
 * 6. Return success
 */
exports.deleteShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id;

    // Find the shift
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }

    // Only managers can delete shifts
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers can delete shifts.',
      });
    }

    // Check if shift can be deleted
    // Don't allow deletion of approved/assigned shifts
    if (shift.status === 'approved' && shift.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an approved shift that is assigned to a staff member. Please unassign it first.',
      });
    }

    // Store shift data for history before deletion
    const shiftData = shift.toObject();

    // Record history before deletion
    await shiftHistoryService.recordHistory(
      shift._id,
      'deleted',
      req.user.id,
      shiftData,
      null,
      'Shift deleted by manager'
    );

    // Delete the shift
    await Shift.findByIdAndDelete(shiftId);

    // Also delete related swap requests
    const ShiftSwapRequest = require('../models/ShiftSwapRequest');
    await ShiftSwapRequest.deleteMany({ shift: shiftId });

    // Return success response
    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

