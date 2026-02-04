import mongoose from "mongoose";

const academicInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Changed to String to match User.userId
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
        uppercase: true,
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
        uppercase: true,
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
 * ✅ Pre-save hook for attendance calculation
 */
academicInfoSchema.pre("save", function (next) {
  const { totalDays, absentDays } = this.attendanceStats;

  if (totalDays > 0) {
    this.attendanceStats.leavePercentage = (absentDays / totalDays) * 100;
  } else {
    this.attendanceStats.leavePercentage = 0;
  }
  next();
});

/**
 * ✅ Enhanced error handling for duplicates
 */
academicInfoSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    if (error.keyPattern && error.keyPattern["academicInfo.rollNumber"]) {
      const err = new Error(
        `ROLL_NUMBER_EXISTS:${error.keyValue["academicInfo.rollNumber"]}`,
      );
      err.statusCode = 409;
      return next(err);
    }
    if (error.keyPattern && error.keyPattern.userId) {
      const err = new Error(`ACADEMIC_INFO_EXISTS`);
      err.statusCode = 409;
      return next(err);
    }
  }
  next(error);
});

const AcademicInfo = mongoose.model("AcademicInfo", academicInfoSchema);
export default AcademicInfo;
