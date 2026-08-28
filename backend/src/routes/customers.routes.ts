import { Router } from "express";
import { authenticate, requireLocationAccess } from "../middleware/auth";
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
router.get("/", requireLocationAccess, listCustomers);

// Get a specific customer
router.get("/:id", requireLocationAccess, getCustomer);

// Create a new customer
router.post("/", requireLocationAccess, createCustomer);

// Update a customer
router.patch("/:id", requireLocationAccess, updateCustomer);

// Delete a customer (admin only)
router.delete("/:id", requireLocationAccess, deleteCustomer);

export default router;
