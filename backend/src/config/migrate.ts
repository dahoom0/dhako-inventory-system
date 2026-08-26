import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const schemaPath = path.join(__dirname, "../models/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
