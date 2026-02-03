import mongoose from "mongoose";

const academicInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    academicInfo: {
      rollNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      class: { type: String, required: true, index: true },
      section: { type: String, required: true },
      batchYear: { type: Number, required: true, index: true },
      parentDetails: {
        fatherName: { type: String, trim: true },
        motherName: { type: String, trim: true },
        parentPhone: { type: String, trim: true },
        parentEmail: { type: String, lowercase: true, trim: true },
      },
      guardianName: { type: String, trim: true },
      guardianPhone: { type: String, trim: true },
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    attendanceStats: {
      totalDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      leavePercentage: { type: Number, default: 0, min: 0, max: 100 },
    },
  },
  { timestamps: true },
);

// Calculate leave percentage before saving
academicInfoSchema.pre("save", function (next) {
  if (this.attendanceStats.totalDays > 0) {
    this.attendanceStats.leavePercentage =
      (this.attendanceStats.absentDays / this.attendanceStats.totalDays) * 100;
  }
  next();
});

export default mongoose.model("AcademicInfo", academicInfoSchema);
