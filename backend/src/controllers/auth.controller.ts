import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../config/db";
import { comparePassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  role: z.enum(["ADMIN", "INVENTORY_MANAGER", "BRANCH_MANAGER", "BRANCH_STAFF"]),
  locationId: z.string().uuid().nullable().optional(),
});

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { rows } = await db.query(
      "SELECT id, name, email, password_hash, role, location_id FROM users WHERE email = $1",
      [email]
    );
    const user = rows[0];
    if (!user || !(await comparePassword(password, user.password_hash))) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role, locationId: user.location_id });
    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Validation error", details: error.flatten().fieldErrors });
    } else {
      throw error;
    }
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role, locationId } = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(password);

    const { rows } = await db.query(
      "INSERT INTO users (name, email, password_hash, role, location_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role",
      [name, email, passwordHash, role, locationId ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Validation error", details: error.flatten().fieldErrors });
    } else {
      throw error;
    }
  }
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { rows } = await db.query(
    "SELECT id, name, email, role, location_id, created_at FROM users WHERE id = $1",
    [userId]
  );
  if (!rows[0]) { res.status(404).json({ success: false, error: "User not found" }); return; }
  res.json({ success: true, data: rows[0] });
}

export async function logout(req: Request, res: Response) {
  // Logout is primarily client-side (token removal from localStorage)
  // Backend just confirms the logout
  res.json({ success: true, message: "Logged out successfully" });
}
