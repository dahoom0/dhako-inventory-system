import { Router } from "express";
import { authenticate, requireLocationAccess } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller";

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// List customers (filtered by accessible locations)
router.get("/", requireLocationAccess, asyncHandler(listCustomers));

// Get a specific customer
router.get("/:id", requireLocationAccess, asyncHandler(getCustomer));

// Create a new customer
router.post("/", requireLocationAccess, asyncHandler(createCustomer));

// Update a customer
router.patch("/:id", requireLocationAccess, asyncHandler(updateCustomer));

// Delete a customer (admin only)
router.delete("/:id", requireLocationAccess, asyncHandler(deleteCustomer));

export default router;
