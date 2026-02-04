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
      select: false, // 🔒 prevents password from being returned by default
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
    timestamps: true, // ✅ automatically handles createdAt & updatedAt
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
