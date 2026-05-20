import { Router } from "express";
import {
  getResume,
  startLessonSession,
  updateLessonSession,
  submitMcqSession,
  submitCanvasSession,
  submitQuantusSession,
} from "../controllers/sessionController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/me/resume", requireAuth, getResume);
router.post("/me/lessons/:lessonId/session/start", requireAuth, startLessonSession);
router.patch("/me/lessons/:lessonId/session", requireAuth, updateLessonSession);
router.post("/me/sessions/mcq", requireAuth, submitMcqSession);
router.post("/me/sessions/canvas", requireAuth, submitCanvasSession);
router.post("/me/sessions/quantus", requireAuth, submitQuantusSession);

export default router;
