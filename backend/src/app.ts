import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import contentRoutes from "./routes/content";
import sessionRoutes from "./routes/session";
import draftRoutes from "./routes/draft";
import progressRoutes from "./routes/progress";
import skillRoutes from "./routes/skill";
import adminRoutes from "./routes/admin";
import activityRoutes from "./routes/activity";
import reactionRoutes from "./routes/reactions";
import bookmarkRoutes from "./routes/bookmarks";
import caseRoutes from "./routes/cases";

dotenv.config();

// ── Startup env validation ────────────────────────────────────────────────────
const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[startup] Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET === "fallback-secret" || process.env.JWT_SECRET === "karkee6046") {
  console.warn("[startup] WARNING: JWT_SECRET is insecure. Set a strong random secret in .env");
}

const app = express();
const port = Number(process.env.PORT || 4000);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Auth rate limiter (login + signup only) ───────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again in 15 minutes." },
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/session", sessionRoutes);
app.use("/api/v1/draft", draftRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/skill", skillRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/attempts", activityRoutes);
app.use("/api/v1/reactions", reactionRoutes);
app.use("/api/v1/bookmarks", bookmarkRoutes);
app.use("/api/v1/cases", caseRoutes);

app.listen(port, () => {
  console.log(`Shankh backend listening at http://localhost:${port}`);
});
