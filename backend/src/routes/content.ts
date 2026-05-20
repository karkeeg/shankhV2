import { Router } from "express";
import {
  getModules,
  getModuleTopics,
  getTopic,
  getTopicSubtopics,
  getSubtopic,
  getSubtopicLessons,
  getLessonDetail,
  getLessonHints,
} from "../controllers/contentController";

const router = Router();

router.get("/modules", getModules);
router.get("/modules/:moduleId/topics", getModuleTopics);
router.get("/topics/:topicId", getTopic);
router.get("/topics/:topicId/subtopics", getTopicSubtopics);
router.get("/subtopics/:subtopicId", getSubtopic);
router.get("/subtopics/:subtopicId/lessons", getSubtopicLessons);
router.get("/lessons/:lessonId", getLessonDetail);
router.get("/lessons/:lessonId/hints", getLessonHints);

export default router;
