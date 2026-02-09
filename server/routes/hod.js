import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getHODDashboardStats,
  getPendingApprovals,
  getDepartmentOverview,
  getDepartmentTeachers,
  approveLeave,
  rejectLeave,
  getDepartmentReport,
} from "../controllers/hod.js";

const router = express.Router();

router.use(protect);
router.use(authorize("hod"));

router.get("/stats", getHODDashboardStats);
router.get("/pending-approvals", getPendingApprovals);
router.get("/department-overview", getDepartmentOverview);
router.get("/teachers", getDepartmentTeachers);
router.post("/approve-leave/:leaveId", approveLeave);
router.post("/reject-leave/:leaveId", rejectLeave);
router.get("/department-report", getDepartmentReport);

export default router;
