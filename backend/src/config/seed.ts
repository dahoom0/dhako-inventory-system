import fs from "fs";
import path from "path";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function seed() {
  const client = await pool.connect();

  try {
    // Check if admin user already exists
    const result = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@dhako.com"]
    );

    if (result.rows.length > 0) {
      console.log("Admin user already exists. Skipping seed.");
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash("admin123", 12);

    // Create admin user
    await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())`,
      ["System Admin", "admin@dhako.com", passwordHash, "ADMIN"]
    );

    console.log("✅ Admin user created successfully");
    console.log("   Email: admin@dhako.com");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
