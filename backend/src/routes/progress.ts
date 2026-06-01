import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getMeProgress,
  getModuleProgress,
  getSubtopicProgress,
  revealHint,
  trackTelemetry,
  getLearningProgressSummary,
  getDashboardData,
} from "../controllers/progressController";

const router = Router();

router.get("/me/dashboard", requireAuth, getDashboardData);
router.get("/me/learning/progress/summary", requireAuth, getLearningProgressSummary);
router.get("/me/progress", requireAuth, getMeProgress);
router.get("/me/modules/:moduleId/progress", requireAuth, getModuleProgress);
router.get("/me/subtopics/:subtopicId/progress", requireAuth, getSubtopicProgress);
router.post("/hints/reveal", requireAuth, revealHint);
router.post("/telemetry", requireAuth, trackTelemetry);

export default router;
