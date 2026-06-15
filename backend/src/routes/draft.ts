import { Router } from "express";
import { saveDraft, getDraft, deleteDraft } from "../controllers/draftController";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /draft/me/activities/{activityType}/{activityId}/draft:
 *   put:
 *     tags: [Draft]
 *     summary: Save (upsert) an activity draft
 *     description: Autosaves in-progress work for an activity so the user can resume later.
 *     parameters:
 *       - { in: path, name: activityType, required: true, schema: { type: string, enum: [mcq, canvas, quantus] } }
 *       - { in: path, name: activityId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [draft_state]
 *             properties:
 *               draft_state:    { type: object, additionalProperties: true, description: "Arbitrary serialized draft payload." }
 *               hints_revealed: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: The saved draft.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   get:
 *     tags: [Draft]
 *     summary: Get a saved activity draft
 *     parameters:
 *       - { in: path, name: activityType, required: true, schema: { type: string, enum: [mcq, canvas, quantus] } }
 *       - { in: path, name: activityId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The draft, or null if none exists.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     tags: [Draft]
 *     summary: Delete a saved activity draft
 *     parameters:
 *       - { in: path, name: activityType, required: true, schema: { type: string, enum: [mcq, canvas, quantus] } }
 *       - { in: path, name: activityId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Draft deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put("/me/activities/:activityType/:activityId/draft", requireAuth, saveDraft);
router.get("/me/activities/:activityType/:activityId/draft", requireAuth, getDraft);
router.delete("/me/activities/:activityType/:activityId/draft", requireAuth, deleteDraft);

export default router;
