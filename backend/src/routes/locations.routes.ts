import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  getLocations,
  getLocationById,
  getWarehouses,
  getBranches,
  createLocation,
  updateLocation,
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
router.post("/", authenticate, requireRole("ADMIN", "STORE_MANAGER"), createLocation);
router.patch("/:id", authenticate, requireRole("ADMIN"), updateLocation);

export default router;
