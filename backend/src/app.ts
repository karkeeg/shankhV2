import express from "express";
import cors from "cors";
import authRouter from "./modules/auth/routes.js";
import studyPlansRouter from "./modules/study-plans/routes.js";
import { getDefaultStudyPlanTree } from "./modules/study-plans/controller.js";
import activitiesRouter from "./modules/activities/routes.js";
import attemptsRouter from "./modules/attempts/routes.js";
import { getUserProgress, recordAttempt } from "./modules/progress/controller.js";
import { logEvent } from "./modules/telemetry/controller.js";
import { authenticate } from "./middleware/authenticate.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ data: { status: "ok" } });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/study-plans", studyPlansRouter);
app.get("/api/v1/study-plan-tree", getDefaultStudyPlanTree);
app.get("/api/v1/user/progress", authenticate as any, getUserProgress);
app.post("/api/v1/user/progress/attempt", authenticate as any, recordAttempt);
app.post("/api/v1/telemetry", logEvent);
app.use("/api/v1/activities", authenticate as any, activitiesRouter);
app.use("/api/v1/attempts", authenticate as any, attemptsRouter);
