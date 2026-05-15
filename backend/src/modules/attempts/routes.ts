import { Router } from "express";
import { createAttempt, getAttempt, submitAttempt } from "./controller.js";

const router = Router();

router.post("/", createAttempt);
router.get("/:attemptId", getAttempt);
router.post("/:attemptId/submit", submitAttempt);

export default router;
