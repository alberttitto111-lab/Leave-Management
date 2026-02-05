import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "hod", "teacher", "student", "staff"],
      required: true,
    },

    personalInfo: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      dateOfBirth: Date,
      gender: String,
      address: String,
    },

    /* ✅ NEW — Teacher Only */
    teachingInfo: {
      classSections: [{ type: String, trim: true }],
      subjects: [{ type: String, trim: true }],
      isClassTeacher: {
        type: Boolean,
        default: false,
      },
    },

    /* ✅ NEW — HOD Only */
    hodInfo: {
      officeRoom: { type: String, trim: true },
      managedDepartments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
      ],
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

/* 🔐 Hash password before saving */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* 🔑 Compare password method */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
