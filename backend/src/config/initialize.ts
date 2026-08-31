import fs from "fs";
import path from "path";
import { db } from "./db";
import bcrypt from "bcryptjs";

/**
 * Initialize database on server startup
 * - Creates schema if tables don't exist
 * - Seeds initial data if empty
 * - Idempotent and production-safe
 */
export async function initializeDatabase() {
  try {
    console.log("\n🔧 Initializing database...\n");

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 0: Apply migrations (alter existing tables)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🔄 Checking for migrations...");
    try {
      // Check if status column exists
      const statusCheck = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'status'"
      );
      
      if (statusCheck.rows.length === 0) {
        console.log("   📝 Applying migration: Add status column to locations");
        await db.query("ALTER TABLE locations ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'");
        await db.query("ALTER TABLE locations ADD CONSTRAINT locations_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'))");
      }
      
      // Check if updated_at column exists
      const updatedAtCheck = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'updated_at'"
      );
      
      if (updatedAtCheck.rows.length === 0) {
        console.log("   📝 Applying migration: Add updated_at column to locations");
        await db.query("ALTER TABLE locations ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now()");
      }
      
      // Check if unique index exists
      const indexCheck = await db.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'locations' AND indexname = 'idx_locations_name_active'"
      );
      
      if (indexCheck.rows.length === 0) {
        console.log("   📝 Applying migration: Add unique constraint on active location names");
        await db.query(
          "CREATE UNIQUE INDEX idx_locations_name_active ON locations(name, status) WHERE status = 'ACTIVE'"
        );
      }
      
      console.log("   ✅ Migrations applied\n");
    } catch (err: any) {
      if (!err.message.includes("already exists") && !err.message.includes("column")) {
        console.warn("⚠️  Migration warning:", err.message);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Create schema from SQL file
    // ═══════════════════════════════════════════════════════════════════════
    console.log("📝 Creating schema...");
    const schemaPath = path.join(__dirname, "../models/schema.sql");

    if (!fs.existsSync(schemaPath)) {
      console.warn(`⚠️  Schema file not found at ${schemaPath}, skipping schema creation`);
    } else {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      const statements = schemaSql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let created = 0;
      let skipped = 0;

      for (const stmt of statements) {
        try {
          await db.query(stmt);
          created++;
        } catch (err: any) {
          // Ignore "already exists" errors (42P07 = table exists, 42710 = index exists)
          if (err.code === "42P07" || err.code === "42710") {
            skipped++;
          } else if (err.message.includes("already exists")) {
            skipped++;
          } else {
            console.error("❌ Schema creation error:", err.message);
            throw err;
          }
        }
      }

      console.log(`   ✅ Created: ${created}, Skipped: ${skipped}\n`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Check if data exists and seed if empty
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🌱 Seeding data...");

    // Check location count
    const locResult = await db.query("SELECT COUNT(*) as count FROM locations");
    const locationCount = parseInt(locResult.rows[0].count, 10);

    if (locationCount === 0) {
      console.log("   📍 Location seeding disabled - admin will create locations manually");
    }

    // Check user count
    const userResult = await db.query("SELECT COUNT(*) as count FROM users");
    const userCount = parseInt(userResult.rows[0].count, 10);

    if (userCount === 0) {
      console.log("   👤 Creating users...");
      const users = [
        { name: "System Admin", email: "admin@dhako.com", password: "admin123", role: "ADMIN", locationId: null },
        { name: "Ahmed Hassan", email: "ahmed@dhako.com", password: "ahmed123", role: "INVENTORY_MANAGER", locationId: null },
        { name: "Fatima Mohamed", email: "fatima@dhako.com", password: "fatima123", role: "BRANCH_MANAGER", locationId: null },
        { name: "Hassan Ali", email: "hassan@dhako.com", password: "hassan123", role: "BRANCH_STAFF", locationId: null },
      ];

      for (const user of users) {
        const passwordHash = await bcrypt.hash(user.password, 12);
        await db.query(
          "INSERT INTO users (name, email, password_hash, role, location_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now())",
          [user.name, user.email, passwordHash, user.role, user.locationId]
        );
      }
      console.log(`      ✅ ${users.length} users created`);
    }

    // Check product count
    const prodResult = await db.query("SELECT COUNT(*) as count FROM products");
    const productCount = parseInt(prodResult.rows[0].count, 10);

    if (productCount === 0) {
      console.log("   📦 Products seeding disabled - admin will create products manually");
    }

    // Check stock movements count
    const movResult = await db.query("SELECT COUNT(*) as count FROM stock_movements");
    const movementCount = parseInt(movResult.rows[0].count, 10);

    if (movementCount === 0) {
      console.log("   📊 Stock movements seeding disabled - populate after locations are created");
    }

    // Check customer count
    const custResult = await db.query("SELECT COUNT(*) as count FROM customers");
    const customerCount = parseInt(custResult.rows[0].count, 10);

    if (customerCount === 0) {
      console.log("   👥 Customer seeding disabled - create after locations are set up");
    }

    // Summary
    console.log("\n✅ Database initialization complete!\n");

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}
