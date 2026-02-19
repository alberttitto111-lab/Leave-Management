import User from "../models/User.js";
import AcademicInfo from "../models/AcademicInfo.js";
import Department from "../models/Department.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import logger from "../utils/logger.js";
import { generateRollNumber } from "../utils/idGenerator.js";

export const createUser = asyncHandler(async (req, res, next) => {
  const { role, personalInfo, academicInfo, departmentId, assignTo } = req.body;

  if (!role || !personalInfo) {
    return next(new ErrorResponse("Role and personal info are required", 400));
  }

  if (role !== "admin" && !departmentId) {
    return next(
      new ErrorResponse("Department is required for non-admin users", 400),
    );
  }

  // Validate department exists
  if (departmentId) {
    const deptExists = await Department.findById(departmentId);
    if (!deptExists) {
      return next(new ErrorResponse("Department not found", 404));
    }
  }

  // Generate unique user ID
  const userId = await User.generateUserId(role);

  // Create user with initial password same as userId
  const user = await User.create({
    userId,
    password: userId,
    role,
    isFirstLogin: true,
    personalInfo,
    departmentId: role !== "admin" ? departmentId : null,   // this saves the department id in the user collection
    assignedClasses: assignTo?.classes || [],
  });

  // If student, create academic info
  if (role === "student") {
    if (!academicInfo) {
      await User.findByIdAndDelete(user._id);
      return next(
        new ErrorResponse("Academic info is required for students", 400),
      );
    }

    // Find class teacher and HOD
    const classTeacher = await User.findOne({
      role: "teacher",
      departmentId,
      "assignedClasses.class": academicInfo.class,
      "assignedClasses.section": academicInfo.section,
    });

    const hod = await User.findOne({ role: "hod", departmentId });

    // Generate roll number if not provided
    const rollNumber =
      academicInfo.rollNumber ||
      (await generateRollNumber(
        AcademicInfo,
        academicInfo.class,
        academicInfo.section,
        academicInfo.batchYear,
      ));

    await AcademicInfo.create({
      userId: user.userId,
      academicInfo: {
        ...academicInfo,
        rollNumber,
        departmentId: departmentId,  // this saves the department id in the academic info collection for easy access
      },
      classTeacherId: classTeacher?._id || null,
      hodId: hod?._id || null,
    });
  }

  logger.info(
    `New user created: ${userId} (${role}) by admin ${req.user.userId}`,
  );

  res.status(201).json({
    success: true,
    data: {
      userId: user.userId,
      role: user.role,
      message: `User created successfully. Default password is: ${userId}`,
      tempPassword: userId,
    },
  });
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const { role, department, status, search, page = 1, limit = 20 } = req.query;

  let query = {};

  if (role) query.role = role;
  if (department) query.departmentId = department;
  if (status !== undefined) query.isActive = status === "active";
  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { userId: searchRegex },
      { "personalInfo.firstName": searchRegex },
      { "personalInfo.lastName": searchRegex },
      { "personalInfo.email": searchRegex },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .populate("departmentId", "name code")
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
    data: users,
  });
});

export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate("departmentId", "name code")
    .select("-password");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  let academicData = null;
  if (user.role === "student") {
    academicData = await AcademicInfo.findOne({ userId: user.userId })
      .populate(
        "classTeacherId",
        "personalInfo.firstName personalInfo.lastName userId",
      )
      .populate("hodId", "personalInfo.firstName personalInfo.lastName userId");
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      academicInfo: academicData,
    },
  });
});

// Update this function in adminController.js
export const updateUser = asyncHandler(async (req, res, next) => {
  const { personalInfo, departmentId, isActive, assignedClasses, academicInfo } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (
    user.role === "admin" &&
    user.userId === "ADM0001" &&
    isActive === false
  ) {
    return next(new ErrorResponse("Cannot deactivate system admin", 400));
  }

  // Update basic info
  if (personalInfo) {
    Object.assign(user.personalInfo, personalInfo);
  }

  if (departmentId) user.departmentId = departmentId;
  if (typeof isActive === "boolean") user.isActive = isActive;
  if (assignedClasses) user.assignedClasses = assignedClasses;

  await user.save();

  // Update student academic info if provided
  if (user.role === "student" && academicInfo) {
    const studentAcademic = await StudentAcademic.findOne({ 
      userId: user._id 
    });

    if (studentAcademic) {
      studentAcademic.academicInfo = {
        ...studentAcademic.academicInfo,
        ...academicInfo,
      };
      await studentAcademic.save();
    }
  }

  logger.info(`User updated: ${user.userId} by admin ${req.user.userId}`);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (user.role === "admin" && user.userId === "ADM0001") {
    return next(new ErrorResponse("Cannot delete system admin", 400));
  }

  user.isActive = false;
  await user.save();

  logger.info(`User deactivated: ${user.userId} by admin ${req.user.userId}`);

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
  });
});

export const resetUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("+password");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  // Reset to userId as password
  user.password = user.userId;
  user.isFirstLogin = true;
  user.passwordChangedAt = Date.now();
  await user.save();

  logger.info(
    `Password reset for user: ${user.userId} by admin ${req.user.userId}`,
  );

  res.status(200).json({
    success: true,
    message: `Password reset successfully. New password is: ${user.userId}`,
  });
});
