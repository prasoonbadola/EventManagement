import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { eventRoutes } from "./modules/events/events.routes.js";
import { registrationRoutes } from "./modules/registrations/registrations.routes.js";
import { errorHandler, notFoundHandler } from "./shared/middleware/errorHandler.js";
import { requestLogger } from "./shared/middleware/requestLogger.js";
import { securityHeaders } from "./shared/middleware/securityHeaders.js";

export function createApp() {
  const app = express();
  app.use(requestLogger);
  app.use(securityHeaders);

  const allowedOrigins = env.clientOrigin.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", authRoutes, eventRoutes, registrationRoutes);
  app.use("/api", notFoundHandler);
  app.use(errorHandler);
  return app;
}
