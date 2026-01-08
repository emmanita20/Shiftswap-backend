/**
 * ==================================================
 * SWAP REQUEST ROUTES
 * ==================================================
 * Defines all swap request-related API endpoints.
 *
 * Base path: /api/swap-requests
 *
 * Routes in this file:
 * - POST /api/swap-requests - Create a swap request (request to take a shift)
 * - GET /api/swap-requests/my-requests - Get swap requests made by current user
 * - GET /api/swap-requests/:id - Get a specific swap request by ID
 */

const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const swapRequestController = require("../controllers/swapRequestController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validation");

/**
 * CREATE SWAP REQUEST VALIDATION RULES
 *
 * Validates data when creating a swap request.
 */
const createSwapRequestValidation = [
  body("shiftId").notEmpty().withMessage("Shift ID is required"),
  body("swapType")
    .isIn(["swap", "give_up", "coverage"])
    .withMessage("Swap type must be swap, give_up, or coverage"),
  body("preferredReplacementShifts")
    .optional()
    .isArray()
    .withMessage("Preferred replacement shifts must be an array"),
  body("reason").trim().notEmpty().withMessage("Reason is required"),
  body("responseDeadline")
    .isISO8601()
    .withMessage("Response deadline must be a valid date"),
  validate,
];

/**
 * ==================================================
 * MIDDLEWARE FOR ALL ROUTES
 * ==================================================
 */

// Require user to be logged in
router.use(authenticate);

// Require user to have 'staff' or 'manager' role
router.use(authorize("staff", "manager"));

/**
 * ==================================================
 * ROUTE DEFINITIONS
 * ==================================================
 */

// POST /api/swap-requests - Create a swap request to take a shift
router.post(
  "/",
  createSwapRequestValidation,
  swapRequestController.createSwapRequest
);

// GET /api/swap-requests/my-requests - Get all swap requests made by current user
router.get("/my-requests", swapRequestController.getMySwapRequests);

// GET /api/swap-requests/:id - Get a specific swap request by ID
router.get("/:id", swapRequestController.getSwapRequestById);

module.exports = router;
