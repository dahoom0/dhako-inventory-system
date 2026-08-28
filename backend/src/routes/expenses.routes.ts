import { Router } from "express";
import { listExpenses, createExpense } from "../controllers/expenses.controller";
import { authenticate, requireLocationAccess } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.get("/", requireLocationAccess, asyncHandler(listExpenses));
router.post("/", requireLocationAccess, asyncHandler(createExpense));

export default router;