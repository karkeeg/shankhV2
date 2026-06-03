import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  getActivity,
  getResume,
  startLessonSession,
  updateLessonSession,
  submitMcqSession,
  submitCanvasSession,
  submitQuantusSession,
} from "../controllers/sessionController";

const router = Router();

// ─── Activity content fetch ───────────────────────────────────────────────────
// Used by both Learning and Skill Building to load activity content
// GET /api/v1/activities/:id
router.get("/activities/:id", optionalAuth, getActivity);

// ─── Lesson session lifecycle ─────────────────────────────────────────────────
router.get("/session/me/resume", requireAuth, getResume);
router.post("/session/me/lessons/:lessonId/session/start", requireAuth, startLessonSession);
router.patch("/session/me/lessons/:lessonId/session", requireAuth, updateLessonSession);

// ─── Activity submission (grading cascade) ────────────────────────────────────
// These run the full 7-step Learning progress cascade.
// The skill building Step 8 is now handled separately via
// POST /api/v1/skill/sessions/:sessionId/submit
//
// POST /api/v1/attempts/session/mcq
// POST /api/v1/attempts/session/canvas
// POST /api/v1/attempts/session/quantus
router.post("/attempts/session/mcq", requireAuth, submitMcqSession);
router.post("/attempts/session/canvas", requireAuth, submitCanvasSession);
router.post("/attempts/session/quantus", requireAuth, submitQuantusSession);

// ─── Draft autosave ───────────────────────────────────────────────────────────
// PUT /api/v1/draft/me/activities/:type/:activityId/draft
// (handled by draftController if separate, or add here)

export default router;