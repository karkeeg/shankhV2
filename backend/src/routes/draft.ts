import { Router } from "express";
import { saveDraft, getDraft, deleteDraft } from "../controllers/draftController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.put("/me/activities/:activityType/:activityId/draft", requireAuth, saveDraft);
router.get("/me/activities/:activityType/:activityId/draft", requireAuth, getDraft);
router.delete("/me/activities/:activityType/:activityId/draft", requireAuth, deleteDraft);

export default router;
