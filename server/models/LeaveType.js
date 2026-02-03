import mongoose from "mongoose";

const approvalHierarchySchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["teacher", "hod", "admin"],
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#2563EB",
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    },
    maxDaysPerYear: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDaysPerMonth: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiresDocument: {
      type: Boolean,
      default: false,
    },
    approvalHierarchy: [approvalHierarchySchema],
    applicableTo: [
      {
        type: String,
        enum: ["student", "teacher", "staff", "all"],
        default: "all",
      },
    ],
    isPaid: {
      type: Boolean,
      default: false,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("LeaveType", leaveTypeSchema);
