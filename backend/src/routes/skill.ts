import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getSkillSections, getProfessions, getSectionBundles, startSkillBundle, getSkillBundleProgress, getMySkillProgress } from "../controllers/skillController";

const router = Router();

router.get("/skill/sections", getSkillSections);
router.get("/skill/professions", getProfessions);
router.get("/skill/sections/:slug/bundles", getSectionBundles);
router.post("/skill/bundles/:bundleId/start", requireAuth, startSkillBundle);
router.get("/skill/bundles/:bundleId/progress", requireAuth, getSkillBundleProgress);
router.get("/me/skill/progress", requireAuth, getMySkillProgress);

export default router;
