import express from "express";
import { getHodAnalytics } from "../controllers/hodController.js";
import { protect } from "../middleware/auth.js";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import StudentAcademic from "../models/StudentAcademic.js"; // Add this import
import {
  generateApprovalLetter,
  generateRejectionLetter,
} from "../utils/pdfGenerator.js";

const router = express.Router();

/* ================= ROLE GUARD ================= */

const onlyHod = (req, res, next) => {
  if (!req.user || req.user.role !== "hod") {
    return res.status(403).json({
      success: false,
      message: "Only HOD allowed",
    });
  }
  next();
};

/* ================= ANALYTICS ================= */

router.get("/analytics", protect, onlyHod, getHodAnalytics);

/* ================= PENDING LEAVES ================= */

router.get("/pending-leaves", protect, onlyHod, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      status: "approved_by_teacher",
      finalStatus: "pending",
      currentLevel: 2,
    })
       .populate({
      path: "applicantId",
      populate: {
        path: "departmentId",
        model: "Department"
      }
    })
    .populate("leaveType")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    console.error("pending-leaves crash:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= APPROVE / REJECT ================= */

router.post("/action/:id", protect, onlyHod, async (req, res) => {
  try {
    const { action, remark, rejectionReason } = req.body;
    
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    // Load leave with student
    const leave = await LeaveRequest.findById(req.params.id)
      .populate("applicantId")
      .populate("leaveType");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // Load approver
    const approver = await User.findById(req.user._id).populate("departmentId");

    // Status update - Use valid enum values from schema
    if (action === "approve") {
      leave.status = "approved_by_hod";
      leave.finalStatus = "approved";
      leave.currentLevel = 3;
    }

    if (action === "reject") {
      leave.status = "rejected";
      leave.finalStatus = "rejected";
      leave.currentLevel = 0;
    }

    // Add to approval history
    leave.approvals.push({
      level: 2,
      approverId: req.user._id,
      status: action === "approve" ? "approved" : "rejected",
      remarks: remark || rejectionReason || "",
      approvedAt: action === "approve" ? new Date() : undefined,
      rejectedAt: action === "reject" ? new Date() : undefined,
    });

    await leave.save();

    res.json({
      success: true,
      message: `Leave ${action}ed by HOD`,
      data: leave,
    });
  } catch (err) {
    console.error("HOD action crash:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= HISTORY ================= */

router.get("/history", protect, onlyHod, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      status: { $in: ["approved_by_hod", "rejected"] },
    })
      .populate("applicantId")
      .populate("leaveType")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: leaves,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= DOWNLOAD LETTER ================= */

router.get("/download-letter/:id", protect, onlyHod, async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave?.approvalLetter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    res.download(`.${leave.approvalLetter}`);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ---------------- HOD TEACHERS ---------------- */

router.get("/teachers", protect, onlyHod, async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teachers,
    });
  } catch (err) {
    console.error("HOD teachers error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= UPDATED HOD STUDENTS ENDPOINT ================= */

router.get("/students", protect, onlyHod, async (req, res) => {
  try {
    // First, get the HOD's department
    const hod = await User.findById(req.user._id).populate("hodInfo.managedDepartments");
    
    let departmentIds = [];
    
    // Get department IDs that this HOD manages
    if (hod.hodInfo?.managedDepartments?.length > 0) {
      departmentIds = hod.hodInfo.managedDepartments.map(d => d._id);
    } else if (hod.departmentId) {
      departmentIds = [hod.departmentId];
    }
    
    if (departmentIds.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Get all students in these departments
    const students = await User.find({
      role: "student",
      departmentId: { $in: departmentIds },
      isActive: true,
    })
      .select("-password")
      .populate("departmentId", "name code")
      .sort({ createdAt: -1 });

    // Get academic info for each student
    const studentIds = students.map(s => s._id);
    const academics = await StudentAcademic.find({
      userId: { $in: studentIds },
    }).lean();

    // Create a map of academic info by userId
    const academicMap = new Map();
    academics.forEach((a) => {
      academicMap.set(String(a.userId), a.academicInfo);
    });

    // Merge academic info with student data
    const studentsWithAcademic = students.map((student) => ({
      ...student.toObject(),
      academicInfo: academicMap.get(String(student._id)) || {},
    }));

    res.json({
      success: true,
      count: studentsWithAcademic.length,
      data: studentsWithAcademic,
    });
  } catch (err) {
    console.error("HOD students error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= DEPARTMENT INFO ================= */

router.get("/department-info", protect, onlyHod, async (req, res) => {
  try {
    const hod = await User.findById(req.user._id)
      .populate({
        path: "departmentId",
        select: "name code description"
      });

    if (!hod) {
      return res.status(404).json({
        success: false,
        message: "HOD not found",
      });
    }

    const department = hod.departmentId;
    
    if (!department) {
      return res.json({
        success: true,
        data: {
          departmentName: "No Department Assigned",
          departmentCode: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        departmentName: department.name,
        departmentCode: department.code,
        departmentDescription: department.description,
      },
    });
  } catch (err) {
    console.error("Department info error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= HOD PROFILE ================= */

// Get HOD profile
router.get("/profile", protect, onlyHod, async (req, res) => {
  try {
    const hod = await User.findById(req.user._id)
      .select("-password")
      .populate("departmentId", "name code")
      .populate("hodInfo.managedDepartments", "name code");

    if (!hod) {
      return res.status(404).json({
        success: false,
        message: "HOD not found",
      });
    }

    res.json({
      success: true,
      data: hod,
    });
  } catch (err) {
    console.error("Get HOD profile error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Update HOD profile
router.patch("/profile", protect, onlyHod, async (req, res) => {
  try {
    const { personalInfo, hodInfo } = req.body;
    
    const hod = await User.findById(req.user._id);
    
    if (!hod) {
      return res.status(404).json({
        success: false,
        message: "HOD not found",
      });
    }

    // Update personal info
    if (personalInfo) {
      hod.personalInfo = {
        ...hod.personalInfo,
        ...personalInfo,
      };
    }

    // Update HOD info
    if (hodInfo) {
      hod.hodInfo = {
        ...hod.hodInfo,
        ...hodInfo,
      };
    }

    await hod.save();

    // Fetch updated profile with populated fields
    const updatedHod = await User.findById(req.user._id)
      .select("-password")
      .populate("departmentId", "name code")
      .populate("hodInfo.managedDepartments", "name code");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedHod,
    });
  } catch (err) {
    console.error("Update HOD profile error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Get department info for HOD (alternative endpoint)
router.get("/department-info", protect, onlyHod, async (req, res) => {
  try {
    const hod = await User.findById(req.user._id)
      .populate("departmentId", "name code")
      .populate("hodInfo.managedDepartments", "name code");

    let departmentName = "";
    
    if (hod?.departmentId?.name) {
      departmentName = hod.departmentId.name;
    } else if (hod?.hodInfo?.managedDepartments?.length > 0) {
      departmentName = hod.hodInfo.managedDepartments[0].name;
    }

    res.json({
      success: true,
      data: {
        departmentName,
        managedDepartments: hod?.hodInfo?.managedDepartments || [],
      },
    });
  } catch (err) {
    console.error("Get department info error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ---------------- HOD STUDENT DETAILS ---------------- */

router.get("/students/:id", protect, onlyHod, async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student",
    })
      .select("-password")
      .populate("departmentId", "name code");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get academic info
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
  } catch (err) {
    console.error("HOD student details error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;