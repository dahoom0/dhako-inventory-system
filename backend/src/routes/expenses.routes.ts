import { Router } from "express";
import { listExpenses, createExpense } from "../controllers/expenses.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/",  listExpenses);
router.post("/", createExpense);

export default router;
