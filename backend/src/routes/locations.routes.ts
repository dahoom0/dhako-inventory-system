import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  getLocations,
  getLocationById,
  getWarehouses,
  getBranches,
  createLocation,
  updateLocation,
  deactivateLocation,
  deleteLocation,
  getLocationStats,
} from "../controllers/locations.controller";

const router = Router();

// Public protected routes (require authentication)
router.get("/", authenticate, getLocations);
router.get("/warehouses", authenticate, getWarehouses);
router.get("/branches", authenticate, getBranches);
router.get("/:id", authenticate, getLocationById);
router.get("/:id/stats", authenticate, getLocationStats);

// Admin-only routes
router.post("/", authenticate, requireRole("ADMIN"), createLocation);
router.patch("/:id", authenticate, requireRole("ADMIN"), updateLocation);
router.patch("/:id/deactivate", authenticate, requireRole("ADMIN"), deactivateLocation);
router.delete("/:id", authenticate, requireRole("ADMIN"), deleteLocation);

export default router;
