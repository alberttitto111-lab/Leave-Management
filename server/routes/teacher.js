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

const router = express.Router();

/* =====================================================
   MIDDLEWARE
===================================================== */
router.use(protect);
router.use(authorize("teacher"));

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
router.get("/students/:id", protect, authorize("teacher"), async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    }).select("-password");

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

export default router;
