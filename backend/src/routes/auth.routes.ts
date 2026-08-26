import { Router } from "express";
import { login, register, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { isAdmin } from "../middleware/rbac";

const router = Router();

router.post("/login",    login);
router.post("/register", authenticate, isAdmin, register);  // only admins create users
router.get("/me",        authenticate, me);

export default router;
