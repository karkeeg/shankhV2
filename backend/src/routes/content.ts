import { Router } from "express";
import {
  getModules,
  getModuleBySlug,
  getModuleTopics,
  getTopic,
  getTopicSubtopics,
  getSubtopic,
  getSubtopicLessons,
  getLessonDetail,
  getLessonHints,
} from "../controllers/contentController";

const router = Router();

/**
 * @openapi
 * /content/modules:
 *   get:
 *     tags: [Content]
 *     summary: List all modules
 *     description: Returns the top level of the curriculum hierarchy (all active modules).
 *     security: []
 *     responses:
 *       200:
 *         description: Array of modules.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataArray' }
 */
router.get("/modules", getModules);

/**
 * @openapi
 * /content/modules/slug/{slug}:
 *   get:
 *     tags: [Content]
 *     summary: Get a module by slug
 *     security: []
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string }, example: financial-accounting }
 *     responses:
 *       200:
 *         description: The module.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/modules/slug/:slug", getModuleBySlug);

/**
 * @openapi
 * /content/modules/{moduleId}/topics:
 *   get:
 *     tags: [Content]
 *     summary: List topics in a module
 *     security: []
 *     parameters:
 *       - { in: path, name: moduleId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The module with its topics.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/modules/:moduleId/topics", getModuleTopics);

/**
 * @openapi
 * /content/topics/{topicId}:
 *   get:
 *     tags: [Content]
 *     summary: Get a topic
 *     security: []
 *     parameters:
 *       - { in: path, name: topicId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The topic.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/topics/:topicId", getTopic);

/**
 * @openapi
 * /content/topics/{topicId}/subtopics:
 *   get:
 *     tags: [Content]
 *     summary: List subtopics in a topic
 *     security: []
 *     parameters:
 *       - { in: path, name: topicId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The topic with its subtopics.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/topics/:topicId/subtopics", getTopicSubtopics);

/**
 * @openapi
 * /content/subtopics/{subtopicId}:
 *   get:
 *     tags: [Content]
 *     summary: Get a subtopic
 *     security: []
 *     parameters:
 *       - { in: path, name: subtopicId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The subtopic.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/subtopics/:subtopicId", getSubtopic);

/**
 * @openapi
 * /content/subtopics/{subtopicId}/lessons:
 *   get:
 *     tags: [Content]
 *     summary: List lessons in a subtopic
 *     security: []
 *     parameters:
 *       - { in: path, name: subtopicId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The subtopic with its lessons.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/subtopics/:subtopicId/lessons", getSubtopicLessons);

/**
 * @openapi
 * /content/lessons/{lessonId}:
 *   get:
 *     tags: [Content]
 *     summary: Get full lesson detail
 *     description: Returns the lesson plus its activities (MCQ, canvas, quantus).
 *     security: []
 *     parameters:
 *       - { in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: The lesson detail.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/lessons/:lessonId", getLessonDetail);

/**
 * @openapi
 * /content/lessons/{lessonId}/hints:
 *   get:
 *     tags: [Content]
 *     summary: Get hints for a lesson activity
 *     security: []
 *     parameters:
 *       - { in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }
 *       - in: query
 *         name: activity_type
 *         required: true
 *         schema: { type: string, enum: [mcq, canvas, quantus] }
 *         description: Which activity's hints to fetch.
 *     responses:
 *       200:
 *         description: Hints for the activity.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DataObject' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/lessons/:lessonId/hints", getLessonHints);

export default router;
