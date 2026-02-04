import mongoose from "mongoose";

const studentAcademicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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
        trim: true,
      },

      class: {
        type: String,
        required: true,
        index: true,
        trim: true,
      },

      section: {
        type: String,
        required: true,
        trim: true,
      },

      batchYear: {
        type: Number,
        required: true,
        index: true,
      },

      parentDetails: {
        fatherName: { type: String, trim: true },
        motherName: { type: String, trim: true },
        parentPhone: { type: String, trim: true },
        parentEmail: { type: String, trim: true, lowercase: true },
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
      leavePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
  },
  { timestamps: true },
);

/**
 * ✅ Mongoose 7+ compatible middleware
 * ❌ NO next()
 * ❌ NO callback arguments
 */
studentAcademicSchema.pre("save", function () {
  const stats = this.attendanceStats;

  if (!stats) return;

  if (stats.totalDays > 0) {
    stats.leavePercentage = (stats.absentDays / stats.totalDays) * 100;
  } else {
    stats.leavePercentage = 0;
  }
});

export default mongoose.model("StudentAcademic", studentAcademicSchema);
