import { Router } from "express";
import { listExpenses, createExpense } from "../controllers/expenses.controller";
import { authenticate, requireLocationAccess } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", requireLocationAccess, listExpenses);
router.post("/", requireLocationAccess, createExpense);

export default router;