import express from "express";
import User from "../models/User.js";
import StudentAcademic from "../models/StudentAcademic.js";
import Leave from "../models/Leave.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import path from "path";
import fs from "fs";
const router = express.Router();

router.use(protect);
router.use(authorize("teacher", "hod"));

/* =========================
   GET TEACHER PROFILE
========================= */
router.get("/profile", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id)
      .select("-password")
      .populate("departmentId", "name code")
      .lean();

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ success: true, data: teacher });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   UPDATE TEACHER PROFILE - FIXED
========================= */
router.patch("/profile", async (req, res) => {
  try {
    console.log("PATCH BODY RECEIVED:", req.body);

    // 1. Updated Allowed Fields to include Professional Details
    const allowedFields = [
      // Personal Info
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      // Professional Info
      "bio",
      "qualification",
      "experience",
      "specialization",
    ];

    const updates = {};
    const bodyKeys = Object.keys(req.body);

    // 2. Determine if we are using dot notation from frontend
    const hasPrefix = bodyKeys.some(
      (key) =>
        key.startsWith("personalInfo.") ||
        key.startsWith("professionalDetails."),
    );

    if (hasPrefix) {
      // Handle dot notation format: { "personalInfo.email": "...", "professionalDetails.bio": "..." }
      for (const key of bodyKeys) {
        const parts = key.split(".");
        const prefix = parts[0]; // personalInfo or professionalDetails
        const field = parts[1];

        if (
          (prefix === "personalInfo" || prefix === "professionalDetails") &&
          allowedFields.includes(field)
        ) {
          updates[key] = req.body[key];
        }
      }
    } else {
      // Handle nested object format: { personalInfo: { email: "..." }, professionalDetails: { bio: "..." } }

      // Personal Info Updates
      if (req.body.personalInfo) {
        for (const field of allowedFields) {
          if (req.body.personalInfo[field] !== undefined) {
            updates[`personalInfo.${field}`] = req.body.personalInfo[field];
          }
        }
      }

      // Professional Info Updates
      if (req.body.professionalDetails) {
        for (const field of allowedFields) {
          if (req.body.professionalDetails[field] !== undefined) {
            updates[`professionalDetails.${field}`] =
              req.body.professionalDetails[field];
          }
        }
      }
    }

    console.log("FILTERED UPDATES FOR MONGOOSE:", updates);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    // 3. Perform the update
    const teacher = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .select("-password")
      .populate("departmentId", "name code");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: teacher,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   GET ASSIGNED STUDENTS
========================= */
router.get("/students", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);

    const query = {
      role: "student",
      isActive: true,
    };

    if (teacher.teachingInfo?.classSections?.length > 0) {
      const sections = teacher.teachingInfo.classSections;

      const studentAcademics = await StudentAcademic.find({
        $or: sections.map((sec) => {
          const [cls, sect] = sec.split("-");
          return {
            "academicInfo.class": cls,
            "academicInfo.section": sect,
          };
        }),
      }).select("userId");

      query._id = { $in: studentAcademics.map((s) => s.userId) };
    }

    if (
      teacher.teachingInfo?.isClassTeacher &&
      teacher.teachingInfo?.classSections?.[0]
    ) {
      const [cls, sect] = teacher.teachingInfo.classSections[0].split("-");

      const studentAcademics = await StudentAcademic.find({
        "academicInfo.class": cls,
        "academicInfo.section": sect,
      }).select("userId");

      query._id = { $in: studentAcademics.map((s) => s.userId) };
    }

    const students = await User.find(query)
      .select("-password")
      .populate("departmentId", "name code")
      .lean();

    const studentsWithAcademics = await Promise.all(
      students.map(async (student) => {
        const academic = await StudentAcademic.findOne({
          userId: student._id,
        }).lean();

        return {
          ...student,
          academicInfo: academic?.academicInfo || null,
        };
      }),
    );

    res.json({
      success: true,
      count: studentsWithAcademics.length,
      data: studentsWithAcademics,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   GET PENDING LEAVES
========================= */
router.get("/leaves/pending", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);

    const query = {
      status: "pending_teacher",
      teacherId: req.user.id,
    };

    if (teacher.teachingInfo?.isClassTeacher) {
      const classSection = teacher.teachingInfo.classSections?.[0];
      if (classSection) {
        const [cls, sect] = classSection.split("-");

        const students = await StudentAcademic.find({
          "academicInfo.class": cls,
          "academicInfo.section": sect,
        }).select("userId");

        query.$or = [
          { teacherId: req.user.id },
          { studentId: { $in: students.map((s) => s.userId) } },
        ];
      }
    }

    const leaves = await Leave.find(query)
      .populate("studentId", "userId personalInfo role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   GET STUDENT DETAILS
========================= */
router.get("/students/:id", async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    })
      .select("-password")
      .populate("departmentId", "name code")
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const academic = await StudentAcademic.findOne({
      userId: student._id,
    }).lean();

    const leaves = await Leave.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...student,
        academicInfo: academic?.academicInfo || null,
        leaveHistory: leaves,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =========================
   DASHBOARD STATS
========================= */
router.get("/dashboard-stats", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);

    let totalStudents = 0;
    let pendingLeaves = 0;
    let todayAbsents = 0;

    if (teacher.teachingInfo?.classSections?.length > 0) {
      const sections = teacher.teachingInfo.classSections;

      totalStudents = await StudentAcademic.countDocuments({
        $or: sections.map((sec) => {
          const [cls, sect] = sec.split("-");
          return {
            "academicInfo.class": cls,
            "academicInfo.section": sect,
          };
        }),
      });

      pendingLeaves = await Leave.countDocuments({
        status: "pending_teacher",
        teacherId: req.user.id,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      todayAbsents = await Leave.countDocuments({
        status: "approved_by_teacher",
        fromDate: { $lte: today },
        toDate: { $gte: today },
      });
    }

    res.json({
      success: true,
      data: {
        totalStudents,
        pendingLeaves,
        todayAbsents,
        assignedClasses: teacher.teachingInfo?.classSections || [],
        subjects: teacher.teachingInfo?.subjects || [],
        isClassTeacher: teacher.teachingInfo?.isClassTeacher || false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
/* =========================
   UPLOAD PROFILE PHOTO
========================= */
router.post(
  "/profile/upload-photo",
  upload.single("profilePicture"), // Ensure this matches formData.append()
  async (req, res) => {
    try {
      // --- DEBUGGING LOG ---
      console.log("Multer file received:", req.file);
      console.log("Request body:", req.body);
      // ---------------------

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const teacher = await User.findById(req.user.id);

      // Delete old photo if it exists
      if (teacher.personalInfo?.profilePicture) {
        const oldPhotoPath = path.join(
          process.cwd(),
          teacher.personalInfo.profilePicture,
        );
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Save new photo path
      // Using relative path for URL access, adjust based on your static folder config
      const photoPath = `/uploads/${req.file.filename}`;
      teacher.personalInfo.profilePicture = photoPath;
      await teacher.save();

      res.json({
        success: true,
        message: "Photo uploaded successfully",
        data: teacher,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
);
export default router;
