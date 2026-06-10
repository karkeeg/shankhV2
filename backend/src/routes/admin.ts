import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  createModule, createTopic, createSubtopic, createLesson,
  assignLessonActivity, setupMcqActivity, setupCanvasActivity,
  setupQuantusActivity, addActivityHints, assignSubtopicProfessions,
  recalculateUserProgress, createProfession, getAdminProfessions,
  updateProfession, deleteProfession, getLearningTree, getLessonDetail,
  updateModule, deleteModule, updateTopic, deleteTopic,
  updateSubtopic, deleteSubtopic, updateLesson, deleteLesson,
  reorderCurriculum,
} from "../controllers/adminController";

import {
  createSkillTopic, getSkillTopics, updateSkillTopic, deleteSkillTopic,
  createTest, publishTest, deleteTest, getAvailableActivities,
} from "../controllers/skillController";

const router = Router();
router.use(requireAuth, requireAdmin);

// ── Learning content ──────────────────────────────────────────────────────────
router.post("/modules", createModule);
router.put("/modules/:id", updateModule);
router.delete("/modules/:id", deleteModule);
router.post("/topics", createTopic);
router.put("/topics/:id", updateTopic);
router.delete("/topics/:id", deleteTopic);
router.post("/subtopics", createSubtopic);
router.put("/subtopics/:id", updateSubtopic);
router.delete("/subtopics/:id", deleteSubtopic);
router.post("/lessons", createLesson);
router.put("/lessons/:id", updateLesson);
router.delete("/lessons/:id", deleteLesson);
router.post("/curriculum/reorder", reorderCurriculum);
router.post("/lessons/:id/activities", assignLessonActivity);
router.post("/activities/mcq/:id/setup", setupMcqActivity);
router.post("/activities/canvas/:id/setup", setupCanvasActivity);
router.post("/activities/quantus/:id/setup", setupQuantusActivity);
router.post("/activities/:type/:id/hints", addActivityHints);
router.post("/subtopics/:id/professions", assignSubtopicProfessions);
router.post("/users/:userId/recalculate", recalculateUserProgress);
router.get("/learning-tree", getLearningTree);
router.get("/lessons/:id", getLessonDetail);

// ── Profession management ─────────────────────────────────────────────────────
router.post("/professions", createProfession);
router.get("/professions", getAdminProfessions);
router.put("/professions/:id", updateProfession);
router.delete("/professions/:id", deleteProfession);

// ── Skill topics ──────────────────────────────────────────────────────────────
router.post("/skill/topics", createSkillTopic);
router.get("/skill/professions/:professionId/topics", getSkillTopics);
router.put("/skill/topics/:id", updateSkillTopic);
router.delete("/skill/topics/:id", deleteSkillTopic);

// ── Skill tests ───────────────────────────────────────────────────────────────
router.post("/skill/tests", createTest);
router.post("/skill/tests/:id/publish", publishTest);
router.delete("/skill/tests/:id", deleteTest);
router.get("/skill/professions/:professionId/available-activities", getAvailableActivities);

export default router;