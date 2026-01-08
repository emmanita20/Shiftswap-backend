const Facility = require('../models/Facility');

// Get all facilities
exports.getAllFacilities = async (req, res, next) => {
  try {
    const facilities = await Facility.find({ isActive: true })
      .populate('departments.defaultRequiredCredentials', 'name description')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: facilities.length,
      data: { facilities },
    });
  } catch (error) {
    next(error);
  }
};

// Create facility (manager only)
exports.createFacility = async (req, res, next) => {
  try {
    const { name, address, departments } = req.body;

    const facility = await Facility.create({
      name,
      address,
      departments: departments || [],
    });

    res.status(201).json({
      success: true,
      message: 'Facility created successfully',
      data: { facility },
    });
  } catch (error) {
    next(error);
  }
};

// Get facility by ID
exports.getFacilityById = async (req, res, next) => {
  try {
    const facility = await Facility.findById(req.params.id)
      .populate('departments.defaultRequiredCredentials', 'name description category');

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found',
      });
    }

    res.json({
      success: true,
      data: { facility },
    });
  } catch (error) {
    next(error);
  }
};

// Update facility (manager only)
exports.updateFacility = async (req, res, next) => {
  try {
    const { name, address, departments } = req.body;

    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found',
      });
    }

    if (name) facility.name = name;
    if (address) facility.address = address;
    if (departments) facility.departments = departments;

    await facility.save();

    const updatedFacility = await Facility.findById(facility._id)
      .populate('departments.defaultRequiredCredentials', 'name description');

    res.json({
      success: true,
      message: 'Facility updated successfully',
      data: { facility: updatedFacility },
    });
  } catch (error) {
    next(error);
  }
};

