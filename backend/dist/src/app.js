"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const content_1 = __importDefault(require("./routes/content"));
const session_1 = __importDefault(require("./routes/session"));
const draft_1 = __importDefault(require("./routes/draft"));
const progress_1 = __importDefault(require("./routes/progress"));
const skill_1 = __importDefault(require("./routes/skill"));
const admin_1 = __importDefault(require("./routes/admin"));
const activity_1 = __importDefault(require("./routes/activity"));
const reactions_1 = __importDefault(require("./routes/reactions"));
const bookmarks_1 = __importDefault(require("./routes/bookmarks"));
const cases_1 = __importDefault(require("./routes/cases"));
dotenv_1.default.config();
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
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 4000);
// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ── Auth rate limiter (login + signup only) ───────────────────────────────────
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again in 15 minutes." },
});
// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, auth_1.default);
app.use("/api/v1/content", content_1.default);
app.use("/api/v1/session", session_1.default);
app.use("/api/v1/draft", draft_1.default);
app.use("/api/v1/progress", progress_1.default);
app.use("/api/v1/skill", skill_1.default);
app.use("/api/v1/admin", admin_1.default);
app.use("/api/v1/activities", activity_1.default);
app.use("/api/v1/attempts", activity_1.default);
app.use("/api/v1/reactions", reactions_1.default);
app.use("/api/v1/bookmarks", bookmarks_1.default);
app.use("/api/v1/cases", cases_1.default);
app.listen(port, () => {
    console.log(`Shankh backend listening at http://localhost:${port}`);
});
