import LeaveType from "../models/LeaveType.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";

// @desc    Get all leave types
// @route   GET /api/admin/leave-types
// @access  Private/Admin
export const getLeaveTypes = asyncHandler(async (req, res, next) => {
    const leaveTypes = await LeaveType.find().sort({ isActive: -1, name: 1 });
    res.json({ success: true, count: leaveTypes.length, data: leaveTypes });
});

// @desc    Create leave type
// @route   POST /api/admin/leave-types
// @access  Private/Admin
export const createLeaveType = asyncHandler(async (req, res, next) => {
    const { name, code, ...rest } = req.body;

    if (!name || !code) {
        return next(new ErrorResponse("Name and code are required", 400));
    }

    const existing = await LeaveType.findOne({ $or: [{ name }, { code }] });
    if (existing) {
        return next(new ErrorResponse("Leave type already exists", 400));
    }

    const leaveType = await LeaveType.create({
        name,
        code: code.toUpperCase(),
        ...rest,
    });

    res.status(201).json({
        success: true,
        message: "Leave type created successfully",
        data: leaveType,
    });
});

// @desc    Update leave type
// @route   PUT /api/admin/leave-types/:id
// @access  Private/Admin
export const updateLeaveType = asyncHandler(async (req, res, next) => {
    let leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
        return next(new ErrorResponse("Leave type not found", 404));
    }

    leaveType = await LeaveType.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.json({
        success: true,
        message: "Leave type updated successfully",
        data: leaveType,
    });
});

// @desc    Delete/Deactivate leave type
// @route   DELETE /api/admin/leave-types/:id
// @access  Private/Admin
export const deleteLeaveType = asyncHandler(async (req, res, next) => {
    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
        return next(new ErrorResponse("Leave type not found", 404));
    }

    // Soft delete by deactivating
    leaveType.isActive = false;
    await leaveType.save();

    res.json({
        success: true,
        message: "Leave type deactivated successfully",
    });
});
