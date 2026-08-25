import express, { type Express } from "express";
import { healthRouter } from "./routes/health.js";
import { propertiesRouter } from "./routes/properties.js";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.js";
import helmet from "helmet";
import cors from "cors";
import { corsOrigins, env } from "./lib/env.js";
import { bookingsRouter } from "./routes/bookings.js";
import { reviewsRouter } from "./routes/reviews.js";
import { uploadsRouter } from "./routes/uploads.js";
import path from "node:path";
import rateLimit from "express-rate-limit";

export function buildApp(): Express {
  const app = express();

  // behind a reverse proxy; express-rate-limit and req.ip need X-Forwarded-For honored
  app.set("trust proxy", 1);

  app.use(pinoHttp({ logger }));

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: false }));
  app.use(express.json({ limit: "1mb" }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiLimiter);

  app.use("/api/health", healthRouter);
  app.use("/api/properties", propertiesRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/bookings/", bookingsRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_LOCAL_DIR)));

  app.get("/", (_req, res) => {
    res.send("Hello Nestboard");
  });

  app.use(errorHandler);

  return app;
}
