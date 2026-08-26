import { Router } from "express";
import { getDashboard, getSalesTrend, getBranchPerformance } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/dashboard",         getDashboard);
router.get("/sales-trend",       getSalesTrend);
router.get("/branch-performance", getBranchPerformance);

export default router;
