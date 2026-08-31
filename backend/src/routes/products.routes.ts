import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products.controller";

const router = Router();

// Public protected routes
router.get("/", authenticate, getProducts);
router.get("/categories", authenticate, getCategories);
router.get("/:id", authenticate, getProductById);

// Admin/Inventory Manager routes
router.post("/", authenticate, requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"), createProduct);
router.put("/:id", authenticate, requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"), updateProduct);
router.patch("/:id", authenticate, requireRole("ADMIN", "INVENTORY_MANAGER", "STORE_MANAGER"), updateProduct);
router.delete("/:id", authenticate, requireRole("ADMIN"), deleteProduct);

export default router;
