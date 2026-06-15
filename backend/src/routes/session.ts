import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  getActivity,
  getResume,
  startLessonSession,
  updateLessonSession,
  submitMcqSession,
  submitCanvasSession,
  submitQuantusSession,
} from "../controllers/sessionController";

const router = Router();

/**
 * @openapi
 * /session/activities/{id}:
 *   get:
 *     tags: [Session]
 *     summary: Load activity content for a lesson
 *     description: Fetches the lesson and all its activity steps. `{id}` is the lessonId. Auth is optional — when present, the user's prior progress/draft is included.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid }, description: Lesson ID }
 *     responses:
 *       200:
 *         description: Lesson with activity content.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/activities/:id", optionalAuth, getActivity);

/**
 * @openapi
 * /session/session/me/resume:
 *   get:
 *     tags: [Session]
 *     summary: Get the user's resumable lesson session
 *     responses:
 *       200:
 *         description: The most recent in-progress session, or null.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/session/me/resume", requireAuth, getResume);

/**
 * @openapi
 * /session/session/me/lessons/{lessonId}/session/start:
 *   post:
 *     tags: [Session]
 *     summary: Start (or resume) a lesson session
 *     parameters:
 *       - { in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The started/resumed session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/session/me/lessons/:lessonId/session/start", requireAuth, startLessonSession);

/**
 * @openapi
 * /session/session/me/lessons/{lessonId}/session:
 *   patch:
 *     tags: [Session]
 *     summary: Update the current activity pointer of a lesson session
 *     parameters:
 *       - { in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentActivityType: { type: string, enum: [mcq, canvas, quantus] }
 *     responses:
 *       200:
 *         description: The updated session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/session/me/lessons/:lessonId/session", requireAuth, updateLessonSession);

/**
 * @openapi
 * /session/attempts/session/mcq:
 *   post:
 *     tags: [Session]
 *     summary: Submit an MCQ attempt
 *     description: Grades the MCQ attempt and runs the Learning progress cascade (steps 1–7).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, answers]
 *             properties:
 *               lessonId: { type: string, format: uuid }
 *               answers:
 *                 type: array
 *                 description: Selected answer(s) per question.
 *                 items: { type: object, additionalProperties: true }
 *               hintsUsed: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Graded attempt + updated lesson progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/attempts/session/mcq", requireAuth, submitMcqSession);

/**
 * @openapi
 * /session/attempts/session/canvas:
 *   post:
 *     tags: [Session]
 *     summary: Submit a canvas (drag-and-drop) attempt
 *     description: Grades the canvas attempt and runs the Learning progress cascade.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, canvasData]
 *             properties:
 *               lessonId:   { type: string, format: uuid }
 *               canvasData: { type: object, additionalProperties: true, description: "Placed nodes/edges to grade." }
 *               hintsUsed:  { type: integer, example: 0 }
 *     responses:
 *       200:
 *         description: Graded attempt + updated lesson progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/attempts/session/canvas", requireAuth, submitCanvasSession);

/**
 * @openapi
 * /session/attempts/session/quantus:
 *   post:
 *     tags: [Session]
 *     summary: Submit a quantus (spreadsheet) attempt
 *     description: Records the quantus score and runs the Learning progress cascade.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, score]
 *             properties:
 *               lessonId:      { type: string, format: uuid }
 *               score:         { type: number, example: 8 }
 *               total:         { type: number, example: 10 }
 *               inputSnapshot: { type: object, additionalProperties: true, description: "Final cell values." }
 *               hintsUsed:     { type: integer, example: 0 }
 *     responses:
 *       200:
 *         description: Recorded attempt + updated lesson progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/attempts/session/quantus", requireAuth, submitQuantusSession);

export default router;
