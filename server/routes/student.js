import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import StudentAcademic from "../models/StudentAcademic.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import { protect, authorize } from "../middleware/auth.js";
import { notifyTeacherOfNewLeave } from "../utils/notificationService.js";

const router = express.Router();

router.use(protect);
router.use(authorize("student"));

// GET /api/student/dashboard-stats
router.get("/dashboard-stats", async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    const academic = await StudentAcademic.findOne({ userId: req.user.id });

    const pendingLeaves = await LeaveRequest.countDocuments({
      applicantId: req.user.id,
      status: { $in: ["pending", "approved_by_teacher"] },
      finalStatus: "pending",
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      applicantId: req.user.id,
      finalStatus: "approved",
    });

    const recentLeaves = await LeaveRequest.find({ applicantId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("leaveType", "name")
      .populate(
        "approvals.approverId",
        "personalInfo.firstName personalInfo.lastName role",
      );

    res.json({
      success: true,
      data: {
        studentName: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
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
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// GET /api/student/leave-history
router.get("/leave-history", async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ applicantId: req.user.id })
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
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// GET /api/student/leave-types - FILTERED FOR STUDENTS
router.get("/leave-types", async (req, res) => {
  try {
    // Filter for leave types applicable to students or all
    const types = await LeaveType.find({
      isActive: true,
      $or: [{ applicableTo: "student" }, { applicableTo: "all" }],
    }).select(
      "name code color maxDaysPerYear maxDaysPerMonth requiresDocument approvalHierarchy applicableTo isActive",
    );

    console.log(`Found ${types.length} leave types for student ${req.user.id}`);

    res.json({
      success: true,
      count: types.length,
      data: types,
    });
  } catch (err) {
    console.error("Leave types fetch error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// POST /api/student/leave-request - WITH VALIDATION
router.post("/leave-request", async (req, res) => {
  try {
    const { leaveTypeId, fromDate, toDate, reason, halfDay, halfDayType } =
      req.body;

    // Validate required fields
    if (!leaveTypeId || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: leaveTypeId, fromDate, toDate, reason",
      });
    }

    // Validate leaveTypeId format
    if (!mongoose.Types.ObjectId.isValid(leaveTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type ID format",
      });
    }

    // Check if leave type exists and is applicable to students
    const leaveType = await LeaveType.findOne({
      _id: leaveTypeId,
      isActive: true,
      $or: [{ applicableTo: "student" }, { applicableTo: "all" }],
    });

    if (!leaveType) {
      return res.status(400).json({
        success: false,
        message: "Invalid or unauthorized leave type for students",
      });
    }

    const student = await User.findById(req.user.id);
    const academic = await StudentAcademic.findOne({ userId: req.user.id });

    // Parse and validate dates
    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    // Calculate days
    const timeDiff = Math.abs(end - start);
    let days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    if (halfDay) days = 0.5;

    // Optional: Check if student exceeds max days limit
    if (leaveType.maxDaysPerYear > 0) {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      const usedLeaves = await LeaveRequest.aggregate([
        {
          $match: {
            applicantId: new mongoose.Types.ObjectId(req.user.id),
            leaveType: new mongoose.Types.ObjectId(leaveTypeId),
            finalStatus: "approved",
            "dateRange.from": { $gte: yearStart, $lte: yearEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: "$dateRange.days" },
          },
        },
      ]);

      const usedDays = usedLeaves[0]?.totalDays || 0;
      if (usedDays + days > leaveType.maxDaysPerYear) {
        return res.status(400).json({
          success: false,
          message: `You have exceeded the maximum ${leaveType.maxDaysPerYear} days per year for ${leaveType.name}. Used: ${usedDays}, Requesting: ${days}`,
        });
      }
    }

    // Create Leave Request
    const leaveRequest = new LeaveRequest({
      requestId: `LR-${Date.now()}`,
      applicantId: req.user.id,
      applicantType: "student",
      leaveType: leaveTypeId,
      dateRange: {
        from: start,
        to: end,
        days: days,
        halfDay: halfDay || false,
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

    // Notify class teacher immediately
    try {
      await notifyTeacherOfNewLeave(leaveRequest);
    } catch (notifyErr) {
      console.error("Failed to notify teacher:", notifyErr);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: leaveRequest,
    });
  } catch (err) {
    console.error("Leave request creation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// GET /api/student/download-letter/:leaveId
router.get("/download-letter/:leaveId", async (req, res) => {
  try {
    // Validate leaveId format
    if (!mongoose.Types.ObjectId.isValid(req.params.leaveId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid leave ID format" });
    }

    const leave = await LeaveRequest.findOne({
      _id: req.params.leaveId,
      applicantId: req.user.id,
    });

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, message: "Leave request not found" });
    }

    if (leave.finalStatus === "approved" && leave.approvalLetter?.url) {
      return res.json({
        success: true,
        url: leave.approvalLetter.url,
        type: "approval",
      });
    }

    if (leave.finalStatus === "rejected" && leave.rejectionLetter?.url) {
      return res.json({
        success: true,
        url: leave.rejectionLetter.url,
        type: "rejection",
      });
    }

    res
      .status(404)
      .json({ success: false, message: "Letter not available yet" });
  } catch (err) {
    console.error("Download letter error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// GET /api/student/leave-balance/:leaveTypeId - Get remaining balance for a leave type
router.get("/leave-balance/:leaveTypeId", async (req, res) => {
  try {
    const { leaveTypeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(leaveTypeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid leave type ID" });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return res
        .status(404)
        .json({ success: false, message: "Leave type not found" });
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const usedLeaves = await LeaveRequest.aggregate([
      {
        $match: {
          applicantId: new mongoose.Types.ObjectId(req.user.id),
          leaveType: new mongoose.Types.ObjectId(leaveTypeId),
          finalStatus: "approved",
          "dateRange.from": { $gte: yearStart, $lte: yearEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: "$dateRange.days" },
        },
      },
    ]);

    const usedDays = usedLeaves[0]?.totalDays || 0;
    const totalAllowed = leaveType.maxDaysPerYear;
    const remaining = totalAllowed > 0 ? totalAllowed - usedDays : "Unlimited";

    res.json({
      success: true,
      data: {
        leaveType: leaveType.name,
        totalAllowed,
        usedDays,
        remaining,
        unit: "days",
      },
    });
  } catch (err) {
    console.error("Leave balance error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
