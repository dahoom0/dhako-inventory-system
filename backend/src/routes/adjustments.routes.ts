import { Router } from "express";
import { authenticate, requireLocationAccess } from "../middleware/auth";
import { createAdjustment, listAdjustments } from "../controllers/adjustments.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create an adjustment
router.post("/", requireLocationAccess, createAdjustment);

// List adjustments for a location
router.get("/", requireLocationAccess, listAdjustments);

export default router;
