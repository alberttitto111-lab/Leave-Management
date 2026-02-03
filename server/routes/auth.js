import express from "express";
import {
  login,
  changePassword,
  refreshToken,
  logout,
  getMe,
} from "../controllers/authController.js";
import { protect, checkFirstLogin } from "../middleware/auth.js";
import validate, {
  loginSchema,
  changePasswordSchema,
} from "../middleware/validators.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", refreshToken);

router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);

router.post("/logout", protect, logout);
router.get("/me", protect, checkFirstLogin, getMe);

/* 🔥 ADD THIS */
router.get("/verify", protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export default router;
