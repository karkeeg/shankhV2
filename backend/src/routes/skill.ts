import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  getProfessions,
  getProfessionTests,
  getSingleTest,
  startTestSession,
  resumeTestSession,
  pauseTestSession,
  submitSessionActivity,
  completeTestSession,
  getMySessions,
  getRecentlyActiveSession,
  getLessonSkillContext,
} from "../controllers/skillController";

const router = Router();

/**
 * @openapi
 * /skill/professions:
 *   get:
 *     tags: [Skill]
 *     summary: List professions
 *     description: Returns all active professions for the Skill Building path.
 *     security: []
 *     responses:
 *       200:
 *         description: Array of professions.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataArray' }
 */
router.get("/professions", getProfessions);

/**
 * @openapi
 * /skill/professions/{slug}/tests:
 *   get:
 *     tags: [Skill]
 *     summary: List tests for a profession
 *     description: Auth is optional; when present, the user's session status is included per test.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string }, example: chartered-accountant }
 *     responses:
 *       200:
 *         description: The profession with its tests.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/professions/:slug/tests", optionalAuth, getProfessionTests);

/**
 * @openapi
 * /skill/tests/{id}:
 *   get:
 *     tags: [Skill]
 *     summary: Get a single test
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The test with its items.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/tests/:id", optionalAuth, getSingleTest);

/**
 * @openapi
 * /skill/tests/{id}/sessions:
 *   post:
 *     tags: [Skill]
 *     summary: Start a test session
 *     description: Begins a session for the given test and activity type. No retakes — returns 409 if a session already exists.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activityType]
 *             properties:
 *               activityType: { type: string, enum: [mcq, canvas, quantus] }
 *     responses:
 *       200:
 *         description: The started session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400:
 *         description: Missing activityType, or the test is not published.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: A session already exists (no retakes allowed).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/tests/:id/sessions", requireAuth, startTestSession);

/**
 * @openapi
 * /skill/tests/{id}/sessions/{activityType}:
 *   get:
 *     tags: [Skill]
 *     summary: Resume a test session
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: activityType, required: true, schema: { type: string, enum: [mcq, canvas, quantus] } }
 *     responses:
 *       200:
 *         description: The resumable session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/tests/:id/sessions/:activityType", requireAuth, resumeTestSession);

/**
 * @openapi
 * /skill/sessions/{sessionId}:
 *   patch:
 *     tags: [Skill]
 *     summary: Pause a test session
 *     description: Persists elapsed time when the user pauses.
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [timeSpentSecs]
 *             properties:
 *               timeSpentSecs: { type: number, example: 120 }
 *     responses:
 *       200:
 *         description: The paused session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/sessions/:sessionId", requireAuth, pauseTestSession);

/**
 * @openapi
 * /skill/sessions/{sessionId}/submit:
 *   post:
 *     tags: [Skill]
 *     summary: Submit an activity within a test session
 *     description: Records the score for one test item and bridges to skill bundle progress (Step 8).
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testItemId, activityType, existingSessionId, scorePct]
 *             properties:
 *               testItemId:        { type: string, format: uuid }
 *               activityType:      { type: string, enum: [mcq, canvas, quantus] }
 *               existingSessionId: { type: string, format: uuid }
 *               scorePct:          { type: number, example: 80 }
 *     responses:
 *       200:
 *         description: Updated session + bundle progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/sessions/:sessionId/submit", requireAuth, submitSessionActivity);

/**
 * @openapi
 * /skill/sessions/{sessionId}/complete:
 *   post:
 *     tags: [Skill]
 *     summary: Complete a test session
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeSpentSecs: { type: number, example: 300 }
 *     responses:
 *       200:
 *         description: The completed session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/sessions/:sessionId/complete", requireAuth, completeTestSession);

/**
 * @openapi
 * /skill/me/sessions:
 *   get:
 *     tags: [Skill]
 *     summary: List the user's test sessions
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string, enum: [in_progress, completed] }
 *         description: Optional filter by session status.
 *     responses:
 *       200:
 *         description: Array of sessions.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataArray' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/sessions", requireAuth, getMySessions);

/**
 * @openapi
 * /skill/me/recently-active:
 *   get:
 *     tags: [Skill]
 *     summary: Get the user's most recently active session
 *     responses:
 *       200:
 *         description: The recently active session, or null.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/recently-active", requireAuth, getRecentlyActiveSession);

/**
 * @openapi
 * /skill/lessons/{lessonId}/skill-context:
 *   get:
 *     tags: [Skill]
 *     summary: Get skill-building cross-promotion context for a lesson
 *     description: Returns which professions/bundles a lesson contributes to. Auth optional.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - { in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Skill context for the lesson.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 */
router.get("/lessons/:lessonId/skill-context", optionalAuth, getLessonSkillContext);

export default router;
