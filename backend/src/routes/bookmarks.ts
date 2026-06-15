import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getMyBookmarks, getMyBookmarkIds, toggleBookmark } from "../controllers/bookmarkController";

const router = Router();

/**
 * @openapi
 * /bookmarks/me:
 *   get:
 *     tags: [Bookmarks]
 *     summary: List the user's bookmarks
 *     description: Returns the full bookmarked subtopics for the current user.
 *     responses:
 *       200:
 *         description: Array of bookmarked subtopics.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataArray' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", requireAuth, getMyBookmarks);

/**
 * @openapi
 * /bookmarks/me/ids:
 *   get:
 *     tags: [Bookmarks]
 *     summary: List the user's bookmarked subtopic IDs
 *     description: Lightweight endpoint returning only the bookmarked subtopic IDs (for toggling UI state).
 *     responses:
 *       200:
 *         description: Array of subtopic IDs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: string, format: uuid } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me/ids", requireAuth, getMyBookmarkIds);

/**
 * @openapi
 * /bookmarks/subtopics/{subtopicId}:
 *   post:
 *     tags: [Bookmarks]
 *     summary: Toggle a subtopic bookmark
 *     description: Adds the bookmark if absent, removes it if present.
 *     parameters:
 *       - { in: path, name: subtopicId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The new bookmark state.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { bookmarked: { type: boolean, example: true } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/subtopics/:subtopicId", requireAuth, toggleBookmark);

export default router;
