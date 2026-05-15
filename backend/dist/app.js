import express from "express";
import cors from "cors";
import studyPlansRouter from "./modules/study-plans/routes.js";
import activitiesRouter from "./modules/activities/routes.js";
import attemptsRouter from "./modules/attempts/routes.js";
export const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
});
app.use("/api/v1/study-plans", studyPlansRouter);
app.use("/api/v1/activities", activitiesRouter);
app.use("/api/v1/attempts", attemptsRouter);
