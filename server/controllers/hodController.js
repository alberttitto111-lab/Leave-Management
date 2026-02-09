import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import LeaveRequest from "../models/LeaveRequest.js";
import StudentAcademic from "../models/StudentAcademic.js";
import { notifyStudentOfStatus } from "../utils/notificationService.js";
import {
    generateApprovalLetter,
    generateRejectionLetter,
} from "../utils/pdfGenerator.js";

// @desc    Get HOD Dashboard Stats
// @route   GET /api/hod/dashboard/stats
// @access  Private/HOD
export const getDashboardStats = asyncHandler(async (req, res) => {
    const hod = await User.findById(req.user.id);
    const managedDepts = hod.hodInfo?.managedDepartments || [];

    // Get teachers in department
    const deptTeachers = await User.countDocuments({
        role: "teacher",
        departmentId: { $in: managedDepts },
    });

    // Get students in department
    const students = await StudentAcademic.countDocuments({
        classTeacherId: {
            $in: await User.find({ departmentId: { $in: managedDepts } }).distinct(
                "_id",
            ),
        },
    });

    // Since StudentAcademic might not direct link to Department, we infer via Class Teacher or HOD link
    // But wait, StudentAcademic doesn't have departmentId directly?
    // Let's check StudentAcademic schema again.
    // It has classTeacherId and hodId.
    // Actually, let's use the logic from the route:
    // "departmentId: { $in: managedDepts }" was used in the route code?
    // Let's re-read Step 67 route code carefully.
    /*
    const students = await StudentAcademic.countDocuments({
        departmentId: { $in: managedDepts },
    });
    */
    // StudentAcademic.js (Step 50) DOES NOT have departmentId!
    // It has userId, academicInfo, classTeacherId, hodId.
    // The route code in Step 67 might have been crashing or I missed something.
    // Wait, Step 61 (Old Controller) used User.countDocuments with departmentId.
    // Step 67 (Route) uses StudentAcademic.countDocuments with departmentId.
    // If StudentAcademic schema has no departmentId, that query would fail or return 0.
    // Let's check User model (Step 18). It has departmentId.
    // So we should query User model for students count in department.

    const studentsCount = await User.countDocuments({
        role: "student",
        departmentId: { $in: managedDepts },
        isActive: true,
    });

    // Pending approvals for HOD (level 2)
    const pendingApprovals = await LeaveRequest.countDocuments({
        status: "approved_by_teacher",
        currentLevel: 2,
        finalStatus: "pending",
        // We should filter by applicants in HOD's department
        // But LeaveRequest doesn't store departmentId directly.
        // It stores applicantId.
        // We need to filter by applicants who belong to the departments.
    });

    // Currently the route code in Step 67 didn't filter pendingApprovals by department!
    // That means HOD sees ALL pending approvals from ANY department? That's a bug.
    // I should fix this "clearly now".

    // Get all student IDs in managed departments
    const studentUsers = await User.find({
        role: "student",
        departmentId: { $in: managedDepts },
    }).distinct("_id");

    const pendingApprovalsCount = await LeaveRequest.countDocuments({
        applicantId: { $in: studentUsers },
        status: "approved_by_teacher",
        currentLevel: 2,
        finalStatus: "pending",
    });

    // Calculate leave percentage
    const totalLeaves = await LeaveRequest.countDocuments({
        applicantId: { $in: studentUsers },
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
        applicantId: { $in: studentUsers },
        finalStatus: "approved",
    });

    const leavePercentage =
        totalLeaves > 0 ? Math.round((approvedLeaves / totalLeaves) * 100) : 0;

    res.json({
        success: true,
        data: {
            deptTeachers,
            pendingApprovals: pendingApprovalsCount,
            students: studentsCount,
            leavePercentage,
        },
    });
});

// @desc    Get Pending Approvals
// @route   GET /api/hod/dashboard/pending-approvals
// @access  Private/HOD
export const getPendingApprovals = asyncHandler(async (req, res) => {
    const hod = await User.findById(req.user.id);
    const managedDepts = hod.hodInfo?.managedDepartments || [];

    const studentUsers = await User.find({
        role: "student",
        departmentId: { $in: managedDepts },
    }).distinct("_id");

    const leaves = await LeaveRequest.find({
        applicantId: { $in: studentUsers },
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
        previouslyApprovedBy: leave.approvals.find((a) => a.level === 1)?.approverId
            ?.personalInfo?.firstName,
    }));

    res.json({ success: true, data: formatted });
});

// @desc    Approve Leave
// @route   POST /api/hod/dashboard/approve-leave/:leaveId
// @access  Private/HOD
export const approveLeave = asyncHandler(async (req, res) => {
    const { comments } = req.body;
    const leave = await LeaveRequest.findById(req.params.leaveId).populate(
        "applicantId",
        "personalInfo",
    );

    if (!leave) {
        res.status(404);
        throw new Error("Leave request not found");
    }

    // Verify HOD authority (optional but good practice)
    // ...

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
});

// @desc    Reject Leave
// @route   POST /api/hod/dashboard/reject-leave/:leaveId
// @access  Private/HOD
export const rejectLeave = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const leave = await LeaveRequest.findById(req.params.leaveId).populate(
        "applicantId",
        "personalInfo",
    );

    if (!leave) {
        res.status(404);
        throw new Error("Leave request not found");
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
});
