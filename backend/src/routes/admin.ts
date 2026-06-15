import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  createModule, createTopic, createSubtopic, createLesson,
  assignLessonActivity, setupMcqActivity, setupCanvasActivity,
  setupQuantusActivity, addActivityHints, assignSubtopicProfessions,
  recalculateUserProgress, createProfession, getAdminProfessions,
  updateProfession, deleteProfession, getLearningTree, getLessonDetail,
  updateModule, deleteModule, updateTopic, deleteTopic,
  updateSubtopic, deleteSubtopic, updateLesson, deleteLesson,
  reorderCurriculum,
} from "../controllers/adminController";

import {
  createSkillTopic, getSkillTopics, updateSkillTopic, deleteSkillTopic,
  createTest, publishTest, deleteTest, getAvailableActivities,
} from "../controllers/skillController";

const router = Router();

// Every route in this file requires an authenticated admin. Each operation can
// therefore return 401 (no/invalid token) or 403 (authenticated non-admin).
router.use(requireAuth, requireAdmin);

// ── Learning content ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /admin/modules:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Create a module"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, name, accentColor]
 *             properties:
 *               slug:        { type: string, example: financial-accounting }
 *               name:        { type: string }
 *               description: { type: string }
 *               accentColor: { type: string, example: "#4F46E5" }
 *               iconKey:     { type: string }
 *               orderIndex:  { type: integer }
 *     responses:
 *       201: { description: Created module., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/modules", createModule);

/**
 * @openapi
 * /admin/modules/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: "[Admin] Update a module"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slug:        { type: string }
 *               name:        { type: string }
 *               description: { type: string }
 *               accentColor: { type: string }
 *               iconKey:     { type: string }
 *               orderIndex:  { type: integer }
 *               isActive:    { type: boolean }
 *     responses:
 *       200: { description: Updated module., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Admin]
 *     summary: "[Admin] Delete a module"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Module deleted., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessFlag' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/modules/:id", updateModule);
router.delete("/modules/:id", deleteModule);

/**
 * @openapi
 * /admin/topics:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Create a topic"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [module_id, name]
 *             properties:
 *               module_id:   { type: string, format: uuid }
 *               name:        { type: string }
 *               subtitle:    { type: string }
 *               description: { type: string }
 *               tags:        { type: array, items: { type: string } }
 *               orderIndex:  { type: integer }
 *               type:        { type: string }
 *     responses:
 *       201: { description: Created topic., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/topics", createTopic);

/**
 * @openapi
 * /admin/topics/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: "[Admin] Update a topic"
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
 *               subtitle:    { type: string }
 *               description: { type: string }
 *               tags:        { type: array, items: { type: string } }
 *               orderIndex:  { type: integer }
 *               type:        { type: string }
 *               isActive:    { type: boolean }
 *     responses:
 *       200: { description: Updated topic., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Admin]
 *     summary: "[Admin] Delete a topic"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Topic deleted., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessFlag' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/topics/:id", updateTopic);
router.delete("/topics/:id", deleteTopic);

/**
 * @openapi
 * /admin/subtopics:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Create a subtopic"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic_id, name]
 *             properties:
 *               topic_id:    { type: string, format: uuid }
 *               name:        { type: string }
 *               description: { type: string }
 *               type:        { type: string }
 *               orderIndex:  { type: integer }
 *     responses:
 *       201: { description: Created subtopic., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/subtopics", createSubtopic);

/**
 * @openapi
 * /admin/subtopics/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: "[Admin] Update a subtopic"
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
 *               type:        { type: string }
 *               orderIndex:  { type: integer }
 *               isActive:    { type: boolean }
 *     responses:
 *       200: { description: Updated subtopic., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Admin]
 *     summary: "[Admin] Delete a subtopic"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Subtopic deleted., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessFlag' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/subtopics/:id", updateSubtopic);
router.delete("/subtopics/:id", deleteSubtopic);

/**
 * @openapi
 * /admin/lessons:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Create a lesson"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subtopic_id, name]
 *             properties:
 *               subtopic_id: { type: string, format: uuid }
 *               name:        { type: string }
 *               difficulty:  { type: string }
 *               description: { type: string }
 *               orderIndex:  { type: integer }
 *     responses:
 *       201: { description: Created lesson., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/lessons", createLesson);

/**
 * @openapi
 * /admin/lessons/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: "[Admin] Update a lesson"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:          { type: string }
 *               description:   { type: string }
 *               difficulty:    { type: string }
 *               orderIndex:    { type: integer }
 *               estimatedMins: { type: integer }
 *               isActive:      { type: boolean }
 *     responses:
 *       200: { description: Updated lesson., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   get:
 *     tags: [Admin]
 *     summary: "[Admin] Get full lesson detail"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Lesson detail., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Admin]
 *     summary: "[Admin] Delete a lesson"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Lesson deleted., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessFlag' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/lessons/:id", updateLesson);
router.delete("/lessons/:id", deleteLesson);

/**
 * @openapi
 * /admin/curriculum/reorder:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Reorder curriculum entities"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entity, orderedIds]
 *             properties:
 *               entity:     { type: string, enum: [module, topic, subtopic, lesson] }
 *               orderedIds: { type: array, items: { type: string, format: uuid }, description: "IDs in their new order." }
 *     responses:
 *       200: { description: Reordered., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/curriculum/reorder", reorderCurriculum);

/**
 * @openapi
 * /admin/lessons/{id}/activities:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Attach an activity to a lesson"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [activity_type]
 *             properties:
 *               activity_type: { type: string, enum: [mcq, canvas, quantus] }
 *               order_index:   { type: integer }
 *     responses:
 *       201: { description: Activity attached., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/lessons/:id/activities", assignLessonActivity);

/**
 * @openapi
 * /admin/activities/mcq/{id}/setup:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Configure an MCQ activity"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid }, description: MCQ activity ID }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [instructions, questions]
 *             properties:
 *               title:        { type: string }
 *               instructions: { type: string }
 *               context:      { type: string }
 *               questions:    { type: array, items: { type: object, additionalProperties: true }, description: "Question + options + correct answer(s)." }
 *     responses:
 *       201: { description: Configured MCQ activity., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/activities/mcq/:id/setup", setupMcqActivity);

/**
 * @openapi
 * /admin/activities/canvas/{id}/setup:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Configure a canvas activity"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid }, description: Canvas activity ID }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, instructions]
 *             properties:
 *               title:          { type: string }
 *               instructions:   { type: string }
 *               context:        { type: string }
 *               assembly_mode:  { type: string }
 *               scoring_mode:   { type: string }
 *               penalty_weight: { type: number }
 *               pass_threshold: { type: number }
 *               tokens:         { type: array, items: { type: object, additionalProperties: true } }
 *               solution_edges: { type: array, items: { type: object, additionalProperties: true } }
 *     responses:
 *       201: { description: Configured canvas activity., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/activities/canvas/:id/setup", setupCanvasActivity);

/**
 * @openapi
 * /admin/activities/quantus/{id}/setup:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Configure a quantus (spreadsheet) activity"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid }, description: Quantus activity ID }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, instructions, columns]
 *             properties:
 *               title:         { type: string }
 *               instructions:  { type: string }
 *               context:       { type: string }
 *               reference_url: { type: string }
 *               column_groups: { type: array, items: { type: object, additionalProperties: true } }
 *               columns:       { type: array, items: { type: object, additionalProperties: true } }
 *               cells:         { type: array, items: { type: object, additionalProperties: true } }
 *     responses:
 *       201: { description: Configured quantus activity., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/activities/quantus/:id/setup", setupQuantusActivity);

/**
 * @openapi
 * /admin/activities/{type}/{id}/hints:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Add hints to an activity"
 *     parameters:
 *       - { in: path, name: type, required: true, schema: { type: string, enum: [mcq, canvas, quantus] } }
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hints]
 *             properties:
 *               hints: { type: array, items: { type: object, additionalProperties: true }, description: "Ordered hints." }
 *     responses:
 *       201: { description: Hints created., content: { application/json: { schema: { $ref: '#/components/schemas/CreatedCount' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/activities/:type/:id/hints", addActivityHints);

/**
 * @openapi
 * /admin/subtopics/{id}/professions:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Assign professions to a subtopic"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profession_ids]
 *             properties:
 *               profession_ids: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       201: { description: Professions assigned., content: { application/json: { schema: { $ref: '#/components/schemas/CreatedCount' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/subtopics/:id/professions", assignSubtopicProfessions);

/**
 * @openapi
 * /admin/users/{userId}/recalculate:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Recalculate a user's progress"
 *     description: Forces a full recompute of the user's curriculum progress cascade.
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Recalculation result., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/users/:userId/recalculate", recalculateUserProgress);

/**
 * @openapi
 * /admin/learning-tree:
 *   get:
 *     tags: [Admin]
 *     summary: "[Admin] Get the full learning tree"
 *     description: Returns the entire curriculum hierarchy (modules → topics → subtopics → lessons) for the admin editor.
 *     responses:
 *       200: { description: The learning tree., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.get("/learning-tree", getLearningTree);
router.get("/lessons/:id", getLessonDetail);

// ── Profession management ─────────────────────────────────────────────────────

/**
 * @openapi
 * /admin/professions:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Create a profession"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:        { type: string }
 *               slug:        { type: string }
 *               description: { type: string }
 *               iconKey:     { type: string }
 *               orderIndex:  { type: integer }
 *     responses:
 *       201: { description: Created profession., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   get:
 *     tags: [Admin]
 *     summary: "[Admin] List professions"
 *     responses:
 *       200: { description: Array of professions., content: { application/json: { schema: { $ref: '#/components/schemas/DataArray' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/professions", createProfession);
router.get("/professions", getAdminProfessions);

/**
 * @openapi
 * /admin/professions/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: "[Admin] Update a profession"
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
 *               slug:        { type: string }
 *               description: { type: string }
 *               iconKey:     { type: string }
 *               orderIndex:  { type: integer }
 *               isActive:    { type: boolean }
 *     responses:
 *       200: { description: Updated profession., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Admin]
 *     summary: "[Admin] Delete a profession"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Profession deleted., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessFlag' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/professions/:id", updateProfession);
router.delete("/professions/:id", deleteProfession);

// ── Skill topics ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /admin/skill/topics:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Create a skill topic"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [professionId, name]
 *             properties:
 *               professionId: { type: string, format: uuid }
 *               name:         { type: string }
 *               description:  { type: string }
 *               orderIndex:   { type: integer }
 *     responses:
 *       201: { description: Created skill topic., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/skill/topics", createSkillTopic);

/**
 * @openapi
 * /admin/skill/professions/{professionId}/topics:
 *   get:
 *     tags: [Admin]
 *     summary: "[Admin] List skill topics for a profession"
 *     parameters:
 *       - { in: path, name: professionId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Array of skill topics., content: { application/json: { schema: { $ref: '#/components/schemas/DataArray' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/skill/professions/:professionId/topics", getSkillTopics);

/**
 * @openapi
 * /admin/skill/topics/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: "[Admin] Update a skill topic"
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
 *               orderIndex:  { type: integer }
 *               isActive:    { type: boolean }
 *     responses:
 *       200: { description: Updated skill topic., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   delete:
 *     tags: [Admin]
 *     summary: "[Admin] Delete a skill topic"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Skill topic deleted., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessFlag' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.put("/skill/topics/:id", updateSkillTopic);
router.delete("/skill/topics/:id", deleteSkillTopic);

// ── Skill tests ───────────────────────────────────────────────────────────────

/**
 * @openapi
 * /admin/skill/tests:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Create a skill test"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [professionId, name]
 *             properties:
 *               professionId: { type: string, format: uuid }
 *               topicId:      { type: string, format: uuid }
 *               name:         { type: string }
 *               description:  { type: string }
 *               orderIndex:   { type: integer }
 *     responses:
 *       201: { description: Created test., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/skill/tests", createTest);

/**
 * @openapi
 * /admin/skill/tests/{id}/publish:
 *   post:
 *     tags: [Admin]
 *     summary: "[Admin] Publish a skill test"
 *     description: Locks the test with its items. A published test cannot be modified.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items: { type: array, items: { type: object, additionalProperties: true }, description: "Test items (linked activities) to include." }
 *     responses:
 *       200: { description: The published test., content: { application/json: { schema: { $ref: '#/components/schemas/DataObject' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Test is already published., content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/skill/tests/:id/publish", publishTest);

/**
 * @openapi
 * /admin/skill/tests/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: "[Admin] Delete a skill test"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Test deleted., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessFlag' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/skill/tests/:id", deleteTest);

/**
 * @openapi
 * /admin/skill/professions/{professionId}/available-activities:
 *   get:
 *     tags: [Admin]
 *     summary: "[Admin] List activities available to bundle into a test"
 *     parameters:
 *       - { in: path, name: professionId, required: true, schema: { type: string, format: uuid } }
 *       - in: query
 *         name: activityType
 *         required: true
 *         schema: { type: string, enum: [mcq, canvas, quantus] }
 *     responses:
 *       200: { description: Array of available activities., content: { application/json: { schema: { $ref: '#/components/schemas/DataArray' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/skill/professions/:professionId/available-activities", getAvailableActivities);

export default router;
