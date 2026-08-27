import { Router } from "express";
import { login, register, me, logout, getUsers, updateUser, deleteUser } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { isAdmin } from "../middleware/rbac";

const router = Router();

router.post("/login",    login);
router.post("/register", authenticate, isAdmin, register);  // only admins create users
router.post("/logout",   authenticate, logout);              // logout route
router.get("/me",        authenticate, me);
router.get("/users",     authenticate, isAdmin, getUsers);   // get all users (admin only)
router.put("/users/:id", authenticate, isAdmin, updateUser); // update user (admin only)
router.delete("/users/:id", authenticate, isAdmin, deleteUser); // delete user (admin only)

export default router;
