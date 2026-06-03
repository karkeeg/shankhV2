import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  getProfessions,
  getProfessionTests,
  getSingleTest,
  startTestSession,
  resumeTestSession,
  pauseTestSession,
  submitSessionActivity,
  completeTestSession,
  getMySessions,
  getRecentlyActiveSession,
  getLessonSkillContext,
} from "../controllers/skillController";

const router = Router();

// ── Discovery ─────────────────────────────────────────────────────────────────
router.get("/professions", getProfessions);
router.get("/professions/:slug/tests", optionalAuth, getProfessionTests);
router.get("/tests/:id", optionalAuth, getSingleTest);

// ── Session management ────────────────────────────────────────────────────────
router.post("/tests/:id/sessions", requireAuth, startTestSession);
router.get("/tests/:id/sessions/:activityType", requireAuth, resumeTestSession);
router.patch("/sessions/:sessionId", requireAuth, pauseTestSession);
router.post("/sessions/:sessionId/submit", requireAuth, submitSessionActivity);
router.post("/sessions/:sessionId/complete", requireAuth, completeTestSession);

// ── User progress ─────────────────────────────────────────────────────────────
router.get("/me/sessions", requireAuth, getMySessions);
router.get("/me/recently-active", requireAuth, getRecentlyActiveSession);

// ── Cross-promotion ───────────────────────────────────────────────────────────
router.get("/lessons/:lessonId/skill-context", optionalAuth, getLessonSkillContext);

export default router;