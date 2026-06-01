import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  createModule,
  createTopic,
  createSubtopic,
  createLesson,
  assignLessonActivity,
  setupMcqActivity,
  setupCanvasActivity,
  setupQuantusActivity,
  addActivityHints,
  createSkillBundle,
  assignBundleProfessions,
  assignBundleItems,
  assignSubtopicProfessions,
  recalculateUserProgress,
  // Decoupled Skill Building CRUD
  createProfession,
  getAdminProfessions,
  updateProfession,
  deleteProfession,
  createSkillTopic,
  getSkillTopicsForProfession,
  updateSkillTopic,
  deleteSkillTopic,
  importLessonsToSkillTopic,
  getSkillLessonsForTopic,
  deleteSkillLesson,
  getLearningTree,
  getLessonDetail,
} from "../controllers/adminController";

const router = Router();
router.use(requireAuth, requireAdmin);

router.post("/modules", createModule);
router.post("/topics", createTopic);
router.post("/subtopics", createSubtopic);
router.post("/lessons", createLesson);
router.post("/lessons/:id/activities", assignLessonActivity);
router.post("/activities/mcq/:id/setup", setupMcqActivity);
router.post("/activities/canvas/:id/setup", setupCanvasActivity);
router.post("/activities/quantus/:id/setup", setupQuantusActivity);
router.post("/activities/:type/:id/hints", addActivityHints);
router.post("/skill/bundles", createSkillBundle);
router.post("/skill/bundles/:id/professions", assignBundleProfessions);
router.post("/skill/bundles/:id/items", assignBundleItems);
router.post("/subtopics/:id/professions", assignSubtopicProfessions);
router.post("/users/:userId/recalculate", recalculateUserProgress);

// Decoupled Skill Building routes
router.post("/professions", createProfession);
router.get("/professions", getAdminProfessions);
router.put("/professions/:id", updateProfession);
router.delete("/professions/:id", deleteProfession);

router.post("/skill-topics", createSkillTopic);
router.get("/professions/:professionId/skill-topics", getSkillTopicsForProfession);
router.put("/skill-topics/:id", updateSkillTopic);
router.delete("/skill-topics/:id", deleteSkillTopic);

router.post("/skill-topics/:topicId/lessons/import", importLessonsToSkillTopic);
router.get("/skill-topics/:topicId/lessons", getSkillLessonsForTopic);
router.delete("/skill-lessons/:id", deleteSkillLesson);

router.get("/learning-tree", getLearningTree);

router.get("/lessons/:id", getLessonDetail);

export default router;

