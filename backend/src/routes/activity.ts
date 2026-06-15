import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getActivity,
  submitMcqSession,
  submitCanvasSession,
  submitQuantusSession,
} from "../controllers/sessionController";

const router = Router();

/**
 * @openapi
 * /activities/{id}:
 *   get:
 *     tags: [Activities]
 *     summary: Get a lesson's activities
 *     description: Fetches the lesson and all activity steps. `{id}` is the lessonId. (Mounted at both `/api/v1/activities` and `/api/v1/attempts`.)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid }, description: Lesson ID }
 *     responses:
 *       200:
 *         description: Lesson with activities.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", requireAuth, getActivity);

/**
 * @openapi
 * /attempts:
 *   post:
 *     tags: [Activities]
 *     summary: Create an attempt (legacy)
 *     description: Echoes the supplied lessonId back as `attemptId`. No DB record is created — lessonId is the stable identifier.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId]
 *             properties:
 *               lessonId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The attempt id.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { attemptId: { type: string, format: uuid } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/", requireAuth, (req, res) => {
  const { lessonId } = req.body as { lessonId?: string };
  if (!lessonId) return res.status(400).json({ error: "lessonId is required" });
  return res.json({ data: { attemptId: lessonId } });
});

/**
 * @openapi
 * /attempts/{id}/submit:
 *   post:
 *     tags: [Activities]
 *     summary: Submit an attempt (legacy)
 *     description: Routes to the MCQ, canvas, or quantus grader based on `activityType` (defaults to `mcq`). `{id}` is the lessonId. Runs the full progress cascade including the Step 8 skill bridge.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid }, description: Lesson ID }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activityType: { type: string, enum: [mcq, canvas, quantus], default: mcq }
 *               answers:      { type: array, items: { type: object, additionalProperties: true }, description: "For MCQ attempts." }
 *               canvasData:   { type: object, additionalProperties: true, description: "For canvas attempts." }
 *               score:        { type: number, description: "For quantus attempts." }
 *               total:        { type: number, description: "For quantus attempts." }
 *               hintsUsed:    { type: integer }
 *     responses:
 *       200:
 *         description: Graded attempt + updated progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/submit", requireAuth, async (req, res) => {
  // Map :id back to lessonId so existing controller functions work unchanged
  req.body.lessonId = req.body.lessonId || req.params.id;

  const { activityType } = req.body as { activityType?: string };
  switch ((activityType || "mcq").toLowerCase()) {
    case "mcq":     return submitMcqSession(req, res);
    case "canvas":  return submitCanvasSession(req, res);
    case "quantus": return submitQuantusSession(req, res);
    default:        return submitMcqSession(req, res);
  }
});

/**
 * @openapi
 * /attempts/session/mcq:
 *   post:
 *     tags: [Activities]
 *     summary: Submit an MCQ attempt (explicit type)
 *     description: Direct MCQ submission. See `POST /session/attempts/session/mcq` for the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, answers]
 *             properties:
 *               lessonId:  { type: string, format: uuid }
 *               answers:   { type: array, items: { type: object, additionalProperties: true } }
 *               hintsUsed: { type: integer }
 *     responses:
 *       200:
 *         description: Graded attempt + updated progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/session/mcq", requireAuth, submitMcqSession);

/**
 * @openapi
 * /attempts/session/canvas:
 *   post:
 *     tags: [Activities]
 *     summary: Submit a canvas attempt (explicit type)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, canvasData]
 *             properties:
 *               lessonId:   { type: string, format: uuid }
 *               canvasData: { type: object, additionalProperties: true }
 *               hintsUsed:  { type: integer }
 *     responses:
 *       200:
 *         description: Graded attempt + updated progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/session/canvas", requireAuth, submitCanvasSession);

/**
 * @openapi
 * /attempts/session/quantus:
 *   post:
 *     tags: [Activities]
 *     summary: Submit a quantus attempt (explicit type)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, score]
 *             properties:
 *               lessonId:      { type: string, format: uuid }
 *               score:         { type: number }
 *               total:         { type: number }
 *               inputSnapshot: { type: object, additionalProperties: true }
 *               hintsUsed:     { type: integer }
 *     responses:
 *       200:
 *         description: Recorded attempt + updated progress.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/session/quantus", requireAuth, submitQuantusSession);

export default router;
