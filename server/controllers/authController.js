import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import logger from "../utils/logger.js";

const JWT_ACCESS_EXPIRE = "60m";
const JWT_REFRESH_EXPIRE = "360d";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateTokens = (user) => {
  const payload = {
    userId: user.userId,
    role: user.role,
    id: user._id.toString(),
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRE,
  });

  const refreshToken = jwt.sign(
    { userId: user.userId, id: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRE },
  );

  return { accessToken, refreshToken };
};

export const login = asyncHandler(async (req, res, next) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return next(new ErrorResponse("Please provide userId and password", 400));
  }

  // Admin login with hardcoded credentials
  if (userId.toLowerCase() === "admin" && password === "admin123") {
    let admin = await User.findOne({ role: "admin" }).select("+password");

    if (!admin) {
      admin = await User.create({
        userId: "ADM0001",
        password: "admin123",
        role: "admin",
        isFirstLogin: true,
        personalInfo: {
          firstName: "System",
          lastName: "Administrator",
          email: "admin@system.com",
          phone: "0000000000",
        },
      });
      logger.info("Default admin user created");
    }

    const tokens = generateTokens(admin);
    res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: admin._id,
          userId: admin.userId,
          role: admin.role,
          isFirstLogin: admin.isFirstLogin,
          personalInfo: admin.personalInfo,
        },
        accessToken: tokens.accessToken,
      },
    });
  }

  // Regular user login
  const user = await User.findOne({
    userId: userId.toUpperCase(),
    isActive: true,
  }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = generateTokens(user);
  res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTIONS);

  logger.info(`User logged in: ${user.userId}`);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        userId: user.userId,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        personalInfo: user.personalInfo,
        departmentId: user.departmentId,
      },
      accessToken: tokens.accessToken,
    },
  });
});

export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  if (!user.isFirstLogin && !currentPassword) {
    return next(new ErrorResponse("Current password is required", 400));
  }

  if (!user.isFirstLogin) {
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse("Current password is incorrect", 400));
    }
  }

  if (!newPassword || newPassword.length < 6) {
    return next(
      new ErrorResponse("Password must be at least 6 characters", 400),
    );
  }

  user.password = newPassword;
  user.isFirstLogin = false;
  user.passwordChangedAt = new Date();
  await user.save();

  logger.info(`Password changed for user: ${user.userId}`);

  res.status(200).json({
    success: true,
    message: "Password updated successfully. Please login again.",
  });
});

export const refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return next(new ErrorResponse("No refresh token provided", 401));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new ErrorResponse("Invalid refresh token", 401));
    }

    const tokens = generateTokens(user);
    res.cookie("refreshToken", tokens.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    return next(new ErrorResponse("Invalid refresh token", 401));
  }
});

export const logout = asyncHandler(async (req, res, next) => {
  res.cookie("refreshToken", "", { ...COOKIE_OPTIONS, maxAge: 0 });
  logger.info(`User logged out: ${req.user.userId}`);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate("departmentId", "name code")
    .select("-password");

  res.status(200).json({
    success: true,
    data: user,
  });
});
