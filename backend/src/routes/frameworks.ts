import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  adminListFrameworks, adminGetFramework, adminCreateFramework,
  adminUpdateFramework, adminDeleteFramework,
} from "../controllers/frameworkController";

const router = Router();

// ─── Admin: Framework library ───────────────────────────────────────────────

/**
 * @openapi
 * /frameworks/admin/list:
 *   get:
 *     tags: [Frameworks]
 *     summary: "[Admin] List all frameworks"
 *     responses:
 *       200:
 *         description: Array of frameworks.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataArray' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/admin/list", requireAuth, requireAdmin, adminListFrameworks);

/**
 * @openapi
 * /frameworks/admin/create:
 *   post:
 *     tags: [Frameworks]
 *     summary: "[Admin] Create a framework"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               category:    { type: string }
 *               structure:   { type: object, additionalProperties: true }
 *               isActive:    { type: boolean }
 *     responses:
 *       201:
 *         description: The created framework.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/admin/create", requireAuth, requireAdmin, adminCreateFramework);

/**
 * @openapi
 * /frameworks/admin/{id}:
 *   get:
 *     tags: [Frameworks]
 *     summary: "[Admin] Get a framework"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The framework.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Frameworks]
 *     summary: "[Admin] Update a framework"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               category:    { type: string }
 *               structure:   { type: object, additionalProperties: true }
 *               isActive:    { type: boolean }
 *     responses:
 *       200:
 *         description: The updated framework.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Frameworks]
 *     summary: "[Admin] Delete a framework"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Framework deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/admin/:id", requireAuth, requireAdmin, adminGetFramework);
router.put("/admin/:id", requireAuth, requireAdmin, adminUpdateFramework);
router.delete("/admin/:id", requireAuth, requireAdmin, adminDeleteFramework);

export default router;
