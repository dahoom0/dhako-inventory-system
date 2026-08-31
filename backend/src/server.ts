import "./config/env";  // validate env vars first
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { initializeDatabase } from "./config/initialize";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json());

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", timestamp: new Date() }));
app.use("/api/v1", routes);

// Serve static frontend files
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// SPA fallback: serve index.html for all non-API routes
app.get("*", (_req: express.Request, res: express.Response) => {
  res.sendFile(path.join(publicPath, "index.html"), { root: "/" });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server with database initialization
async function start() {
  try {
    // Initialize database (schema + seed data) on startup
    await initializeDatabase();
    
    app.listen(env.port, () => {
      console.log(`✅ Dhako API running on port ${env.port} [${env.nodeEnv}]`);
      console.log(`📦 Serving frontend from ${publicPath}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;

