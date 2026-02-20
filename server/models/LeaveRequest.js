import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema({
  level: { type: Number, required: true }, // 1 = Teacher, 2 = HOD
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  remarks: { type: String },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
});

const leaveRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicantType: { type: String, enum: ["student", "staff"], required: true },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    dateRange: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
      days: { type: Number, required: true },
      halfDay: { type: Boolean, default: false },
      halfDayType: {
        type: String,
        enum: ["first", "second", null],
        default: null,
      },
    },
    reason: { type: String, required: true },
    attachments: [
      {
        url: String,
        type: String,
        name: String,
        size: Number,
      },
    ],
    status: {
      type: String,
      enum: [
        "pending",
        "approved_by_teacher",
        "approved_by_hod",
        "rejected",
        "rejected_by_hod", // Add this
        "cancelled",
      ],
      default: "pending",
    },
    currentLevel: { type: Number, default: 1 }, // 1 = Teacher, 2 = HOD
    approvals: [approvalSchema],
    finalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // For generated documents
    approvalLetter: {
      url: String,
      generatedAt: Date,
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    rejectionLetter: {
      url: String,
      generatedAt: Date,
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String,
    },

    notificationsSent: {
      teacher: { type: Boolean, default: false },
      hod: { type: Boolean, default: false },
      student: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ applicantId: 1, status: 1 });
leaveRequestSchema.index({ currentLevel: 1, status: 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
