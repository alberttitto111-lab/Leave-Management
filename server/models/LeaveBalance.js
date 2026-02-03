import mongoose from "mongoose";

const monthlyBreakdownSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
  },
  { _id: false },
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    allocated: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
    remaining: {
      type: Number,
      default: 0,
    },
    carryForwardFromLastYear: {
      type: Number,
      default: 0,
    },
    monthlyBreakdown: [monthlyBreakdownSchema],
  },
  { timestamps: true },
);

// Compound index to ensure unique balance per user per year per leave type
leaveBalanceSchema.index(
  { userId: 1, year: 1, leaveType: 1 },
  { unique: true },
);

export default mongoose.model("LeaveBalance", leaveBalanceSchema);
