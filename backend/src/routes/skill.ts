import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  // ── LEGACY bundle-based (kept for backward compat) ──────────────────────
  getSkillSections,
  getProfessions,
  getSectionBundles,
  getSingleBundle,
  startSkillBundle,
  startBundleItem,
  getSkillBundleProgress,
  getRecentlyActive,
  getMySkillProgress,
  getLessonSkillContext,
  // ── NEW topic-based ──────────────────────────────────────────────────────
  getSectionTopics,
  startSkillTopic,
  getRecentlyActiveTopic,
} from "../controllers/skillController";

const router = Router();

// ─── Discovery (public, but enriched with user data if logged in) ─────────────
router.get("/sections", getSkillSections);
router.get("/professions", getProfessions);
router.get("/sections/:slug/bundles", optionalAuth, getSectionBundles);   // legacy
router.get("/bundles/:bundleId", optionalAuth, getSingleBundle);

// ─── NEW: Full topic-based page data (replaces getSectionBundles as primary) ──
// GET  /skill/sections/:slug
//   → Returns profession_groups + modeling_fountains + tabs in one call.
//   Note: must be defined BEFORE /sections/:slug/bundles to avoid Express
//   matching "bundles" as :slug — but Express is path-specific so both coexist.
router.get("/sections/:slug", optionalAuth, getSectionTopics);

// ─── NEW: Topic actions (auth required) ───────────────────────────────────────
// POST /skill/topics/:topicId/start
//   → Body: { activityType }  → returns navigateTo URL
router.post("/topics/:topicId/start", requireAuth, startSkillTopic);

// ─── NEW: Recently-active topic (replaces bundle-based recently-active) ────────
// GET  /skill/me/recently-active-topic
router.get("/me/recently-active-topic", requireAuth, getRecentlyActiveTopic);

// ─── Bundle actions (auth required, legacy) ───────────────────────────────────
router.post("/bundles/:bundleId/start", requireAuth, startSkillBundle);
router.post("/bundles/:bundleId/items/:itemId/start", requireAuth, startBundleItem);
router.get("/bundles/:bundleId/progress", requireAuth, getSkillBundleProgress);

// ─── User progress (auth required) ───────────────────────────────────────────
router.get("/me/progress", requireAuth, getMySkillProgress);
router.get("/me/recently-active", requireAuth, getRecentlyActive);   // legacy

// ─── Cross-promotion (optional auth for progress enrichment) ─────────────────
router.get("/lessons/:lessonId/skill-context", optionalAuth, getLessonSkillContext);

export default router;