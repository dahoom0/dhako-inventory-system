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
      console.log("   📍 Creating locations...");
      const locations = [
        { name: "Warehouse Mogadishu", type: "WAREHOUSE" },
        { name: "Warehouse Hargeisa", type: "WAREHOUSE" },
        { name: "Warehouse Kismayo", type: "WAREHOUSE" },
        { name: "Branch Mogadishu Center", type: "BRANCH" },
        { name: "Branch Hargeisa Downtown", type: "BRANCH" },
        { name: "Branch Kismayo Port", type: "BRANCH" },
      ];

      for (const loc of locations) {
        await db.query(
          "INSERT INTO locations (name, type, created_at) VALUES ($1, $2, now())",
          [loc.name, loc.type]
        );
      }
      console.log(`      ✅ ${locations.length} locations created`);
    }

    // Check user count
    const userResult = await db.query("SELECT COUNT(*) as count FROM users");
    const userCount = parseInt(userResult.rows[0].count, 10);

    if (userCount === 0) {
      console.log("   👤 Creating users...");
      const locIds = await db.query("SELECT id FROM locations ORDER BY created_at");
      const warehouseIds = locIds.rows.slice(0, 3).map(r => r.id);
      const branchIds = locIds.rows.slice(3, 6).map(r => r.id);

      const users = [
        { name: "System Admin", email: "admin@dhako.com", password: "admin123", role: "ADMIN", locationId: null },
        { name: "Ahmed Hassan", email: "ahmed@dhako.com", password: "ahmed123", role: "INVENTORY_MANAGER", locationId: warehouseIds[0] },
        { name: "Fatima Mohamed", email: "fatima@dhako.com", password: "fatima123", role: "BRANCH_MANAGER", locationId: branchIds[0] },
        { name: "Hassan Ali", email: "hassan@dhako.com", password: "hassan123", role: "BRANCH_STAFF", locationId: branchIds[0] },
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
      console.log("   📦 Creating products...");
      const products = [
        { name: "Coca Cola 330ml", sku: "SKU-001", category: "Beverages", unit: "can", qty_per_ctn: 24, cost_per_ctn: 240, sell_per_ctn: 360, min_stock_ctn: 5 },
        { name: "Pepsi 330ml", sku: "SKU-002", category: "Beverages", unit: "can", qty_per_ctn: 24, cost_per_ctn: 220, sell_per_ctn: 340, min_stock_ctn: 5 },
        { name: "Sprite 330ml", sku: "SKU-003", category: "Beverages", unit: "can", qty_per_ctn: 24, cost_per_ctn: 200, sell_per_ctn: 320, min_stock_ctn: 5 },
        { name: "Fanta Orange 330ml", sku: "SKU-004", category: "Beverages", unit: "can", qty_per_ctn: 24, cost_per_ctn: 180, sell_per_ctn: 300, min_stock_ctn: 4 },
        { name: "Mineral Water 600ml", sku: "SKU-005", category: "Beverages", unit: "bottle", qty_per_ctn: 12, cost_per_ctn: 60, sell_per_ctn: 120, min_stock_ctn: 3 },
        { name: "Instant Noodles Chicken", sku: "SKU-006", category: "Snacks", unit: "pack", qty_per_ctn: 30, cost_per_ctn: 420, sell_per_ctn: 600, min_stock_ctn: 10 },
        { name: "Instant Noodles Beef", sku: "SKU-007", category: "Snacks", unit: "pack", qty_per_ctn: 30, cost_per_ctn: 420, sell_per_ctn: 600, min_stock_ctn: 10 },
        { name: "Crackers Mixed", sku: "SKU-008", category: "Snacks", unit: "pack", qty_per_ctn: 20, cost_per_ctn: 350, sell_per_ctn: 500, min_stock_ctn: 5 },
        { name: "Biscuits Assorted", sku: "SKU-009", category: "Snacks", unit: "pack", qty_per_ctn: 15, cost_per_ctn: 525, sell_per_ctn: 750, min_stock_ctn: 3 },
        { name: "Cooking Oil 1L", sku: "SKU-010", category: "Cooking", unit: "bottle", qty_per_ctn: 12, cost_per_ctn: 660, sell_per_ctn: 960, min_stock_ctn: 4 },
        { name: "Rice 2kg Bag", sku: "SKU-011", category: "Dry Goods", unit: "bag", qty_per_ctn: 10, cost_per_ctn: 400, sell_per_ctn: 600, min_stock_ctn: 5 },
        { name: "Sugar 1kg Bag", sku: "SKU-012", category: "Dry Goods", unit: "bag", qty_per_ctn: 20, cost_per_ctn: 300, sell_per_ctn: 450, min_stock_ctn: 5 },
        { name: "Salt 1kg Bag", sku: "SKU-013", category: "Dry Goods", unit: "bag", qty_per_ctn: 30, cost_per_ctn: 180, sell_per_ctn: 300, min_stock_ctn: 10 },
        { name: "Milk Powder 900g", sku: "SKU-014", category: "Dairy", unit: "can", qty_per_ctn: 12, cost_per_ctn: 840, sell_per_ctn: 1200, min_stock_ctn: 3 },
        { name: "Yogurt 500ml", sku: "SKU-015", category: "Dairy", unit: "pack", qty_per_ctn: 24, cost_per_ctn: 480, sell_per_ctn: 720, min_stock_ctn: 5 },
      ];

      for (const prod of products) {
        await db.query(
          "INSERT INTO products (name, sku, category, unit, qty_per_ctn, cost_per_ctn, sell_per_ctn, min_stock_ctn, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())",
          [prod.name, prod.sku, prod.category, prod.unit, prod.qty_per_ctn, prod.cost_per_ctn, prod.sell_per_ctn, prod.min_stock_ctn, "ACTIVE"]
        );
      }
      console.log(`      ✅ ${products.length} products created`);
    }

    // Check stock movements count
    const movResult = await db.query("SELECT COUNT(*) as count FROM stock_movements");
    const movementCount = parseInt(movResult.rows[0].count, 10);

    if (movementCount === 0) {
      console.log("   📊 Creating initial stock...");
      const adminUser = await db.query("SELECT id FROM users WHERE email = $1", ["admin@dhako.com"]);
      const userId = adminUser.rows[0].id;

      const locations = await db.query("SELECT id, type FROM locations ORDER BY created_at");
      const warehouseIds = locations.rows.filter(r => r.type === "WAREHOUSE").map(r => r.id);
      const branchIds = locations.rows.filter(r => r.type === "BRANCH").map(r => r.id);

      const products = await db.query("SELECT id, cost_per_ctn FROM products ORDER BY created_at");

      let totalMovements = 0;

      // Add stock to warehouses
      for (const warehouse of warehouseIds) {
        for (const product of products.rows) {
          const qty = Math.floor(Math.random() * 30) + 10;
          await db.query(
            "INSERT INTO stock_movements (type, product_id, from_location_id, to_location_id, qty_ctn, cost_per_ctn, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())",
            ["STOCK_RECEIVED", product.id, null, warehouse, qty, product.cost_per_ctn, userId]
          );
          totalMovements++;
        }
      }

      // Add stock to branches
      for (const branch of branchIds) {
        for (const product of products.rows.slice(0, 10)) {
          const qty = Math.floor(Math.random() * 15) + 3;
          await db.query(
            "INSERT INTO stock_movements (type, product_id, from_location_id, to_location_id, qty_ctn, cost_per_ctn, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())",
            ["STOCK_RECEIVED", product.id, null, branch, qty, product.cost_per_ctn, userId]
          );
          totalMovements++;
        }
      }
      console.log(`      ✅ ${totalMovements} stock movements created`);
    }

    // Check customer count
    const custResult = await db.query("SELECT COUNT(*) as count FROM customers");
    const customerCount = parseInt(custResult.rows[0].count, 10);

    if (customerCount === 0) {
      console.log("   👥 Creating customers...");
      const locations = await db.query("SELECT id FROM locations WHERE type = $1 ORDER BY created_at", ["BRANCH"]);
      const branchIds = locations.rows.map(r => r.id);

      const customers = [
        { name: "Ali Mohamed Store", phone: "+252615123456", email: "ali@store.com", locationId: branchIds[0] },
        { name: "Habiba Trading", phone: "+252614234567", email: "habiba@trade.com", locationId: branchIds[0] },
        { name: "Hassan General Goods", phone: "+252613345678", email: "hassan@goods.com", locationId: branchIds[1] },
        { name: "Zainab Wholesale", phone: "+252612456789", email: "zainab@whole.com", locationId: branchIds[1] },
        { name: "Ibrahim Market", phone: "+252611567890", email: "ibrahim@market.com", locationId: branchIds[2] },
        { name: "Amina Retail Shop", phone: "+252610678901", email: "amina@retail.com", locationId: branchIds[2] },
      ];

      for (const cust of customers) {
        await db.query(
          "INSERT INTO customers (name, phone, email, location_id, created_at) VALUES ($1, $2, $3, $4, now())",
          [cust.name, cust.phone, cust.email, cust.locationId]
        );
      }
      console.log(`      ✅ ${customers.length} customers created`);
    }

    // Summary
    console.log("\n✅ Database initialization complete!\n");

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}
