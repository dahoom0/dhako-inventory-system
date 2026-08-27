import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

async function migrate() {
  // schema.sql is copied to dist/models/ during the build process
  // __dirname = dist/config, so ../models/schema.sql resolves to dist/models/schema.sql
  const schemaPath = path.join(__dirname, "../models/schema.sql");
  
  console.log(`Reading schema from: ${schemaPath}`);
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at: ${schemaPath}`);
  }
  
  const sql = fs.readFileSync(schemaPath, "utf-8");
  
  // Split the SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const client = await pool.connect();
  try {
    console.log(`Running ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 50)}...`);
        await client.query(stmt);
      } catch (err: any) {
        // Ignore "already exists" errors (idempotent)
        if (err.code === '42P07' || err.code === '42710') {
          console.log(`[${i + 1}/${statements.length}] Already exists (OK)`);
        } else {
          throw err;
        }
      }
    }
    
    console.log("✅ Migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => { 
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
