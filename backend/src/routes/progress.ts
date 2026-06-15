import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getMeProgress,
  getModuleProgress,
  getSubtopicProgress,
  revealHint,
  trackTelemetry,
  getLearningProgressSummary,
  getDashboardData,
} from "../controllers/progressController";

const router = Router();

/**
 * @openapi
 * /progress/me/dashboard:
 *   get:
 *     tags: [Progress]
 *     summary: Get aggregated dashboard data
 *     description: Returns the composite dashboard payload (progress, streaks, recent activity) for the current user.
 *     responses:
 *       200:
 *         description: Dashboard data.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get("/me/dashboard", requireAuth, getDashboardData);

/**
 * @openapi
 * /progress/me/learning/progress/summary:
 *   get:
 *     tags: [Progress]
 *     summary: Get the learning progress summary
 *     description: Cached roll-up of curriculum progress across all modules.
 *     responses:
 *       200:
 *         description: Progress summary.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/learning/progress/summary", requireAuth, getLearningProgressSummary);

/**
 * @openapi
 * /progress/me/progress:
 *   get:
 *     tags: [Progress]
 *     summary: Get the user's overall progress
 *     responses:
 *       200:
 *         description: Overall progress metrics.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/progress", requireAuth, getMeProgress);

/**
 * @openapi
 * /progress/me/modules/{moduleId}/progress:
 *   get:
 *     tags: [Progress]
 *     summary: Get the user's progress for a module
 *     parameters:
 *       - { in: path, name: moduleId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Module progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/me/modules/:moduleId/progress", requireAuth, getModuleProgress);

/**
 * @openapi
 * /progress/me/subtopics/{subtopicId}/progress:
 *   get:
 *     tags: [Progress]
 *     summary: Get the user's progress for a subtopic
 *     parameters:
 *       - { in: path, name: subtopicId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Subtopic progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/me/subtopics/:subtopicId/progress", requireAuth, getSubtopicProgress);

/**
 * @openapi
 * /progress/hints/reveal:
 *   post:
 *     tags: [Progress]
 *     summary: Reveal the next hint for an activity
 *     description: Records hint usage and returns the next available hint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activity_type, activity_id]
 *             properties:
 *               activity_type: { type: string, enum: [mcq, canvas, quantus] }
 *               activity_id:   { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: The revealed hint.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400:
 *         description: Missing fields, or no more hints available.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/hints/reveal", requireAuth, revealHint);

/**
 * @openapi
 * /progress/telemetry:
 *   post:
 *     tags: [Progress]
 *     summary: Record a telemetry event
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Arbitrary telemetry payload (event name, metadata).
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Event recorded.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/telemetry", requireAuth, trackTelemetry);

export default router;
