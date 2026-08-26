import { Router } from "express";
import { listDebts, createDebt, recordPayment } from "../controllers/debts.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/",              listDebts);
router.post("/",             createDebt);
router.post("/:id/payment",  recordPayment);

export default router;
