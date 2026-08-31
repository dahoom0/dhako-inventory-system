import { Router } from "express";
import { listSales, createSale, voidSale, updateSale } from "../controllers/sales.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(authenticate);

router.get("/",  listSales);
router.post("/", createSale);

// Void (cancel) a sale — restores stock
router.delete("/:saleId", requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER", "BRANCH_MANAGER"), voidSale);

// Edit a sale's sell price and payment method (not qty — that would require stock adjustments)
router.patch("/:saleId", requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER", "BRANCH_MANAGER"), updateSale);

export default router;
