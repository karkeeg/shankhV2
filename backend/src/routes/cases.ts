import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  listCases, getCaseDetail, getOrCreateSession, markStudiesRead, submitCaseActivity, saveCaseActivityDraft,
  adminListCases, adminCreateCase, adminUpdateCase, adminDeleteCase, adminGetCase,
  adminAddStudy, adminUpdateStudy, adminDeleteStudy,
  adminAddActivity, adminUpdateActivity, adminDeleteActivity,
} from "../controllers/caseController";

const router = Router();

// ─── User-facing ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /cases:
 *   get:
 *     tags: [Cases]
 *     summary: List published case studies
 *     responses:
 *       200:
 *         description: Array of cases.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataArray' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/", requireAuth, listCases);

/**
 * @openapi
 * /cases/{id}:
 *   get:
 *     tags: [Cases]
 *     summary: Get a case study with its studies and activities
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The case detail.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", requireAuth, getCaseDetail);

/**
 * @openapi
 * /cases/{id}/session:
 *   post:
 *     tags: [Cases]
 *     summary: Get or create the user's session for a case
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The case session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/session", requireAuth, getOrCreateSession);

/**
 * @openapi
 * /cases/{id}/session/mark-read:
 *   post:
 *     tags: [Cases]
 *     summary: Mark the case studies as read
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The updated session.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/session/mark-read", requireAuth, markStudiesRead);

/**
 * @openapi
 * /cases/{id}/activities/{activityId}/submit:
 *   post:
 *     tags: [Cases]
 *     summary: Submit a response to a case activity
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: activityId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [responseData]
 *             properties:
 *               responseData: { type: object, additionalProperties: true, description: "The user's answer payload for the activity." }
 *     responses:
 *       200:
 *         description: The graded response.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/activities/:activityId/submit", requireAuth, submitCaseActivity);

/**
 * @openapi
 * /cases/{id}/activities/{activityId}/draft:
 *   post:
 *     tags: [Cases]
 *     summary: Save an in-progress (ungraded) response to a case activity
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: activityId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [responseData]
 *             properties:
 *               responseData: { type: object, additionalProperties: true, description: "Partial answer / canvas layout to persist." }
 *     responses:
 *       200:
 *         description: The saved draft.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post("/:id/activities/:activityId/draft", requireAuth, saveCaseActivityDraft);

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /cases/admin/list:
 *   get:
 *     tags: [Cases]
 *     summary: "[Admin] List all cases (including drafts)"
 *     responses:
 *       200:
 *         description: Array of cases.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataArray' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/admin/list", requireAuth, requireAdmin, adminListCases);

/**
 * @openapi
 * /cases/admin/create:
 *   post:
 *     tags: [Cases]
 *     summary: "[Admin] Create a case"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               difficulty:  { type: string, example: intermediate }
 *               isPublished: { type: boolean, default: false }
 *               orderIndex:  { type: integer }
 *     responses:
 *       201:
 *         description: The created case.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/admin/create", requireAuth, requireAdmin, adminCreateCase);

/**
 * @openapi
 * /cases/admin/{id}:
 *   get:
 *     tags: [Cases]
 *     summary: "[Admin] Get a case (full, including drafts)"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The case.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Cases]
 *     summary: "[Admin] Update a case"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               difficulty:  { type: string }
 *               isPublished: { type: boolean }
 *               orderIndex:  { type: integer }
 *     responses:
 *       200:
 *         description: The updated case.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Cases]
 *     summary: "[Admin] Delete a case"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Case deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/admin/:id", requireAuth, requireAdmin, adminGetCase);
router.put("/admin/:id", requireAuth, requireAdmin, adminUpdateCase);
router.delete("/admin/:id", requireAuth, requireAdmin, adminDeleteCase);

/**
 * @openapi
 * /cases/admin/{id}/studies:
 *   post:
 *     tags: [Cases]
 *     summary: "[Admin] Add a study to a case"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:      { type: string }
 *               content:    { type: string }
 *               orderIndex: { type: integer }
 *     responses:
 *       201:
 *         description: The created study.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/admin/:id/studies", requireAuth, requireAdmin, adminAddStudy);

/**
 * @openapi
 * /cases/admin/{id}/studies/{studyId}:
 *   put:
 *     tags: [Cases]
 *     summary: "[Admin] Update a study"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: studyId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:      { type: string }
 *               content:    { type: string }
 *               orderIndex: { type: integer }
 *     responses:
 *       200:
 *         description: The updated study.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Cases]
 *     summary: "[Admin] Delete a study"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: studyId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Study deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/admin/:id/studies/:studyId", requireAuth, requireAdmin, adminUpdateStudy);
router.delete("/admin/:id/studies/:studyId", requireAuth, requireAdmin, adminDeleteStudy);

/**
 * @openapi
 * /cases/admin/{id}/activities:
 *   post:
 *     tags: [Cases]
 *     summary: "[Admin] Add an activity to a case"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activityType, activityData]
 *             properties:
 *               activityType: { type: string, example: mcq }
 *               activityData: { type: object, additionalProperties: true }
 *               orderIndex:   { type: integer }
 *     responses:
 *       201:
 *         description: The created activity.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/admin/:id/activities", requireAuth, requireAdmin, adminAddActivity);

/**
 * @openapi
 * /cases/admin/{id}/activities/{activityId}:
 *   put:
 *     tags: [Cases]
 *     summary: "[Admin] Update a case activity"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: activityId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activityData: { type: object, additionalProperties: true }
 *               orderIndex:   { type: integer }
 *     responses:
 *       200:
 *         description: The updated activity.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Cases]
 *     summary: "[Admin] Delete a case activity"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: activityId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Activity deleted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessFlag' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/admin/:id/activities/:activityId", requireAuth, requireAdmin, adminUpdateActivity);
router.delete("/admin/:id/activities/:activityId", requireAuth, requireAdmin, adminDeleteActivity);

export default router;
