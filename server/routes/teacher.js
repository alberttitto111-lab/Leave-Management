import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import StudentAcademic from "../models/StudentAcademic.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  notifyHODOfApproval,
  notifyStudentOfStatus,
} from "../utils/notificationService.js";
import {
  generateApprovalLetter,
  generateRejectionLetter,
} from "../utils/pdfGenerator.js";
import mongoose from "mongoose";

import {
  getProfile,
  updateProfile,
  getDashboardStats,
  getPendingLeaves,
  getLeaveHistory,
  getLeaveDetails,
  approveLeave,
  rejectLeave,
  getStudents,
  getStudentDetails,
   getAllLeavesWithCounts,
} from "../controllers/teacherController.js";

const router = express.Router();

/* =====================================================
   MIDDLEWARE
===================================================== */
router.use(protect);
router.use(authorize("teacher"));

// Profile routes
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

/* =====================================================
   HELPER — Get teacher class filter
===================================================== */
const buildClassSectionFilter = (classSections = []) => {
  if (!classSections.length) return [];

  return classSections.map((cs) => {
    const [cls, section] = cs.split("-");
    return {
      "academicInfo.class": cls,
      "academicInfo.section": section,
    };
  });
};

// Add this new route
router.get("/leaves/all-with-counts", getAllLeavesWithCounts);

// Keep existing routes
router.get("/dashboard-stats", getDashboardStats);
router.get("/leaves/pending", getPendingLeaves);
router.get("/leaves/history", getLeaveHistory);
router.get("/leaves/:leaveId", getLeaveDetails);
router.post("/leaves/:leaveId/approve", approveLeave);
router.post("/leaves/:leaveId/reject", rejectLeave);
router.get("/students", getStudents);
router.get("/students/:id", getStudentDetails);

/* =====================================================
   GET /api/teacher/dashboard-stats
===================================================== */
router.get("/dashboard-stats", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const isClassTeacher = teacher.teachingInfo?.isClassTeacher || false;
    const classSections = teacher.teachingInfo?.classSections || [];

    let totalStudents = 0;
    let studentIds = [];

    if (classSections.length > 0) {
      const classFilter = buildClassSectionFilter(classSections);

      studentIds = await StudentAcademic.find({ $or: classFilter }).distinct(
        "userId",
      );

      totalStudents = studentIds.length;
    }

    const pendingLeaves = studentIds.length
      ? await LeaveRequest.countDocuments({
          applicantId: { $in: studentIds },
          status: "pending",
          currentLevel: 1,
        })
      : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        pendingLeaves,
        isClassTeacher,
        assignedClasses: classSections,
        subjects: teacher.teachingInfo?.subjects || [],
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =====================================================
   GET /api/teacher/leaves/pending
===================================================== */
router.get("/leaves/pending", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const classSections = teacher.teachingInfo?.classSections || [];
    const classFilter = buildClassSectionFilter(classSections);

    if (!classFilter.length) {
      return res.json({ success: true, data: [] });
    }

    const students = await StudentAcademic.find({ $or: classFilter }).distinct(
      "userId",
    );

    const leaves = await LeaveRequest.find({
      applicantId: { $in: students },
      status: "pending",
      currentLevel: 1,
    })
      .populate(
        "applicantId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("leaveType", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =====================================================
   GET /api/teacher/leaves/history
===================================================== */
router.get("/leaves/history", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    const classSections = teacher.teachingInfo?.classSections || [];
    const classFilter = buildClassSectionFilter(classSections);

    if (!classFilter.length) {
      return res.json({ success: true, data: [] });
    }

    const students = await StudentAcademic.find({ $or: classFilter }).distinct(
      "userId",
    );

    const leaves = await LeaveRequest.find({
      applicantId: { $in: students },
      status: { $ne: "pending" },
    })
      .populate(
        "applicantId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("leaveType", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =====================================================
   GET /api/teacher/leaves/:leaveId
===================================================== */
router.get("/leaves/:leaveId", async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.leaveId)
      .populate(
        "applicantId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("leaveType", "name");

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =====================================================
   POST /api/teacher/leaves/:leaveId/approve
===================================================== */
router.post("/leaves/:leaveId/approve", async (req, res) => {
  try {
    const { remarks } = req.body;

    const leave = await LeaveRequest.findById(req.params.leaveId)
      .populate("applicantId", "personalInfo userId")
      .populate("leaveType", "name");

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.currentLevel !== 1) {
      return res
        .status(400)
        .json({ message: "Not authorized for this approval level" });
    }

    const teacher = await User.findById(req.user.id);

    // record approval
    leave.approvals.push({
      level: 1,
      approverId: req.user.id,
      status: "approved",
      remarks: remarks || "Approved by class teacher",
      approvedAt: new Date(),
    });

    leave.status = "approved_by_teacher";
    leave.currentLevel = 2;

    // optional approval letter
    try {
      const letter = await generateApprovalLetter(leave, teacher);
      if (letter?.url) {
        leave.approvalLetter = {
          url: letter.url,
          generatedAt: new Date(),
          generatedBy: req.user.id,
        };
      }
    } catch (e) {
      console.error("Approval letter generation failed:", e.message);
    }

    await leave.save();

    await notifyHODOfApproval(leave);

    res.json({
      success: true,
      message: "Leave approved and forwarded to HOD",
      data: leave,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =====================================================
   POST /api/teacher/leaves/:leaveId/reject
===================================================== */
router.post("/leaves/:leaveId/reject", async (req, res) => {
  try {
    const { reason } = req.body;

    const leave = await LeaveRequest.findById(req.params.leaveId).populate(
      "applicantId",
      "personalInfo userId",
    );

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.currentLevel !== 1) {
      return res
        .status(400)
        .json({ message: "Not authorized for this rejection level" });
    }

    const teacher = await User.findById(req.user.id);

    const letter = await generateRejectionLetter(
      leave,
      teacher,
      reason || "Rejected by class teacher",
    );

    leave.approvals.push({
      level: 1,
      approverId: req.user.id,
      status: "rejected",
      remarks: reason,
      rejectedAt: new Date(),
    });

    leave.status = "rejected";
    leave.finalStatus = "rejected";
    leave.currentLevel = 0;

    if (letter?.url) {
      leave.rejectionLetter = {
        url: letter.url,
        generatedAt: new Date(),
        generatedBy: req.user.id,
        reason: reason,
      };
    }

    await leave.save();

    await notifyStudentOfStatus(
      leave,
      "rejected",
      `${teacher.personalInfo.firstName} ${teacher.personalInfo.lastName}`,
    );

    res.json({
      success: true,
      message: "Leave rejected",
      data: leave,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/teacher/profile
router.get("/profile", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// GET /api/teacher/students
router.get("/students", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!teacher.departmentId) {
      return res.json({ success: true, data: [] });
    }

    // 1️⃣ get all student users in same department
    const studentUsers = await User.find({
      role: "student",
      departmentId: teacher.departmentId,
      isActive: true,
    }).select("_id userId personalInfo");

    const userIds = studentUsers.map((u) => u._id);

    // 2️⃣ get academic records
    const academics = await StudentAcademic.find({
      userId: { $in: userIds },
    }).lean();

    const academicMap = new Map();
    academics.forEach((a) => {
      academicMap.set(String(a.userId), a.academicInfo);
    });

    // 3️⃣ merge
    const students = studentUsers.map((u) => ({
      _id: u._id,
      userId: u.userId,
      personalInfo: u.personalInfo,
      academicInfo: academicMap.get(String(u._id)) || {},
    }));

    // 4️⃣ sort by section + roll
    students.sort((a, b) => {
      const s1 = a.academicInfo.section || "";
      const s2 = b.academicInfo.section || "";
      if (s1 !== s2) return s1.localeCompare(s2);

      return (
        (a.academicInfo.rollNumber || 0) - (b.academicInfo.rollNumber || 0)
      );
    });

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (err) {
    console.error("Teacher students error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load students",
    });
  }
});

/* ================================
   GET SINGLE STUDENT DETAILS
================================ */
// In server/routes/teacher.js - Update the get student details route

router.get("/students/:id", protect, authorize("teacher"), async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    })
    .select("-password")
    .populate("departmentId", "name code"); // Add this line to populate department

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const academic = await StudentAcademic.findOne({
      userId: student._id,
    });

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        academicInfo: academic?.academicInfo || null,
      },
    });
  } catch (error) {
    console.error("Get student detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student details",
    });
  }
});

/* =====================================================
   GET /api/teacher/leave-requests - ALL department students
===================================================== */
router.get("/leave-requests", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!teacher.departmentId) {
      return res.json({ success: true, data: [] });
    }

    // Get ALL students in teacher's department (not just class sections)
    const students = await User.find({
      role: "student",
      departmentId: teacher.departmentId,
    }).distinct("_id");

    console.log("Found department students:", students.length);

    if (!students.length) {
      return res.json({ success: true, data: [] });
    }

    // Get pending leaves for these students
    const pendingLeaves = await LeaveRequest.find({
      applicantId: { $in: students },
      status: "pending",
      currentLevel: 1,
    })
      .populate(
        "applicantId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("leaveType", "name color")
      .sort({ createdAt: -1 });

    console.log("Found pending leaves:", pendingLeaves.length);

    res.json({ success: true, data: pendingLeaves });
  } catch (err) {
    console.error("Leave requests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =====================================================
   GET /api/teacher/leaves/all - Get all leaves for teacher's students
===================================================== */
router.get("/leaves/all", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const classSections = teacher.teachingInfo?.classSections || [];
    const classFilter = buildClassSectionFilter(classSections);

    if (!classFilter.length) {
      return res.json({ success: true, data: [] });
    }

    const students = await StudentAcademic.find({ $or: classFilter }).distinct(
      "userId",
    );

    const leaves = await LeaveRequest.find({
      applicantId: { $in: students },
    })
      .populate(
        "applicantId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("leaveType", "name color")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (err) {
    console.error("All leaves error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* =====================================================
   DEBUG: Check teacher's setup and matching students
===================================================== */
router.get("/debug/leave-setup", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);

    console.log("Teacher ID:", req.user.id);
    console.log("Teacher departmentId:", teacher.departmentId);
    console.log("Teacher classSections:", teacher.teachingInfo?.classSections);

    // Get all students in same department
    const deptStudents = await User.find({
      role: "student",
      departmentId: teacher.departmentId,
    }).select("_id userId personalInfo.firstName");

    console.log("Students in department:", deptStudents.length);
    console.log(
      "Student IDs:",
      deptStudents.map((s) => s._id.toString()),
    );

    // Get students by class-section filter
    const classSections = teacher.teachingInfo?.classSections || [];
    const classFilter = buildClassSectionFilter(classSections);

    let classStudents = [];
    if (classFilter.length > 0) {
      classStudents = await StudentAcademic.find({ $or: classFilter }).distinct(
        "userId",
      );
      console.log("Students in class sections:", classStudents.length);
      console.log(
        "Class student IDs:",
        classStudents.map((id) => id.toString()),
      );
    }

    // Check if our target student is in either list
    const targetStudentId = "69897915ee05b0d2e8195d86";
    console.log(
      "Target student in dept:",
      deptStudents.some((s) => s._id.toString() === targetStudentId),
    );
    console.log(
      "Target student in class:",
      classStudents.some((id) => id.toString() === targetStudentId),
    );

    // Get pending leaves for department students
    const deptStudentIds = deptStudents.map((s) => s._id);
    const deptLeaves = await LeaveRequest.find({
      applicantId: { $in: deptStudentIds },
      status: "pending",
    });

    // Get pending leaves for class students
    const classLeaves =
      classStudents.length > 0
        ? await LeaveRequest.find({
            applicantId: { $in: classStudents },
            status: "pending",
          })
        : [];

    res.json({
      success: true,
      debug: {
        teacherDept: teacher.departmentId,
        teacherClassSections: classSections,
        deptStudentsCount: deptStudents.length,
        classStudentsCount: classStudents.length,
        deptLeavesCount: deptLeaves.length,
        classLeavesCount: classLeaves.length,
        targetStudentInDept: deptStudents.some(
          (s) => s._id.toString() === targetStudentId,
        ),
        targetStudentInClass: classStudents.some(
          (id) => id.toString() === targetStudentId,
        ),
        sampleDeptLeaves: deptLeaves.slice(0, 2),
        sampleClassLeaves: classLeaves.slice(0, 2),
      },
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   GET /api/teacher/leaves/history-30days - All leaves from last 30 days
===================================================== */
router.get("/leaves/history-30days", async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    console.log("Teacher found:", teacher._id);
    console.log("Teacher department:", teacher.departmentId);
    console.log("Teacher classSections:", teacher.teachingInfo?.classSections);

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log("30 days ago:", thirtyDaysAgo);

    let studentIds = [];

    // Method 1: If teacher has department, get all department students
    if (teacher.departmentId) {
      console.log("Fetching by department...");
      const students = await User.find({
        role: "student",
        departmentId: teacher.departmentId,
      }).select("_id");

      studentIds = students.map((s) => s._id);
      console.log("Found department students:", studentIds.length);
    }

    // Method 2: Also check class sections if available
    const classSections = teacher.teachingInfo?.classSections || [];
    if (classSections.length > 0) {
      console.log("Fetching by class sections:", classSections);

      const classFilter = classSections.map((cs) => {
        const [cls, section] = cs.split("-");
        return {
          "academicInfo.class": cls,
          "academicInfo.section": section,
        };
      });

      const classStudents = await StudentAcademic.find({
        $or: classFilter,
      }).distinct("userId");
      console.log("Found class students:", classStudents.length);

      // Merge with department students (avoid duplicates)
      const classStudentIds = classStudents.map((id) => id.toString());
      const existingIds = studentIds.map((id) => id.toString());

      classStudentIds.forEach((id) => {
        if (!existingIds.includes(id)) {
          studentIds.push(new mongoose.Types.ObjectId(id));
        }
      });
    }

    if (studentIds.length === 0) {
      console.log("No students found");
      return res.json({
        success: true,
        data: [],
        grouped: {
          all: [],
          pending: [],
          approved: [],
          rejected: [],
          needsApproval: [],
        },
        summary: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          needsMyApproval: 0,
        },
      });
    }

    console.log("Total unique students:", studentIds.length);

    // Build query - last 30 days
    const query = {
      applicantId: { $in: studentIds },
      createdAt: { $gte: thirtyDaysAgo },
    };

    console.log("Query:", JSON.stringify(query));

    const leaves = await LeaveRequest.find(query)
      .populate(
        "applicantId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("leaveType", "name color")
      .populate(
        "approvals.approverId",
        "personalInfo.firstName personalInfo.lastName role",
      )
      .sort({ createdAt: -1 });

    console.log("Found leaves:", leaves.length);

    // Group by status for easier frontend handling
    const grouped = {
      all: leaves,
      pending: leaves.filter((l) => l.status === "pending"),
      approved: leaves.filter(
        (l) =>
          l.finalStatus === "approved" ||
          l.status === "approved_by_teacher" ||
          l.status === "approved_by_hod",
      ),
      rejected: leaves.filter(
        (l) => l.finalStatus === "rejected" || l.status === "rejected",
      ),
      needsApproval: leaves.filter(
        (l) => l.status === "pending" && l.currentLevel === 1,
      ),
    };

    res.json({
      success: true,
      data: leaves,
      grouped: grouped,
      summary: {
        total: leaves.length,
        pending: grouped.pending.length,
        approved: grouped.approved.length,
        rejected: grouped.rejected.length,
        needsMyApproval: grouped.needsApproval.length,
      },
    });
  } catch (err) {
    console.error("30-day history error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
      stack: err.stack,
    });
  }
});
export default router;
