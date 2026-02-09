import express from "express";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import StudentAcademic from "../models/StudentAcademic.js";
import { protect, authorize } from "../middleware/auth.js";
import { notifyStudentOfStatus } from "../utils/notificationService.js";
import {
  generateApprovalLetter,
  generateRejectionLetter,
} from "../utils/pdfGenerator.js";

const router = express.Router();

router.use(protect);
router.use(authorize("hod"));

// GET /api/hod/dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    const hod = await User.findById(req.user.id);
    const managedDepts = hod.hodInfo?.managedDepartments || [];

    // Get teachers in department
    const deptTeachers = await User.countDocuments({
      role: "teacher",
      departmentId: { $in: managedDepts },
    });

    // Get students in department
    const students = await StudentAcademic.countDocuments({
      departmentId: { $in: managedDepts },
    });

    // Pending approvals for HOD (level 2)
    const pendingApprovals = await LeaveRequest.countDocuments({
      status: "approved_by_teacher",
      currentLevel: 2,
      finalStatus: "pending",
    });

    // Calculate leave percentage
    const totalLeaves = await LeaveRequest.countDocuments({
      applicantId: {
        $in: await StudentAcademic.find({
          departmentId: { $in: managedDepts },
        }).distinct("userId"),
      },
    });
    const approvedLeaves = await LeaveRequest.countDocuments({
      applicantId: {
        $in: await StudentAcademic.find({
          departmentId: { $in: managedDepts },
        }).distinct("userId"),
      },
      finalStatus: "approved",
    });
    const leavePercentage =
      totalLeaves > 0 ? Math.round((approvedLeaves / totalLeaves) * 100) : 0;

    res.json({
      success: true,
      data: {
        deptTeachers,
        pendingApprovals,
        students,
        leavePercentage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/hod/dashboard/pending-approvals
router.get("/dashboard/pending-approvals", async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({
      status: "approved_by_teacher",
      currentLevel: 2,
      finalStatus: "pending",
    })
      .populate(
        "applicantId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("leaveType", "name")
      .populate(
        "approvals.approverId",
        "personalInfo.firstName personalInfo.lastName",
      )
      .sort({ createdAt: -1 });

    const formatted = leaves.map((leave) => ({
      _id: leave._id,
      name: `${leave.applicantId.personalInfo.firstName} ${leave.applicantId.personalInfo.lastName}`,
      type: leave.leaveType.name,
      typeCode: leave.leaveType.name.toUpperCase().includes("MEDICAL")
        ? "MEDICAL"
        : "REGULAR",
      days: leave.dateRange.days,
      startDate: leave.dateRange.from,
      endDate: leave.dateRange.to,
      date: new Date(leave.createdAt).toLocaleDateString(),
      urgent: leave.dateRange.days <= 2,
      previouslyApprovedBy: leave.approvals.find((a) => a.level === 1)
        ?.approverId?.personalInfo?.firstName,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/hod/dashboard/approve-leave/:leaveId
router.post("/dashboard/approve-leave/:leaveId", async (req, res) => {
  try {
    const { comments } = req.body;
    const leave = await LeaveRequest.findById(req.params.leaveId).populate(
      "applicantId",
      "personalInfo",
    );

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Generate approval letter
    const hod = await User.findById(req.user.id);
    const letter = await generateApprovalLetter(leave, hod);

    // Add HOD approval
    leave.approvals.push({
      level: 2,
      approverId: req.user.id,
      status: "approved",
      remarks: comments,
      approvedAt: new Date(),
    });

    leave.status = "approved_by_hod";
    leave.finalStatus = "approved";
    leave.approvalLetter = {
      url: letter.url,
      generatedAt: new Date(),
      generatedBy: req.user.id,
    };

    await leave.save();

    // Notify student
    await notifyStudentOfStatus(
      leave,
      "approved",
      `${hod.personalInfo.firstName} ${hod.personalInfo.lastName}`,
    );

    res.json({
      success: true,
      message: "Leave finally approved",
      data: leave,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/hod/dashboard/reject-leave/:leaveId
router.post("/dashboard/reject-leave/:leaveId", async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await LeaveRequest.findById(req.params.leaveId).populate(
      "applicantId",
      "personalInfo",
    );

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Generate rejection letter
    const hod = await User.findById(req.user.id);
    const letter = await generateRejectionLetter(leave, hod, reason);

    leave.approvals.push({
      level: 2,
      approverId: req.user.id,
      status: "rejected",
      remarks: reason,
      rejectedAt: new Date(),
    });

    leave.status = "rejected";
    leave.finalStatus = "rejected";
    leave.rejectionLetter = {
      url: letter.url,
      generatedAt: new Date(),
      generatedBy: req.user.id,
      reason,
    };

    await leave.save();

    // Notify student
    await notifyStudentOfStatus(
      leave,
      "rejected",
      `${hod.personalInfo.firstName} ${hod.personalInfo.lastName}`,
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

export default router;
