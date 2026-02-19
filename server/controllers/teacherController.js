import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import LeaveRequest from "../models/LeaveRequest.js";
import StudentAcademic from "../models/StudentAcademic.js";
import {
    notifyHODOfApproval,
    notifyStudentOfStatus,
} from "../utils/notificationService.js";
import {
    generateApprovalLetter,
    generateRejectionLetter,
} from "../utils/pdfGenerator.js";

// Helper — Get teacher class filter
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

// @desc Get dashboard stats
// @route GET /api/teacher/dashboard-stats
// @access Private/Teacher
export const getDashboardStats = asyncHandler(async (req, res) => {
  const teacher = await User.findById(req.user.id);
  
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
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
  
  // Also get students from department if needed
  if (teacher.departmentId && totalStudents === 0) {
    // If no class sections assigned, get all students in department
    const deptStudents = await User.find({
      role: "student",
      departmentId: teacher.departmentId,
      isActive: true,
    }).countDocuments();
    totalStudents = deptStudents;
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
});

// @desc    Get pending leaves
// @route   GET /api/teacher/leaves/pending
// @access  Private/Teacher
export const getPendingLeaves = asyncHandler(async (req, res) => {
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
        res.status(404);
        throw new Error("Teacher not found");
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
});

// @desc    Get leave history
// @route   GET /api/teacher/leaves/history
// @access  Private/Teacher
export const getLeaveHistory = asyncHandler(async (req, res) => {
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
});

// @desc    Get single leave request
// @route   GET /api/teacher/leaves/:leaveId
// @access  Private/Teacher
export const getLeaveDetails = asyncHandler(async (req, res) => {
    const leave = await LeaveRequest.findById(req.params.leaveId)
        .populate(
            "applicantId",
            "personalInfo.firstName personalInfo.lastName userId",
        )
        .populate("leaveType", "name");

    if (!leave) {
        res.status(404);
        throw new Error("Leave request not found");
    }

    res.json({ success: true, data: leave });
});

// @desc    Approve leave request
// @route   POST /api/teacher/leaves/:leaveId/approve
// @access  Private/Teacher
export const approveLeave = asyncHandler(async (req, res) => {
    const { remarks } = req.body;

    const leave = await LeaveRequest.findById(req.params.leaveId)
        .populate("applicantId", "personalInfo userId")
        .populate("leaveType", "name");

    if (!leave) {
        res.status(404);
        throw new Error("Leave request not found");
    }

    if (leave.currentLevel !== 1) {
        res.status(400);
        throw new Error("Not authorized for this approval level");
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
});

// @desc    Reject leave request
// @route   POST /api/teacher/leaves/:leaveId/reject
// @access  Private/Teacher
export const rejectLeave = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const leave = await LeaveRequest.findById(req.params.leaveId).populate(
        "applicantId",
        "personalInfo userId",
    );

    if (!leave) {
        res.status(404);
        throw new Error("Leave request not found");
    }

    if (leave.currentLevel !== 1) {
        res.status(400);
        throw new Error("Not authorized for this rejection level");
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
});

// @desc Get teacher profile
// @route GET /api/teacher/profile
// @access Private/Teacher
export const getProfile = asyncHandler(async (req, res) => {
  const teacher = await User.findById(req.user.id)
    .select("-password")
    .populate("departmentId", "name code");
  
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  
  res.json({
    success: true,
    data: teacher,
  });
});

// @desc Update teacher profile
// @route PATCH /api/teacher/profile
// @access Private/Teacher
export const updateProfile = asyncHandler(async (req, res) => {
  const teacher = await User.findById(req.user.id);
  
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  
  const { personalInfo } = req.body;
  
  // Update personal information if provided
  if (personalInfo) {
    teacher.personalInfo = {
      ...teacher.personalInfo,
      ...personalInfo,
    };
  }
  
  await teacher.save();
  
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: teacher,
  });
});

// STUDENT MANAGEMENT 
// @desc    Get students
// @route   GET /api/teacher/students
// @access  Private/Teacher
export const getStudents = asyncHandler(async (req, res) => {
    const teacher = await User.findById(req.user.id);

    if (!teacher) {
        res.status(404);
        throw new Error("Teacher not found");
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

        return (a.academicInfo.rollNumber || 0) - (b.academicInfo.rollNumber || 0);
    });

    res.json({
        success: true,
        count: students.length,
        data: students,
    });
});

// @desc    Get single student details
// @route   GET /api/teacher/students/:id
// @access  Private/Teacher
export const getStudentDetails = asyncHandler(async (req, res) => {
    const student = await User.findOne({
        _id: req.params.id,
        role: "student",
    }).select("-password");

    if (!student) {
        res.status(404);
        throw new Error("Student not found");
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
});


// @desc Get all leave requests with counts
// @route GET /api/teacher/leaves/all-with-counts
// @access Private/Teacher
export const getAllLeavesWithCounts = asyncHandler(async (req, res) => {
  const teacher = await User.findById(req.user.id);
  
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }
  
  // Calculate 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let studentIds = [];
  
  // Get all students in teacher's department
  if (teacher.departmentId) {
    const students = await User.find({
      role: "student",
      departmentId: teacher.departmentId,
    }).select("_id");
    studentIds = students.map((s) => s._id);
  }
  
  // Also check class sections if available
  const classSections = teacher.teachingInfo?.classSections || [];
  if (classSections.length > 0) {
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
    return res.json({
      success: true,
      data: [],
      counts: {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      }
    });
  }
  
  // Get all leaves from last 30 days
  const leaves = await LeaveRequest.find({
    applicantId: { $in: studentIds },
    createdAt: { $gte: thirtyDaysAgo },
  })
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
  
  // Calculate counts
  const pending = leaves.filter(l => 
    l.status === "pending" || l.status === "approved_by_teacher"
  ).length;
  
  const approved = leaves.filter(l => 
    l.status === "approved" || 
    l.status === "approved_by_hod" || 
    l.finalStatus === "approved"
  ).length;
  
  const rejected = leaves.filter(l => 
    l.status === "rejected" || l.finalStatus === "rejected"
  ).length;
  
  // Group leaves by status
  const grouped = {
    pending: leaves.filter(l => l.status === "pending" || l.status === "approved_by_teacher"),
    approved: leaves.filter(l => 
      l.status === "approved" || 
      l.status === "approved_by_hod" || 
      l.finalStatus === "approved"
    ),
    rejected: leaves.filter(l => 
      l.status === "rejected" || l.finalStatus === "rejected"
    ),
  };
  
  res.json({
    success: true,
    data: leaves,
    grouped: grouped,
    counts: {
      pending,
      approved,
      rejected,
      total: leaves.length
    }
  });
});
