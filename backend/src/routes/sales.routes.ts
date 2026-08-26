import { Router } from "express";
import { listSales, createSale } from "../controllers/sales.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/",  listSales);
router.post("/", createSale);

export default router;
