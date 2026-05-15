import { Router } from "express";
import { getActivityById } from "./controller.js";
const router = Router();
router.get("/:activityId", getActivityById);
export default router;
