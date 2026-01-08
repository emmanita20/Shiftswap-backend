const Credential = require('../models/Credential');
const User = require('../models/User');

// Get all credentials
exports.getAllCredentials = async (req, res, next) => {
  try {
    const credentials = await Credential.find().sort({ name: 1 });

    res.json({
      success: true,
      count: credentials.length,
      data: { credentials },
    });
  } catch (error) {
    next(error);
  }
};

// Create credential (manager only)
exports.createCredential = async (req, res, next) => {
  try {
    const { name, description, category, requiresExpiration } = req.body;

    const credential = await Credential.create({
      name,
      description,
      category,
      requiresExpiration,
    });

    res.status(201).json({
      success: true,
      message: 'Credential created successfully',
      data: { credential },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's credentials
exports.getMyCredentials = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('credentials.credential');

    res.json({
      success: true,
      count: user.credentials.length,
      data: {
        credentials: user.credentials.filter(c => c.isActive),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add credential to user
exports.addUserCredential = async (req, res, next) => {
  try {
    const { credentialId, licenseNumber, issuedDate, expirationDate } = req.body;

    const credential = await Credential.findById(credentialId);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found',
      });
    }

    const user = await User.findById(req.user.id);

    // Check if credential already exists for user
    const existingCredential = user.credentials.find(
      c => c.credential.toString() === credentialId
    );

    if (existingCredential) {
      // Update existing credential
      existingCredential.licenseNumber = licenseNumber || existingCredential.licenseNumber;
      existingCredential.issuedDate = issuedDate || existingCredential.issuedDate;
      existingCredential.expirationDate = expirationDate || existingCredential.expirationDate;
      existingCredential.isActive = true;
    } else {
      // Add new credential
      user.credentials.push({
        credential: credentialId,
        licenseNumber,
        issuedDate,
        expirationDate,
        isActive: true,
      });
    }

    await user.save();

    const updatedUser = await User.findById(req.user.id).populate('credentials.credential');

    res.json({
      success: true,
      message: 'Credential added successfully',
      data: {
        credentials: updatedUser.credentials.filter(c => c.isActive),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove/deactivate user credential
exports.removeUserCredential = async (req, res, next) => {
  try {
    const { credentialId } = req.params;

    const user = await User.findById(req.user.id);
    const credential = user.credentials.find(
      c => c.credential.toString() === credentialId && c.isActive
    );

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found for user',
      });
    }

    credential.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Credential removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

