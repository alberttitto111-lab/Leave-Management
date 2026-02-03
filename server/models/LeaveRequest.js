import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    role: { type: String, required: true },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    remarks: { type: String, default: "" },
    actionAt: { type: Date, default: null },
  },
  { _id: false },
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["sms", "email", "push"],
      required: true,
    },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, default: "sent" },
    recipient: { type: String },
  },
  { _id: false },
);

const leaveRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicantId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    applicantType: {
      type: String,
      enum: ["student", "teacher", "staff"],
      required: true,
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    dateRange: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
      days: { type: Number, required: true, min: 0.5 },
      halfDay: {
        type: String,
        enum: ["morning", "afternoon", null],
        default: null,
      },
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "escalated"],
      default: "pending",
      index: true,
    },
    approvals: [approvalSchema],
    currentLevel: {
      type: Number,
      default: 1,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    substituteTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notificationsSent: [notificationSchema],
    parentNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Index for efficient querying
leaveRequestSchema.index({ applicantId: 1, status: 1 });
leaveRequestSchema.index({ "dateRange.from": 1, "dateRange.to": 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
