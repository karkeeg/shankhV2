import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getLessonReactions, setLessonReaction, getMyReactions } from "../controllers/reactionController";

const router = Router();

router.get("/me/lessons", requireAuth, getMyReactions);
router.get("/lessons/:lessonId", requireAuth, getLessonReactions);
router.post("/lessons/:lessonId", requireAuth, setLessonReaction);

export default router;
