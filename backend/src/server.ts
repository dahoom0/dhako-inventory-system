import "./config/env";  // validate env vars first
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json());

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", timestamp: new Date() }));
app.use("/api/v1", routes);

// Global error handler (must be last middleware)
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Dhako API running on port ${env.port} [${env.nodeEnv}]`);
});

export default app;
