/**
 * ==================================================
 * STAFF CONTROLLER
 * ==================================================
 * Handles staff directory management operations:
 * - List all staff with filters
 * - Get staff details
 * - Update staff status
 * - Get staff certifications and work hours
 */

const User = require('../models/User');
const WorkHours = require('../models/WorkHours');
const overtimeCalculationService = require('../services/overtimeCalculationService');

/**
 * GET ALL STAFF - Get staff directory with filters
 * 
 * Supports filtering by:
 * - Role (staff/manager)
 * - Department
 * - Shift type (day/night - based on recent shifts)
 * - Qualified only (has active credentials)
 * - Search by name, license ID, or role
 * 
 * Returns staff with:
 * - Basic info (name, ID, role, department)
 * - Status (Active, Expiring, Non-Compliant, Reviewing)
 * - Certifications list
 * - Weekly hours (current week) with percentage and status
 */
exports.getAllStaff = async (req, res, next) => {
  try {
    const { 
      search, 
      role, 
      department, 
      shift, 
      qualifiedOnly 
    } = req.query;

    // Build filter
    const filter = {};

    // Filter by role
    if (role && role !== 'All') {
      filter.role = role;
    }

    // Filter by department
    if (department && department !== 'All') {
      filter.department = department;
    }

    // Filter by qualified only (has active credentials)
    if (qualifiedOnly === 'true') {
      filter['credentials.isActive'] = true;
    }

    // Get all staff matching filters
    let staff = await User.find(filter)
      .populate('facility', 'name')
      .populate('credentials.credential', 'name description category')
      .select('-password') // Exclude password
      .sort({ name: 1 });

    // Apply search filter (by name, license ID, or role)
    if (search) {
      const searchLower = search.toLowerCase();
      staff = staff.filter(user => {
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const licenseMatch = user.credentials?.some(cred => 
          cred.licenseNumber?.toLowerCase().includes(searchLower)
        );
        const roleMatch = user.role?.toLowerCase().includes(searchLower) ||
                         user.department?.toLowerCase().includes(searchLower);
        return nameMatch || licenseMatch || roleMatch;
      });
    }

    // Get current week start date for hours calculation
    const today = new Date();

    // Enrich staff with weekly hours and status
    const enrichedStaff = await Promise.all(
      staff.map(async (user) => {
        // Get weekly hours
        const weeklyHours = await overtimeCalculationService.getWeeklyHours(user._id, today);
        const maxHours = 40;
        const hoursPercentage = (weeklyHours / maxHours) * 100;
        
        // Determine hours status
        let hoursStatus = 'Normal';
        if (weeklyHours > maxHours) {
          hoursStatus = 'Overload';
        } else if (weeklyHours >= maxHours * 0.9) {
          hoursStatus = 'Warning';
        }

        // Determine staff status based on credentials and account status
        let staffStatus = 'Active';
        if (!user.isActive) {
          staffStatus = 'Non-Compliant';
        } else {
          // Check for expiring credentials (within 30 days)
          const expiringCredentials = user.credentials.filter(cred => {
            if (!cred.isActive || !cred.expirationDate) return false;
            const daysUntilExpiry = Math.ceil(
              (new Date(cred.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
            );
            return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
          });

          // Check for expired credentials
          const expiredCredentials = user.credentials.filter(cred => {
            if (!cred.isActive || !cred.expirationDate) return false;
            return new Date(cred.expirationDate) < new Date();
          });

          if (expiredCredentials.length > 0) {
            staffStatus = 'Non-Compliant';
          } else if (expiringCredentials.length > 0) {
            staffStatus = 'Expiring';
          }
        }

        // Get active certifications
        const certifications = user.credentials
          .filter(cred => cred.isActive)
          .map(cred => ({
            name: cred.credential?.name || 'Unknown',
            licenseNumber: cred.licenseNumber,
            expirationDate: cred.expirationDate,
          }));

        // Generate staff ID (format: ROLE - NUMBER)
        const rolePrefix = getRolePrefix(user.role);
        const staffId = `${rolePrefix} - ${user._id.toString().slice(-4)}`;

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          staffId,
          role: user.role,
          department: user.department,
          facility: user.facility,
          status: staffStatus,
          certifications: certifications.length > 0 ? certifications : [],
          weeklyHours: {
            hours: weeklyHours,
            maxHours,
            percentage: Math.round(hoursPercentage),
            status: hoursStatus,
          },
          isActive: user.isActive,
        };
      })
    );

    // Filter by shift type if provided (based on recent shift patterns)
    // This is a simplified implementation - in production, you'd check actual shift assignments
    let filteredStaff = enrichedStaff;
    if (shift && shift !== 'All') {
      // For now, we'll skip shift filtering as it requires checking actual shift assignments
      // This can be enhanced later by checking Shift model for recent assignments
    }

    res.json({
      success: true,
      count: filteredStaff.length,
      data: {
        staff: filteredStaff,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET STAFF BY ID - Get detailed information about a specific staff member
 */
exports.getStaffById = async (req, res, next) => {
  try {
    const staffId = req.params.id;

    const user = await User.findById(staffId)
      .populate('facility', 'name address')
      .populate('credentials.credential', 'name description category')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Get weekly hours
    const today = new Date();
    const weeklyHours = await overtimeCalculationService.getWeeklyHours(user._id, today);
    const maxHours = 40;
    const hoursPercentage = (weeklyHours / maxHours) * 100;

    // Determine hours status
    let hoursStatus = 'Normal';
    if (weeklyHours > maxHours) {
      hoursStatus = 'Overload';
    } else if (weeklyHours >= maxHours * 0.9) {
      hoursStatus = 'Warning';
    }

    // Determine staff status
    let staffStatus = 'Active';
    if (!user.isActive) {
      staffStatus = 'Non-Compliant';
    } else {
      const expiredCredentials = user.credentials.filter(cred => {
        if (!cred.isActive || !cred.expirationDate) return false;
        return new Date(cred.expirationDate) < new Date();
      });

      const expiringCredentials = user.credentials.filter(cred => {
        if (!cred.isActive || !cred.expirationDate) return false;
        const daysUntilExpiry = Math.ceil(
          (new Date(cred.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });

      if (expiredCredentials.length > 0) {
        staffStatus = 'Non-Compliant';
      } else if (expiringCredentials.length > 0) {
        staffStatus = 'Expiring';
      }
    }

    // Get certifications
    const certifications = user.credentials
      .filter(cred => cred.isActive)
      .map(cred => ({
        credential: cred.credential,
        licenseNumber: cred.licenseNumber,
        issuedDate: cred.issuedDate,
        expirationDate: cred.expirationDate,
        isActive: cred.isActive,
      }));

    // Generate staff ID
    const rolePrefix = getRolePrefix(user.role);
    const staffIdFormatted = `${rolePrefix} - ${user._id.toString().slice(-4)}`;

    res.json({
      success: true,
      data: {
        staff: {
          _id: user._id,
          name: user.name,
          email: user.email,
          staffId: staffIdFormatted,
          role: user.role,
          department: user.department,
          facility: user.facility,
          status: staffStatus,
          certifications,
          weeklyHours: {
            hours: weeklyHours,
            maxHours,
            percentage: Math.round(hoursPercentage),
            status: hoursStatus,
          },
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE STAFF STATUS - Update staff member status (Manager only)
 * 
 * Can update:
 * - isActive status
 * - Other fields as needed
 */
exports.updateStaffStatus = async (req, res, next) => {
  try {
    const staffId = req.params.id;
    const { isActive, department, role } = req.body;

    const user = await User.findById(staffId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Update fields
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    if (department) {
      user.department = department;
    }
    if (role) {
      user.role = role;
    }

    await user.save();

    const updatedUser = await User.findById(staffId)
      .populate('facility', 'name')
      .populate('credentials.credential', 'name description category')
      .select('-password');

    res.json({
      success: true,
      message: 'Staff status updated successfully',
      data: {
        staff: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Helper function to get role prefix for staff ID
 */
function getRolePrefix(role) {
  const rolePrefixes = {
    'staff': 'ST',
    'manager': 'MG',
  };
  
  // Map common roles to prefixes
  const roleMap = {
    'Registered Nurse': 'RN',
    'Nurse': 'RN',
    'Medical Doctor': 'MD',
    'Doctor': 'MD',
    'Pharmacist': 'PH',
    'Lab Scientist': 'LS',
    'Physiotherapist': 'PT',
    'Technician': 'TC',
  };
  
  return rolePrefixes[role] || 'ST';
}

