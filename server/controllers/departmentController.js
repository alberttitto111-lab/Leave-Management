import Department from "../models/Department.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private/Admin
export const getDepartments = asyncHandler(async (req, res, next) => {
    const departments = await Department.find({ isActive: true }).populate(
        "hodId",
        "userId personalInfo.firstName personalInfo.lastName",
    );

    res.json(departments);
});

// @desc    Create department
// @route   POST /api/admin/departments
// @access  Private/Admin
export const createDepartment = asyncHandler(async (req, res, next) => {
    const { name, code, hodId, description, isActive } = req.body;

    if (!name || !code) {
        return next(new ErrorResponse("Department name and code are required", 400));
    }

    const existing = await Department.findOne({
        $or: [{ name }, { code }],
    });

    if (existing) {
        return next(
            new ErrorResponse("Department with same name or code already exists", 400),
        );
    }

    let hodUser = null;
    if (hodId) {
        hodUser = await User.findById(hodId);
        if (!hodUser || hodUser.role !== "hod") {
            return next(new ErrorResponse("Invalid HOD ID", 400));
        }
    }

    const department = await Department.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        hodId: hodUser ? hodUser._id : null,
        description,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
        success: true,
        message: "Department created successfully",
        department,
    });
});

// @desc    Update department
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
export const updateDepartment = asyncHandler(async (req, res, next) => {
    const department = await Department.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
    );

    if (!department) {
        return next(new ErrorResponse("Department not found", 404));
    }

    res.json(department);
});

// @desc    Delete department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
export const deleteDepartment = asyncHandler(async (req, res, next) => {
    const department = await Department.findById(req.params.id);

    if (!department) {
        return next(new ErrorResponse("Department not found", 404));
    }

    department.isActive = false;
    await department.save();

    res.json({ success: true, message: "Department deactivated" });
});
