import mongoose from "mongoose";
import User from "../models/User.js";
import StudentAcademic from "../models/StudentAcademic.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import { notifyTeacherOfNewLeave } from "../utils/notificationService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";

// @desc    Get dashboard stats
// @route   GET /api/student/dashboard-stats
// @access  Private/Student
export const getDashboardStats = asyncHandler(async (req, res) => {
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
});

// @desc    Get leave history
// @route   GET /api/student/leave-history
// @access  Private/Student
export const getLeaveHistory = asyncHandler(async (req, res) => {
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
});

// @desc    Get leave types
// @route   GET /api/student/leave-types
// @access  Private/Student
export const getLeaveTypes = asyncHandler(async (req, res) => {
  // Filter for leave types applicable to students or all
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
});

// @desc    Create leave request
// @route   POST /api/student/leave-request
// @access  Private/Student
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveTypeId, fromDate, toDate, reason, halfDay, halfDayType } =
    req.body;

  // Validate required fields
  if (!leaveTypeId || !fromDate || !toDate || !reason) {
    res.status(400);
    throw new Error(
      "Please provide all required fields: leaveTypeId, fromDate, toDate, reason",
    );
  }

  // Validate leaveTypeId format
  if (!mongoose.Types.ObjectId.isValid(leaveTypeId)) {
    res.status(400);
    throw new Error("Invalid leave type ID format");
  }

  // Check if leave type exists and is applicable to students
  const leaveType = await LeaveType.findOne({
    _id: leaveTypeId,
    isActive: true,
    $or: [{ applicableTo: "student" }, { applicableTo: "all" }],
  });

  if (!leaveType) {
    res.status(400);
    throw new Error("Invalid or unauthorized leave type for students");
  }

  // Parse and validate dates
  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400);
    throw new Error("Invalid date format");
  }

  if (end < start) {
    res.status(400);
    throw new Error("End date cannot be before start date");
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
      res.status(400);
      throw new Error(
        `You have exceeded the maximum ${leaveType.maxDaysPerYear} days per year for ${leaveType.name}. Used: ${usedDays}, Requesting: ${days}`,
      );
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
});

// @desc    Download leave letter
// @route   GET /api/student/download-letter/:leaveId
// @access  Private/Student
export const downloadLetter = asyncHandler(async (req, res) => {
  // Validate leaveId format
  if (!mongoose.Types.ObjectId.isValid(req.params.leaveId)) {
    res.status(400);
    throw new Error("Invalid leave ID format");
  }

  const leave = await LeaveRequest.findOne({
    _id: req.params.leaveId,
    applicantId: req.user.id,
  });

  if (!leave) {
    res.status(404);
    throw new Error("Leave request not found");
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

  res.status(404);
  throw new Error("Letter not available yet");
});

// @desc    Get leave balance
// @route   GET /api/student/leave-balance/:leaveTypeId
// @access  Private/Student
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const { leaveTypeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(leaveTypeId)) {
    res.status(400);
    throw new Error("Invalid leave type ID");
  }

  const leaveType = await LeaveType.findById(leaveTypeId);

  if (!leaveType) {
    res.status(404);
    throw new Error("Leave type not found");
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
});

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private/Student
export const getStudentProfile = asyncHandler(async (req, res) => {
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
  const academicInfo = await StudentAcademic.findOne({ 
    userId: student._id 
  }).populate("classTeacherId", "personalInfo.firstName personalInfo.lastName userId")
    .populate("hodId", "personalInfo.firstName personalInfo.lastName userId");

  res.status(200).json({
    success: true,
    data: {
      ...student.toObject(),
      academicInfo: academicInfo?.academicInfo || null,
      classTeacher: academicInfo?.classTeacherId || null,
      hod: academicInfo?.hodId || null,
    },
  });
});

// @desc    Update student profile
// @route   PATCH /api/student/profile
// @access  Private/Student
export const updateStudentProfile = asyncHandler(async (req, res) => {
  const { personalInfo, academicInfo, departmentId } = req.body;

  // Find student
  const student = await User.findById(req.user.id);
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found"
    });
  }

  // Update personal info
  if (personalInfo) {
    student.personalInfo = {
      ...student.personalInfo,
      ...personalInfo,
    };
  }

  // Update department if provided
  if (departmentId) {
    student.departmentId = departmentId;
  }

  await student.save();

  // Update academic info
  if (academicInfo) {
    const studentAcademic = await StudentAcademic.findOne({ 
      userId: student._id 
    });

    if (studentAcademic) {
      studentAcademic.academicInfo = {
        ...studentAcademic.academicInfo,
        ...academicInfo,
      };
      await studentAcademic.save();
    } else {
      // Create academic info if it doesn't exist
      await StudentAcademic.create({
        userId: student._id,
        academicInfo: academicInfo,
      });
    }
  }

  // Get updated profile
  const updatedStudent = await User.findById(req.user.id)
    .select("-password")
    .populate("departmentId", "name code");

  const updatedAcademic = await StudentAcademic.findOne({ 
    userId: student._id 
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      ...updatedStudent.toObject(),
      academicInfo: updatedAcademic?.academicInfo || null,
    },
  });
});