import { Router } from "express";
import { getStudyPlans, getStudyPlanTree } from "./controller.js";
const router = Router();
router.get("/", getStudyPlans);
router.get("/:planId/tree", getStudyPlanTree);
export default router;
