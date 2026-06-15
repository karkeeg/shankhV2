import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getLessonReactions, setLessonReaction, getMyReactions } from "../controllers/reactionController";

const router = Router();

/**
 * @openapi
 * /reactions/me/lessons:
 *   get:
 *     tags: [Reactions]
 *     summary: Get the current user's lesson reactions
 *     responses:
 *       200:
 *         description: The user's reactions keyed by lesson.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/lessons", requireAuth, getMyReactions);

/**
 * @openapi
 * /reactions/lessons/{lessonId}:
 *   get:
 *     tags: [Reactions]
 *     summary: Get reaction counts for a lesson
 *     parameters:
 *       - { in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Aggregate reaction counts (and the user's own reaction).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Reactions]
 *     summary: Set or clear the user's reaction to a lesson
 *     parameters:
 *       - { in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reaction]
 *             properties:
 *               reaction:
 *                 type: string
 *                 nullable: true
 *                 enum: [like, dislike, null]
 *                 description: "Pass null to clear the reaction."
 *               source: { type: string, default: lesson }
 *     responses:
 *       200:
 *         description: The updated reaction state.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400:
 *         description: Invalid reaction value.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: "reaction must be 'like', 'dislike', or null" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/lessons/:lessonId", requireAuth, getLessonReactions);
router.post("/lessons/:lessonId", requireAuth, setLessonReaction);

export default router;
