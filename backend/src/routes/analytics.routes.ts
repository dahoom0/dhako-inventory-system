import { Router } from "express";
import { getDashboardStats, getDashboard, getSalesTrend, getBranchPerformance } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/dashboard-stats",    getDashboardStats);  // used by frontend
router.get("/dashboard",          getDashboard);       // backwards compat alias
router.get("/sales-trend",        getSalesTrend);
router.get("/branch-performance", getBranchPerformance);

export default router;
