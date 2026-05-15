import { Router } from "express";
import { getActivityById, getActivityBySlug } from "./controller.js";

const router = Router();

router.get("/by-slug/:activitySlug", getActivityBySlug);
router.get("/:activityId", getActivityById);

export default router;

