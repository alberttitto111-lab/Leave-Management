import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import StudentAcademic from "../models/StudentAcademic.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import { protect, authorize } from "../middleware/auth.js";
import { notifyTeacherOfNewLeave } from "../utils/notificationService.js";
import {
  getDashboardStats,
  getLeaveHistory,
  getLeaveTypes,
  createLeaveRequest,
  downloadLetter,
  getLeaveBalance,
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("student"));

// Profile routes
router.get("/profile", getStudentProfile);
router.patch("/profile", updateStudentProfile);

// Dashboard stats
router.get("/dashboard-stats", getDashboardStats);

// Leave history
router.get("/leave-history", getLeaveHistory);

// Leave types
router.get("/leave-types", getLeaveTypes);

// Create leave request
router.post("/leave-request", createLeaveRequest);

// Download letter
router.get("/download-letter/:leaveId", downloadLetter);

// Leave balance
router.get("/leave-balance/:leaveTypeId", getLeaveBalance);

// Delete leave request
router.delete("/leave/:id", async (req, res) => {
  try {
    const leaveId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await LeaveRequest.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.applicantId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (leave.finalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete processed leave",
      });
    }

    await LeaveRequest.findByIdAndDelete(leaveId);

    res.json({
      success: true,
      message: "Leave deleted",
    });
  } catch (err) {
    console.error("Delete leave error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= DASHBOARD STATS ================= */

router.get("/dashboard-stats", async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    const academic = await StudentAcademic.findOne({ userId: req.user.id });

    const pendingLeaves = await LeaveRequest.countDocuments({
      applicantId: req.user.id,
      finalStatus: "pending",
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      applicantId: req.user.id,
      finalStatus: "approved",
    });

    const recentLeaves = await LeaveRequest.find({
      applicantId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("leaveType", "name color")
      .populate(
        "approvals.approverId",
        "personalInfo.firstName personalInfo.lastName role",
      );

    res.json({
      success: true,
      data: {
        studentName: student?.personalInfo
          ? `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
          : "Student",
        class: academic?.academicInfo?.class || "N/A",
        section: academic?.academicInfo?.section || "N/A",
        rollNumber: academic?.academicInfo?.rollNumber || "N/A",
        pendingLeaves,
        approvedLeaves,
        recentLeaves,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= LEAVE HISTORY ================= */

router.get("/leave-history", async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      applicantId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("leaveType", "name color")
      .populate(
        "approvals.approverId",
        "personalInfo.firstName personalInfo.lastName role",
      );

    res.json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    console.error("Leave history error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= LEAVE TYPES ================= */

router.get("/leave-types", async (req, res) => {
  try {
    const types = await LeaveType.find({
      isActive: true,
      $or: [{ applicableTo: "student" }, { applicableTo: "all" }],
    }).select(
      "name code color maxDaysPerYear maxDaysPerMonth requiresDocument approvalHierarchy applicableTo isActive",
    );

    res.json({
      success: true,
      count: types.length,
      data: types,
    });
  } catch (err) {
    console.error("Leave types fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

/* ================= CREATE LEAVE ================= */

router.post("/leave-request", async (req, res) => {
  try {
    const { leaveTypeId, fromDate, toDate, reason, halfDay, halfDayType } =
      req.body;

    if (!leaveTypeId || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide leaveTypeId, fromDate, toDate, reason",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type ID",
      });
    }

    const leaveType = await LeaveType.findOne({
      _id: leaveTypeId,
      isActive: true,
      $or: [{ applicableTo: "student" }, { applicableTo: "all" }],
    });

    if (!leaveType) {
      return res.status(400).json({
        success: false,
        message: "Leave type not allowed",
      });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start) || isNaN(end) || end < start) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (halfDay) days = 0.5;

    /* ===== YEAR LIMIT CHECK ===== */

    if (leaveType.maxDaysPerYear > 0) {
      const y = new Date().getFullYear();

      const used = await LeaveRequest.aggregate([
        {
          $match: {
            applicantId: new mongoose.Types.ObjectId(req.user.id),
            leaveType: new mongoose.Types.ObjectId(leaveTypeId),
            finalStatus: "approved",
            "dateRange.from": {
              $gte: new Date(y, 0, 1),
              $lte: new Date(y, 11, 31),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: "$dateRange.days" },
          },
        },
      ]);

      const usedDays = used[0]?.totalDays || 0;

      if (usedDays + days > leaveType.maxDaysPerYear) {
        return res.status(400).json({
          success: false,
          message: `Yearly limit exceeded. Used ${usedDays}/${leaveType.maxDaysPerYear}`,
        });
      }
    }

    const leaveRequest = new LeaveRequest({
      requestId: `LR-${Date.now()}`,
      applicantId: req.user.id,
      applicantType: "student",
      leaveType: leaveTypeId,
      dateRange: {
        from: start,
        to: end,
        days,
        halfDay: !!halfDay,
        halfDayType: halfDayType || null,
      },
      reason,
      status: "pending",
      currentLevel: 1,
      approvals: [],
      finalStatus: "pending",
    });

    await leaveRequest.save();
    await leaveRequest.populate("leaveType");

    try {
      await notifyTeacherOfNewLeave(leaveRequest);
    } catch (e) {
      console.error("Teacher notify failed:", e.message);
    }

    res.status(201).json({
      success: true,
      message: "Leave request submitted",
      data: leaveRequest,
    });
  } catch (err) {
    console.error("Leave create error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= DOWNLOAD LETTER ================= */

router.get("/download-letter/:leaveId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.leaveId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await LeaveRequest.findOne({
      _id: req.params.leaveId,
      applicantId: req.user.id,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // supports BOTH string and object formats
    const approvalUrl =
      typeof leave.approvalLetter === "string"
        ? leave.approvalLetter
        : leave.approvalLetter?.url;

    const rejectionUrl =
      typeof leave.rejectionLetter === "string"
        ? leave.rejectionLetter
        : leave.rejectionLetter?.url;

    if (leave.finalStatus === "approved" && approvalUrl) {
      return res.json({
        success: true,
        url: approvalUrl,
        type: "approval",
      });
    }

    if (leave.finalStatus === "rejected" && rejectionUrl) {
      return res.json({
        success: true,
        url: rejectionUrl,
        type: "rejection",
      });
    }

    res.status(404).json({
      success: false,
      message: "Letter not available yet",
    });
  } catch (err) {
    console.error("Download letter error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= DELETE LEAVE ================= */

router.delete("/leave/:id", async (req, res) => {
  try {
    const leaveId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await LeaveRequest.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.applicantId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (leave.finalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete processed leave",
      });
    }

    await LeaveRequest.findByIdAndDelete(leaveId);

    res.json({
      success: true,
      message: "Leave deleted",
    });
  } catch (err) {
    console.error("Delete leave error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= LEAVE BALANCE ================= */

router.get("/leave-balance/:leaveTypeId", async (req, res) => {
  try {
    const { leaveTypeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type ID",
      });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    const y = new Date().getFullYear();

    const used = await LeaveRequest.aggregate([
      {
        $match: {
          applicantId: new mongoose.Types.ObjectId(req.user.id),
          leaveType: new mongoose.Types.ObjectId(leaveTypeId),
          finalStatus: "approved",
          "dateRange.from": {
            $gte: new Date(y, 0, 1),
            $lte: new Date(y, 11, 31),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: "$dateRange.days" },
        },
      },
    ]);

    const usedDays = used[0]?.totalDays || 0;

    res.json({
      success: true,
      data: {
        leaveType: leaveType.name,
        totalAllowed: leaveType.maxDaysPerYear,
        usedDays,
        remaining:
          leaveType.maxDaysPerYear > 0
            ? leaveType.maxDaysPerYear - usedDays
            : "Unlimited",
        unit: "days",
      },
    });
  } catch (err) {
    console.error("Leave balance error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ================= student profile ================= */

router.get("/profile", protect, authorize("student"), async (req, res) => {
  try {
    const student = await User.findById(req.user.id)
      .select("-password")
      .populate("departmentId", "name code");
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get academic info
    const academic = await StudentAcademic.findOne({ 
      userId: student._id 
    }).populate("classTeacherId", "personalInfo.firstName personalInfo.lastName")
      .populate("hodId", "personalInfo.firstName personalInfo.lastName");

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        academicInfo: academic?.academicInfo || null,
        classTeacher: academic?.classTeacherId || null,
        hod: academic?.hodId || null
      }
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
});

// PATCH update student profile
router.patch("/profile", protect, authorize("student"), async (req, res) => {
  try {
    const { personalInfo, academicInfo } = req.body;
    
    // Update user personal info
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (personalInfo) {
      user.personalInfo = {
        ...user.personalInfo,
        ...personalInfo
      };
      await user.save();
    }

    // Update academic info if provided
    if (academicInfo) {
      const academic = await StudentAcademic.findOne({ userId: user._id });
      if (academic) {
        academic.academicInfo = {
          ...academic.academicInfo,
          ...academicInfo,
          parentDetails: {
            ...academic.academicInfo?.parentDetails,
            ...academicInfo.parentDetails
          }
        };
        await academic.save();
      }
    }

    res.json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
});

export default router;