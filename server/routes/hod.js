import express from "express";
import { getHodAnalytics } from "../controllers/hodController.js";
import { protect } from "../middleware/auth.js";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
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
      .populate("applicantId")
      .populate("leaveType")
      .populate("departmentId")
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

    /* ---------- LOAD LEAVE WITH STUDENT ---------- */

    const leave = await LeaveRequest.findById(req.params.id)
      .populate("applicantId")
      .populate("leaveType")
      .populate("departmentId");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    /* ---------- LOAD APPROVER ---------- */

    const approver = await User.findById(req.user._id).populate("departmentId");

    /* ---------- STATUS UPDATE ---------- */

    if (action === "approve") {
      leave.status = "approved_by_hod";
      leave.finalStatus = "approved";
      leave.currentLevel = 3;

      const letter = await generateApprovalLetter(leave, approver);
      leave.approvalLetter = letter.url;
    }

    if (action === "reject") {
      leave.status = "rejected_by_hod";
      leave.finalStatus = "rejected";

      const letter = await generateRejectionLetter(
        leave,
        approver,
        rejectionReason || remark || "Not specified",
      );

      leave.approvalLetter = letter.url;
    }

    /* ---------- APPROVAL HISTORY ---------- */

    leave.approvals.push({
      level: 2,
      approverId: req.user._id,
      action,
      remark: remark || "",
      date: new Date(),
    });

    await leave.save();

    res.json({
      success: true,
      message: `Leave ${action}ed by HOD`,
      approvalLetter: leave.approvalLetter,
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
      status: { $in: ["approved_by_hod", "rejected_by_hod"] },
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

/* ---------------- HOD STUDENTS ---------------- */

router.get("/students", protect, onlyHod, async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      isActive: true,
    })
      .select("-password")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (err) {
    console.error("HOD students error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
