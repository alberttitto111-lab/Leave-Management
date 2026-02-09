import User from "../models/User.js";
import Leave from "../models/Leave.js";
import LeaveBalance from "../models/LeaveBalance.js";
import Department from "../models/Department.js";
import asyncHandler from "express-async-handler";

// @desc    Get HOD Dashboard Stats
// @route   GET /api/hod/dashboard/stats
// @access  Private/HOD
export const getHODDashboardStats = asyncHandler(async (req, res) => {
  const hod = await User.findById(req.user._id).populate(
    "hodInfo.managedDepartments",
  );

  if (!hod || !hod.hodInfo?.managedDepartments?.length) {
    res.status(404);
    throw new Error("No managed departments found");
  }

  const departmentIds = hod.hodInfo.managedDepartments.map((d) => d._id);

  // Get department teachers count
  const teachersCount = await User.countDocuments({
    departmentId: { $in: departmentIds },
    role: "teacher",
    isActive: true,
  });

  // Get pending approvals for HOD
  const pendingApprovalsCount = await Leave.countDocuments({
    departmentId: { $in: departmentIds },
    status: "pending",
    currentApprover: "hod",
  });

  // Get students count (if applicable)
  const studentsCount = await User.countDocuments({
    departmentId: { $in: departmentIds },
    role: "student",
    isActive: true,
  });

  // Calculate leave percentage for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const totalStaff = await User.countDocuments({
    departmentId: { $in: departmentIds },
    role: { $in: ["teacher", "staff"] },
    isActive: true,
  });

  const onLeaveToday = await Leave.countDocuments({
    departmentId: { $in: departmentIds },
    status: "approved",
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  const leavePercentage =
    totalStaff > 0 ? Math.round((onLeaveToday / totalStaff) * 100) : 0;

  res.json({
    success: true,
    data: {
      deptTeachers: teachersCount,
      pendingApprovals: pendingApprovalsCount,
      students: studentsCount,
      leavePercentage: leavePercentage,
    },
  });
});

// @desc    Get Pending Approvals for HOD
// @route   GET /api/hod/dashboard/pending-approvals
// @access  Private/HOD
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const hod = await User.findById(req.user._id).populate(
    "hodInfo.managedDepartments",
  );
  const departmentIds = hod.hodInfo.managedDepartments.map((d) => d._id);

  const pendingLeaves = await Leave.find({
    departmentId: { $in: departmentIds },
    status: "pending",
    currentApprover: "hod",
  })
    .populate("userId", "personalInfo.firstName personalInfo.lastName role")
    .populate("leaveType", "name color code")
    .sort({ createdAt: -1 })
    .limit(10);

  const formattedApprovals = pendingLeaves.map((leave) => {
    const user = leave.userId;
    const fullName =
      `${user.personalInfo?.firstName || ""} ${user.personalInfo?.lastName || ""}`.trim();

    // Calculate urgency based on date and type
    const isUrgent =
      leave.leaveType?.code === "MEDICAL" ||
      new Date(leave.startDate) - new Date() < 24 * 60 * 60 * 1000;

    return {
      _id: leave._id,
      name: fullName || "Unknown",
      type: leave.leaveType?.name || "Leave",
      typeCode: leave.leaveType?.code,
      days: leave.numberOfDays,
      startDate: leave.startDate,
      endDate: leave.endDate,
      date: formatRelativeDate(leave.createdAt),
      urgent: isUrgent,
      reason: leave.reason,
      documents: leave.documents,
      userRole: user.role,
    };
  });

  res.json({
    success: true,
    count: formattedApprovals.length,
    data: formattedApprovals,
  });
});

// @desc    Get Department Overview (Today's stats)
// @route   GET /api/hod/dashboard/department-overview
// @access  Private/HOD
export const getDepartmentOverview = asyncHandler(async (req, res) => {
  const hod = await User.findById(req.user._id).populate(
    "hodInfo.managedDepartments",
  );
  const departmentIds = hod.hodInfo.managedDepartments.map((d) => d._id);
  const primaryDept = hod.hodInfo.managedDepartments[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get total staff in department
  const totalStaff = await User.countDocuments({
    departmentId: { $in: departmentIds },
    role: { $in: ["teacher", "staff", "hod"] },
    isActive: true,
  });

  // Get present today (not on leave and active)
  const onLeaveToday = await Leave.find({
    departmentId: { $in: departmentIds },
    status: "approved",
    startDate: { $lte: today },
    endDate: { $gte: today },
  }).distinct("userId");

  const presentCount = totalStaff - onLeaveToday.length;
  const presentPercentage =
    totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0;
  const leavePercentage =
    totalStaff > 0 ? Math.round((onLeaveToday.length / totalStaff) * 100) : 0;

  // Get absent (no leave approved but marked absent - simplified logic)
  // In real app, you'd check attendance records
  const absentCount = 0; // Placeholder for actual attendance logic
  const absentPercentage =
    totalStaff > 0 ? Math.round((absentCount / totalStaff) * 100) : 0;

  res.json({
    success: true,
    data: {
      departmentName: primaryDept?.name || "Department",
      totalStaff: totalStaff,
      stats: [
        {
          label: "Present",
          value: presentPercentage,
          count: presentCount,
          color: "#10B981",
        },
        {
          label: "On Leave",
          value: leavePercentage,
          count: onLeaveToday.length,
          color: "#F59E0B",
        },
        {
          label: "Absent",
          value: absentPercentage,
          count: absentCount,
          color: "#EF4444",
        },
      ],
    },
  });
});

// @desc    Get Department Teachers
// @route   GET /api/hod/dashboard/teachers
// @access  Private/HOD
export const getDepartmentTeachers = asyncHandler(async (req, res) => {
  const hod = await User.findById(req.user._id);
  const departmentIds = hod.hodInfo.managedDepartments;

  const teachers = await User.find({
    departmentId: { $in: departmentIds },
    role: "teacher",
    isActive: true,
  }).select("personalInfo teachingInfo userId");

  res.json({
    success: true,
    count: teachers.length,
    data: teachers,
  });
});

// @desc    Approve Leave
// @route   POST /api/hod/dashboard/approve-leave/:leaveId
// @access  Private/HOD
export const approveLeave = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;
  const { comments } = req.body;

  const leave = await Leave.findById(leaveId);
  if (!leave) {
    res.status(404);
    throw new Error("Leave request not found");
  }

  // Update leave status
  leave.status = "approved";
  leave.approvedBy = req.user._id;
  leave.approvalComments = comments || "";
  leave.approvedAt = new Date();
  leave.currentApprover = null;

  await leave.save();

  // Update leave balance
  await LeaveBalance.findOneAndUpdate(
    {
      userId: leave.userId,
      year: new Date().getFullYear(),
      leaveType: leave.leaveType,
    },
    { $inc: { used: leave.numberOfDays, remaining: -leave.numberOfDays } },
  );

  res.json({
    success: true,
    message: "Leave approved successfully",
    data: leave,
  });
});

// @desc    Reject Leave
// @route   POST /api/hod/dashboard/reject-leave/:leaveId
// @access  Private/HOD
export const rejectLeave = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;
  const { reason } = req.body;

  const leave = await Leave.findById(leaveId);
  if (!leave) {
    res.status(404);
    throw new Error("Leave request not found");
  }

  leave.status = "rejected";
  leave.rejectedBy = req.user._id;
  leave.rejectionReason = reason || "";
  leave.rejectedAt = new Date();
  leave.currentApprover = null;

  await leave.save();

  res.json({
    success: true,
    message: "Leave rejected successfully",
    data: leave,
  });
});

// @desc    Get Department Report
// @route   GET /api/hod/dashboard/department-report
// @access  Private/HOD
export const getDepartmentReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const targetYear = year || new Date().getFullYear();
  const targetMonth = month || new Date().getMonth() + 1;

  const hod = await User.findById(req.user._id);
  const departmentIds = hod.hodInfo.managedDepartments;

  // Aggregate leave data by type
  const leaveStats = await Leave.aggregate([
    {
      $match: {
        departmentId: {
          $in: departmentIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        status: "approved",
        $expr: {
          $and: [
            { $eq: [{ $year: "$startDate" }, parseInt(targetYear)] },
            { $eq: [{ $month: "$startDate" }, parseInt(targetMonth)] },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$leaveType",
        totalDays: { $sum: "$numberOfDays" },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      month: targetMonth,
      year: targetYear,
      leaveStats,
    },
  });
});

// Helper function
function formatRelativeDate(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
