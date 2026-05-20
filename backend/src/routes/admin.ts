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
  assignTopicProfessions,
  recalculateUserProgress,
} from "../controllers/adminController";

const router = Router();

router.post("/admin/modules", requireAuth, requireAdmin, createModule);
router.post("/admin/topics", requireAuth, requireAdmin, createTopic);
router.post("/admin/subtopics", requireAuth, requireAdmin, createSubtopic);
router.post("/admin/lessons", requireAuth, requireAdmin, createLesson);
router.post("/admin/lessons/:id/activities", requireAuth, requireAdmin, assignLessonActivity);
router.post("/admin/activities/mcq/:id/setup", requireAuth, requireAdmin, setupMcqActivity);
router.post("/admin/activities/canvas/:id/setup", requireAuth, requireAdmin, setupCanvasActivity);
router.post("/admin/activities/quantus/:id/setup", requireAuth, requireAdmin, setupQuantusActivity);
router.post("/admin/activities/:type/:id/hints", requireAuth, requireAdmin, addActivityHints);
router.post("/admin/skill/bundles", requireAuth, requireAdmin, createSkillBundle);
router.post("/admin/skill/bundles/:id/professions", requireAuth, requireAdmin, assignBundleProfessions);
router.post("/admin/skill/bundles/:id/items", requireAuth, requireAdmin, assignBundleItems);
router.post("/admin/topics/:id/professions", requireAuth, requireAdmin, assignTopicProfessions);
router.post("/admin/users/:userId/recalculate", requireAuth, requireAdmin, recalculateUserProgress);

export default router;
