import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getActivity,
  submitMcqSession,
  submitCanvasSession,
  submitQuantusSession,
} from "../controllers/sessionController";

const router = Router();

// ── GET /api/v1/activities/:id ──────────────────────────────────────────────
// Fetches lesson + all activity steps. :id is the lessonId.
router.get("/:id", requireAuth, getActivity);

// ── POST /api/v1/attempts ───────────────────────────────────────────────────
// Creates an attempt. Frontend sends lessonId, we echo it back as attemptId.
// No separate DB record needed — lessonId is used as the stable identifier.
router.post("/", requireAuth, (req, res) => {
  const { lessonId } = req.body as { lessonId?: string };
  if (!lessonId) return res.status(400).json({ error: "lessonId is required" });
  return res.json({ data: { attemptId: lessonId } });
});

// ── POST /api/v1/attempts/:id/submit ───────────────────────────────────────
// Fix: was "/attempts/:id/submit" which doubled to /attempts/attempts/:id/submit
router.post("/:id/submit", requireAuth, async (req, res) => {
  // Map :id back to lessonId so existing controller functions work unchanged
  req.body.lessonId = req.body.lessonId || req.params.id;

  const { activityType } = req.body as { activityType?: string };
  switch ((activityType || "mcq").toLowerCase()) {
    case "mcq":     return submitMcqSession(req, res);
    case "canvas":  return submitCanvasSession(req, res);
    case "quantus": return submitQuantusSession(req, res);
    default:        return submitMcqSession(req, res);
  }
});

// ── Modern explicit-type endpoints (keep for direct calls) ──────────────────
router.post("/session/mcq",     requireAuth, submitMcqSession);
router.post("/session/canvas",  requireAuth, submitCanvasSession);
router.post("/session/quantus", requireAuth, submitQuantusSession);

export default router;