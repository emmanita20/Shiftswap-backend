const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const credentialController = require("../controllers/credentialController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validation");

// Public route (for getting all credentials)
router.get("/", credentialController.getAllCredentials);

// All other routes require authentication
router.use(authenticate);

// Validation rules
const createCredentialValidation = [
  body("name").trim().notEmpty().withMessage("Credential name is required"),
  body("category")
    .optional()
    .isIn(["license", "certification", "training", "qualification"]),
  validate,
];

const addUserCredentialValidation = [
  body("credentialId")
    .notEmpty()
    .withMessage("Credential ID is required")
    .isMongoId()
    .withMessage("Credential ID must be a valid ObjectId"),
  validate,
];

// Routes
router.get("/my-credentials", credentialController.getMyCredentials);
router.post(
  "/my-credentials",
  addUserCredentialValidation,
  credentialController.addUserCredential
);
router.delete(
  "/my-credentials/:credentialId",
  credentialController.removeUserCredential
);

// Manager only routes
router.post(
  "/",
  authorize("manager"),
  createCredentialValidation,
  credentialController.createCredential
);

module.exports = router;
