const mongoose = require("mongoose");

const shiftSwapRequestSchema = new mongoose.Schema(
  {
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: [true, "Shift is required"],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requested by user is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    swapType: {
      type: String,
      enum: ["swap", "give_up", "coverage"],
      required: [true, "Swap type is required"],
    },
    preferredReplacementShifts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
      },
    ],
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },
    responseDeadline: {
      type: Date,
      required: [true, "Response deadline is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests for the same shift
shiftSwapRequestSchema.index({ shift: 1, requestedBy: 1 }, { unique: true });

module.exports = mongoose.model("ShiftSwapRequest", shiftSwapRequestSchema);
