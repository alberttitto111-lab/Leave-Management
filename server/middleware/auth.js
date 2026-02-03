import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";

/* ===================== PROTECT ROUTES ===================== */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized, token missing", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return next(
        new ErrorResponse("User not found or account deactivated", 401),
      );
    }

    // Password changed after token issued
    if (
      typeof user.changedPasswordAfter === "function" &&
      user.changedPasswordAfter(decoded.iat)
    ) {
      return next(
        new ErrorResponse(
          "Password changed recently. Please login again.",
          401,
        ),
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorResponse("Invalid or expired token", 401));
  }
});

/* ===================== ROLE AUTHORIZATION ===================== */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Role '${req.user.role}' is not authorized to access this route`,
          403,
        ),
      );
    }

    next();
  };
};

/* ===================== FIRST LOGIN CHECK ===================== */
export const checkFirstLogin = asyncHandler(async (req, res, next) => {
  // Allow password update route
  if (req.path === "/change-password") {
    return next();
  }

  if (req.user?.isFirstLogin) {
    return next(
      new ErrorResponse("Please change your default password first", 403),
    );
  }

  next();
});

/* ===================== EXPORT ===================== */
export default {
  protect,
  authorize,
  checkFirstLogin,
};
