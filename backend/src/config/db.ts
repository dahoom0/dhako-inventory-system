import { Pool } from "pg";
import { env } from "./env";

export const db = new Pool({ connectionString: env.databaseUrl });

db.on("error", (err) => {
  console.error("PostgreSQL pool error", err);
  process.exit(1);
});
