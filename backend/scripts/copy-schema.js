const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "../src/models/schema.sql");
const destinationDir = path.join(__dirname, "../dist/models");
const destination = path.join(destinationDir, "schema.sql");

try {
  // Create dist/models directory if it doesn't exist
  fs.mkdirSync(destinationDir, { recursive: true });
  
  // Copy schema.sql
  fs.copyFileSync(source, destination);
  
  console.log("✅ schema.sql copied to dist/models/");
} catch (err) {
  console.error("❌ Failed to copy schema.sql:", err.message);
  process.exit(1);
}
