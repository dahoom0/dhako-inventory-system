import { Router } from "express";
import { listDebts, createDebt, recordPayment } from "../controllers/debts.controller";
import { authenticate, requireLocationAccess } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

router.get("/", requireLocationAccess, asyncHandler(listDebts));
router.post("/", requireLocationAccess, asyncHandler(createDebt));
router.post("/:id/payment", requireLocationAccess, asyncHandler(recordPayment));

export default router;