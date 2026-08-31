import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller";

const router = Router();

// All authenticated users can view categories
router.get("/", authenticate, getCategories);
router.get("/:id", authenticate, getCategoryById);

// Admin can create, update, delete categories
router.post("/", authenticate, requireRole("ADMIN"), createCategory);
router.put("/:id", authenticate, requireRole("ADMIN"), updateCategory);
router.patch("/:id", authenticate, requireRole("ADMIN"), updateCategory);
router.delete("/:id", authenticate, requireRole("ADMIN"), deleteCategory);

export default router;