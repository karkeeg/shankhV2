import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

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

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Request logger to see incoming API calls
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API routes — must come BEFORE the root catch-all
app.use("/api/v1/auth", authRoutes);
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

