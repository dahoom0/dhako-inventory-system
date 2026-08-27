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
  locationId: z.union([
    z.string().uuid(),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).optional(),
  locationIds: z.array(z.string().uuid()).optional(), // Multiple locations for INVENTORY_MANAGER
})
  .transform((data) => ({
    ...data,
    locationId: !data.locationId || data.locationId === "" ? null : data.locationId,
  }));

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
  const client = await db.connect();
  try {
    const { name, email, password, role, locationId, locationIds } = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(password);

    // Determine which location to set as primary
    let primaryLocationId = locationId;
    if (role === "INVENTORY_MANAGER" && locationIds && locationIds.length > 0) {
      primaryLocationId = locationIds[0]; // First location is primary
    }

    // Begin transaction
    await client.query("BEGIN");

    // Insert user
    const { rows } = await client.query(
      "INSERT INTO users (name, email, password_hash, role, location_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role",
      [name, email, passwordHash, role, primaryLocationId ?? null]
    );

    const userId = rows[0].id;

    // If INVENTORY_MANAGER with multiple locations, insert into user_locations
    if (role === "INVENTORY_MANAGER" && locationIds && locationIds.length > 0) {
      for (const locId of locationIds) {
        await client.query(
          "INSERT INTO user_locations (user_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [userId, locId]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Validation error", details: error.flatten().fieldErrors });
    } else {
      console.error("Error registering user:", error);
      res.status(500).json({ success: false, error: "Failed to register user" });
    }
  } finally {
    client.release();
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

export async function getUsers(req: Request, res: Response) {
  try {
    const { rows } = await db.query(
      "SELECT id, name, email, role, location_id, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
}

export async function updateUser(req: Request, res: Response) {
  const client = await db.connect();
  try {
    const { id } = req.params;
    const { name, email, role, locationId, locationIds } = req.body;

    // Determine which location to set as primary
    let primaryLocationId = locationId;
    if (role === "INVENTORY_MANAGER" && locationIds && locationIds.length > 0) {
      primaryLocationId = locationIds[0]; // First location is primary
    }

    // Begin transaction
    await client.query("BEGIN");

    // Update user
    const { rows } = await client.query(
      "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role), location_id = COALESCE($4, location_id) WHERE id = $5 RETURNING id, name, email, role, location_id, created_at",
      [name || null, email || null, role || null, primaryLocationId || null, id]
    );

    if (!rows[0]) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    // If INVENTORY_MANAGER with locationIds, update user_locations
    if (role === "INVENTORY_MANAGER" && locationIds && Array.isArray(locationIds)) {
      // Clear existing locations
      await client.query("DELETE FROM user_locations WHERE user_id = $1", [id]);
      
      // Insert new locations
      for (const locId of locationIds) {
        await client.query(
          "INSERT INTO user_locations (user_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, locId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, error: "Failed to update user" });
  } finally {
    client.release();
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (!rows[0]) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
}

export async function getUserLocations(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get user first
    const userResult = await db.query("SELECT role FROM users WHERE id = $1", [id]);
    if (!userResult.rows[0]) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const role = userResult.rows[0].role;

    // Get assigned locations from user_locations table
    const { rows: assignedLocations } = await db.query(
      `SELECT l.id, l.name, l.type 
       FROM user_locations ul
       JOIN locations l ON ul.location_id = l.id
       WHERE ul.user_id = $1
       ORDER BY l.name`,
      [id]
    );

    res.json({ success: true, data: { role, locations: assignedLocations } });
  } catch (error) {
    console.error("Error fetching user locations:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user locations" });
  }
}
