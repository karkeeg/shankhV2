import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  listCases, getCaseDetail, getOrCreateSession, markStudiesRead, submitCaseActivity,
  adminListCases, adminCreateCase, adminUpdateCase, adminDeleteCase, adminGetCase,
  adminAddStudy, adminUpdateStudy, adminDeleteStudy,
  adminAddActivity, adminUpdateActivity, adminDeleteActivity,
} from "../controllers/caseController";

const router = Router();

// ─── User-facing ──────────────────────────────────────────────────────────────
router.get("/", requireAuth, listCases);
router.get("/:id", requireAuth, getCaseDetail);
router.post("/:id/session", requireAuth, getOrCreateSession);
router.post("/:id/session/mark-read", requireAuth, markStudiesRead);
router.post("/:id/activities/:activityId/submit", requireAuth, submitCaseActivity);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get("/admin/list", requireAuth, requireAdmin, adminListCases);
router.post("/admin/create", requireAuth, requireAdmin, adminCreateCase);
router.get("/admin/:id", requireAuth, requireAdmin, adminGetCase);
router.put("/admin/:id", requireAuth, requireAdmin, adminUpdateCase);
router.delete("/admin/:id", requireAuth, requireAdmin, adminDeleteCase);

router.post("/admin/:id/studies", requireAuth, requireAdmin, adminAddStudy);
router.put("/admin/:id/studies/:studyId", requireAuth, requireAdmin, adminUpdateStudy);
router.delete("/admin/:id/studies/:studyId", requireAuth, requireAdmin, adminDeleteStudy);

router.post("/admin/:id/activities", requireAuth, requireAdmin, adminAddActivity);
router.put("/admin/:id/activities/:activityId", requireAuth, requireAdmin, adminUpdateActivity);
router.delete("/admin/:id/activities/:activityId", requireAuth, requireAdmin, adminDeleteActivity);

export default router;
