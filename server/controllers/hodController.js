import User from "../models/User.js";
import LeaveRequest from "../models/LeaveRequest.js";

export const getHodAnalytics = async (req, res) => {
  try {
    const hodId = req.user._id;
    const departmentId = req.user.departmentId;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "HOD has no department assigned",
      });
    }

    /* -----------------------------
       Department Teachers Count
    ----------------------------- */
    const totalTeachers = await User.countDocuments({
      role: "teacher",
      departmentId,
      isActive: true,
    });

    /* -----------------------------
       Department Students Count
    ----------------------------- */
    const totalStudents = await User.countDocuments({
      role: "student",
      departmentId,
      isActive: true,
    });

    /* -----------------------------
       Pending HOD Approvals
       status already approved_by_teacher
       currentLevel = 2 (HOD)
    ----------------------------- */
    const pendingHodApprovals = await LeaveRequest.countDocuments({
      currentLevel: 2,
      status: "approved_by_teacher",
    }).populate({
      path: "applicantId",
      match: { departmentId },
    });

    /* -----------------------------
       Approved By HOD
    ----------------------------- */
    const approvedByHod = await LeaveRequest.countDocuments({
      status: "approved_by_hod",
      "approvals.approverId": hodId,
    });

    /* -----------------------------
       Recent Activity
    ----------------------------- */
    const recentLeaves = await LeaveRequest.find({
      currentLevel: 2,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("applicantId", "personalInfo.firstName personalInfo.lastName")
      .lean();

    const recentActivity = recentLeaves.map((leave) => ({
      user:
        leave.applicantId?.personalInfo?.firstName +
        " " +
        leave.applicantId?.personalInfo?.lastName,
      action: `Leave request ${leave.status.replaceAll("_", " ")}`,
      time: new Date(leave.createdAt).toLocaleString(),
    }));

    return res.json({
      success: true,
      data: {
        stats: {
          totalTeachers,
          totalStudents,
          pendingHodApprovals,
          approvedByHod,
        },
        recentActivity,
      },
    });
  } catch (err) {
    console.error("HOD analytics error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load HOD analytics",
    });
  }
};
