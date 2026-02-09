import express from "express";
import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Department from "../models/Department.js";
import StudentAcademic from "../models/StudentAcademic.js";
import mongoose from "mongoose";

import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* =========================
   CREATE SINGLE USER
========================= */
router.post("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      userId,
      password = "TempPass123!",
      role,
      personalInfo,
      departmentId,
      academicInfo,
      teachingInfo,
      hodInfo,
    } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    const exists = await User.findOne({ userId });
    if (exists) {
      return res.status(400).json({ message: "User ID already exists" });
    }

    // ❌ REMOVE manual hashing - let schema handle it
    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId,
      password, // ✅ Pass plain password - schema will hash it
      role,
      personalInfo,
      departmentId: role === "admin" ? null : departmentId,
      isFirstLogin: true, // ✅ Use isFirstLogin

      // teacher support
      teachingInfo: role === "teacher" ? teachingInfo : undefined,

      // hod support
      hodInfo: role === "hod" ? hodInfo : undefined,
    });

    // student academic record
    if (role === "student" && academicInfo) {
      await StudentAcademic.create({
        userId: user._id,
        academicInfo,
        classTeacherId: academicInfo.classTeacherId,
        hodId: academicInfo.hodId,
      });
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        userId: user.userId,
        role: user.role,
        isFirstLogin: user.isFirstLogin, // ✅ Updated
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   BULK CREATE USERS (CSV)
========================= */
router.post(
  "/users/bulk",
  protect,
  authorize("admin"),
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const errors = [];
    let successCount = 0;

    try {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => results.push(row))
        .on("end", async () => {
          for (let i = 0; i < results.length; i++) {
            const row = results[i];

            try {
              if (!row.userId || !row.role) {
                throw new Error("Missing userId or role");
              }

              const exists = await User.findOne({ userId: row.userId });
              if (exists) throw new Error("User already exists");

              // ❌ REMOVE manual hashing
              // const hashedPassword = await bcrypt.hash(
              //   row.password || "TempPass123!",
              //   10,
              // );

              const roleLower = row.role.toLowerCase();

              const user = await User.create({
                userId: row.userId,
                password: row.password || "TempPass123!", // ✅ Plain password
                role: roleLower,
                personalInfo: {
                  firstName: row.firstName,
                  lastName: row.lastName,
                  email: row.email,
                  phone: row.phone,
                },
                departmentId: row.departmentId || null,
                isFirstLogin: true, // ✅ Use isFirstLogin

                // teacher bulk support
                teachingInfo:
                  roleLower === "teacher"
                    ? {
                        classSections: row.classSections?.split("|") || [],
                        subjects: row.subjects?.split("|") || [],
                      }
                    : undefined,

                // hod bulk support
                hodInfo:
                  roleLower === "hod"
                    ? {
                        officeRoom: row.officeRoom || "",
                      }
                    : undefined,
              });

              // student academic
              if (roleLower === "student") {
                await StudentAcademic.create({
                  userId: user._id,
                  academicInfo: {
                    rollNumber: row.rollNumber,
                    class: row.class,
                    section: row.section,
                    batchYear:
                      Number(row.batchYear) || new Date().getFullYear(),
                    parentDetails: {
                      fatherName: row.fatherName,
                      motherName: row.motherName,
                      parentPhone: row.parentPhone,
                      parentEmail: row.parentEmail,
                    },
                  },
                });
              }

              successCount++;
            } catch (e) {
              errors.push({ row: i + 1, error: e.message });
            }
          }

          fs.unlinkSync(req.file.path);

          res.json({
            message: "Bulk upload completed",
            successCount,
            errorCount: errors.length,
            errors: errors.length ? errors : undefined,
          });
        });
    } catch (err) {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ message: "Upload failed", error: err.message });
    }
  },
);

/* =========================
   GET USERS (FILTERED)
========================= */
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      role,
      departmentId,
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (departmentId) query.departmentId = departmentId;
    if (status) query.isActive = status === "active";

    if (search) {
      query.$or = [
        { userId: new RegExp(search, "i") },
        { "personalInfo.firstName": new RegExp(search, "i") },
        { "personalInfo.lastName": new RegExp(search, "i") },
        { "personalInfo.email": new RegExp(search, "i") },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .populate("departmentId", "name code")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   ANALYTICS
========================= */
router.get("/analytics", protect, authorize("admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalHODs = await User.countDocuments({ role: "hod" });
    const pendingLeaves = 0;
    const departments = await Department.countDocuments();

    const recentActivity = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("userId role createdAt");

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalHODs,
          pendingLeaves,
          departments,
        },
        recentActivity: recentActivity.map((u) => ({
          user: u.userId,
          action: `Created as ${u.role}`,
          time: u.createdAt,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   RESET PASSWORD
========================= */
router.post(
  "/users/:id/reset-password",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const password = req.body.newPassword || "TempPass123!";
      // ❌ REMOVE manual hashing
      // const hashed = await bcrypt.hash(password, 10);

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          password, // ✅ Pass plain - schema will hash on next save
          isFirstLogin: true, // ✅ Use isFirstLogin (force password change)
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);

/* =========================
   DEPARTMENTS (UNCHANGED)
========================= */

router.get("/departments", protect, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).populate(
      "hodId",
      "userId personalInfo.firstName personalInfo.lastName",
    );

    res.json(departments);
  } catch {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

router.post("/departments", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, code, hodId, description, isActive } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Department name and code are required",
      });
    }

    const existing = await Department.findOne({
      $or: [{ name }, { code }],
    });

    if (existing) {
      return res.status(400).json({
        message: "Department with same name or code already exists",
      });
    }

    let hodUser = null;
    if (hodId) {
      hodUser = await User.findById(hodId);
      if (!hodUser || hodUser.role !== "hod") {
        return res.status(400).json({ message: "Invalid HOD ID" });
      }
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      hodId: hodUser ? hodUser._id : null,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create department",
      error: err.message,
    });
  }
});

router.put(
  "/departments/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(department);
  },
);

/* =========================
   GET SINGLE USER
========================= */
router.get("/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("departmentId", "name code")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "student") {
      const academic = await StudentAcademic.findOne({
        userId: user._id,
      }).lean();
      user.academicInfo = academic?.academicInfo || null;
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   UPDATE USER
========================= */
router.patch("/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      userId,
      role,
      departmentId,
      personalInfo,
      academicInfo,
      teachingInfo,
      hodInfo,
    } = req.body;

    // Check if user exists
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If changing userId, check if new userId already exists (and it's not the same user)
    if (userId && userId !== existingUser.userId) {
      const userIdExists = await User.findOne({ userId });
      if (userIdExists) {
        return res.status(400).json({ message: "User ID already exists" });
      }
      existingUser.userId = userId;
    }

    // Update fields
    if (role) existingUser.role = role;
    if (personalInfo)
      existingUser.personalInfo = {
        ...existingUser.personalInfo,
        ...personalInfo,
      };

    // Handle department
    if (role !== "admin") {
      existingUser.departmentId = departmentId || null;
    } else {
      existingUser.departmentId = null;
    }

    // Handle role-specific info
    if (role === "teacher" && teachingInfo) {
      existingUser.teachingInfo = teachingInfo;
    }
    if (role === "hod" && hodInfo) {
      existingUser.hodInfo = hodInfo;
    }

    // Save to trigger pre("save") hook if password was modified
    await existingUser.save();

    // Handle student academic info
    if (role === "student" && academicInfo) {
      await StudentAcademic.findOneAndUpdate(
        { userId: existingUser._id },
        {
          academicInfo,
          classTeacherId: academicInfo.classTeacherId,
          hodId: academicInfo.hodId,
        },
        { new: true, upsert: true, runValidators: true },
      );
    }

    res.json({
      message: "User updated successfully",
      user: {
        _id: existingUser._id,
        userId: existingUser.userId,
        role: existingUser.role,
        personalInfo: existingUser.personalInfo,
        departmentId: existingUser.departmentId,
      },
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   DELETE USER
========================= */
router.delete("/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find user first to check if exists and get role
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    // Delete role-specific records
    if (user.role === "student") {
      await StudentAcademic.findOneAndDelete({ userId: user._id });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "User deleted successfully",
      data: {
        deletedUserId: user._id,
        userId: user.userId,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});
export default router;
