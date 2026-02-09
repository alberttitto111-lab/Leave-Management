import mongoose from "mongoose";

const studentAcademicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One academic record per student
    },

    academicInfo: {
      rollNumber: {
        type: String,
        required: true,
        // ❌ REMOVE: unique: true (we'll use compound index instead)
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
  },
);

// ✅ COMPOUND UNIQUE INDEX: Same roll number allowed in different classes/sections
// But NOT allowed in same class-section combination
studentAcademicSchema.index(
  {
    "academicInfo.class": 1,
    "academicInfo.section": 1,
    "academicInfo.rollNumber": 1,
  },
  { unique: true },
);

export default mongoose.model("StudentAcademic", studentAcademicSchema);
