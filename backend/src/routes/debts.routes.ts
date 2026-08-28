import { Router } from "express";
import { listDebts, createDebt, recordPayment } from "../controllers/debts.controller";
import { authenticate, requireLocationAccess } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", requireLocationAccess, listDebts);
router.post("/", requireLocationAccess, createDebt);
router.post("/:id/payment", requireLocationAccess, recordPayment);

export default router;