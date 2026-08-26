import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  getInventoryMatrix,
  getWarehouseInventory,
  getBranchInventory,
  getProductInventoryDistribution,
  getLowStockAlerts,
  getInventoryMovements,
  getStockLevel,
} from "../controllers/inventory.controller";

const router = Router();

// All authenticated users can view inventory
router.get("/matrix", authenticate, getInventoryMatrix);
router.get("/alerts", authenticate, getLowStockAlerts);
router.get("/movements", authenticate, getInventoryMovements);
router.get("/warehouse/:warehouseId", authenticate, getWarehouseInventory);
router.get("/branch/:branchId", authenticate, getBranchInventory);
router.get("/product/:productId", authenticate, getProductInventoryDistribution);
router.get("/stock/:productId/:locationId", authenticate, getStockLevel);

export default router;
