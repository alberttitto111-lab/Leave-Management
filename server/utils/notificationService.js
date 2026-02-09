import { Expo } from "expo-server-sdk";
import User from "../models/User.js";
import LeaveRequest from "../models/LeaveRequest.js";
import StudentAcademic from "../models/StudentAcademic.js";

const expo = new Expo();

export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user?.expoPushToken) return;

    const message = {
      to: user.expoPushToken,
      sound: "default",
      title,
      body,
      data,
    };

    await expo.sendPushNotificationsAsync([message]);
  } catch (error) {
    console.error("Push notification error:", error);
  }
};

export const notifyTeacherOfNewLeave = async (leaveRequest) => {
  try {
    // Find class teacher for this student
    const student = await User.findById(leaveRequest.applicantId);
    const academic = await StudentAcademic.findOne({
      userId: leaveRequest.applicantId,
    });

    if (!academic) return;

    const { class: cls, section } = academic.academicInfo;
    const classSectionString = `${cls}-${section}`;

    const teacher = await User.findOne({
      role: "teacher",
      "teachingInfo.isClassTeacher": true,
      "teachingInfo.classSections": classSectionString,
    });

    if (!teacher) return;

    await sendPushNotification(
      teacher._id,
      "New Leave Request",
      `${student.personalInfo.firstName} from ${classSectionString} requested ${leaveRequest.dateRange.days} days leave`,
      { type: "NEW_LEAVE_REQUEST", leaveId: leaveRequest._id },
    );

    // Update notification status
    await LeaveRequest.findByIdAndUpdate(leaveRequest._id, {
      "notificationsSent.teacher": true,
    });
  } catch (error) {
    console.error("Notify teacher error:", error);
  }
};

export const notifyHODOfApproval = async (leaveRequest) => {
  try {
    const student = await User.findById(leaveRequest.applicantId);
    const academic = await StudentAcademic.findOne({
      userId: leaveRequest.applicantId,
    });

    // Find HOD of student's department
    const hod = await User.findOne({
      role: "hod",
      "hodInfo.managedDepartments": academic?.departmentId,
    });

    if (!hod) return;

    await sendPushNotification(
      hod._id,
      "Leave Approval Required",
      `${student.personalInfo.firstName}'s leave request is pending your approval`,
      { type: "HOD_APPROVAL_REQUIRED", leaveId: leaveRequest._id },
    );

    await LeaveRequest.findByIdAndUpdate(leaveRequest._id, {
      "notificationsSent.hod": true,
    });
  } catch (error) {
    console.error("Notify HOD error:", error);
  }
};

export const notifyStudentOfStatus = async (
  leaveRequest,
  status,
  approverName,
) => {
  try {
    const title =
      status === "approved" ? "Leave Approved!" : "Leave Request Rejected";
    const body =
      status === "approved"
        ? `Your leave request has been approved by ${approverName}`
        : `Your leave request was rejected by ${approverName}`;

    await sendPushNotification(leaveRequest.applicantId, title, body, {
      type: status === "approved" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      leaveId: leaveRequest._id,
      downloadUrl:
        status === "approved" ? leaveRequest.approvalLetter?.url : null,
    });

    await LeaveRequest.findByIdAndUpdate(leaveRequest._id, {
      "notificationsSent.student": true,
    });
  } catch (error) {
    console.error("Notify student error:", error);
  }
};
