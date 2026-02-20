import mongoose from "mongoose";

const studentAcademicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    academicInfo: {
      rollNumber: {
        type: String,
        required: true,
      },
      class: {
        type: String,
        required: true,
      },
      section: {
        type: String,
        required: true,
      },
      batchYear: {
        type: Number,
        default: () => new Date().getFullYear(),
      },
      parentDetails: {
        fatherName: String,
        motherName: String,
        parentPhone: String,
        parentEmail: String,
      },
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    hodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: Same roll number allowed in different classes/sections
studentAcademicSchema.index(
  {
    "academicInfo.class": 1,
    "academicInfo.section": 1,
    "academicInfo.rollNumber": 1,
  },
  { unique: true }
);

export default mongoose.model("StudentAcademic", studentAcademicSchema);