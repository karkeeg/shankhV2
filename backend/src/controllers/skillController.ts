import { Request, Response } from "express";
import { prisma } from "../prisma";
import { getUserIdFromRequest } from "../middleware/auth";
import { updateSkillTestSessionProgress } from "../services/progressService";

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────

/** GET /skill/professions */
export const getProfessions = async (_req: Request, res: Response) => {
  const professions = await prisma.profession.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
  });
  return res.json({ data: professions });
};

/**
 * GET /skill/professions/:slug/tests
 *
 * Returns tests grouped by topic for the SkillHome page.
 * Shape: { profession, topics: [{ topic, tests: [...] }] }
 */
export const getProfessionTests = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const userId = await getUserIdFromRequest(req);

  const profession = await prisma.profession.findUnique({ where: { slug } });
  if (!profession) return res.status(404).json({ error: "Profession not found" });

  // Fetch all active published topics with their tests
  const topics = await prisma.skillTopic.findMany({
    where: { professionId: profession.id, isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      tests: {
        where: { isActive: true, isPublished: true },
        orderBy: { orderIndex: "asc" },
        include: {
          typeConfigs: true,
          items: true,
          ...(userId ? { sessions: { where: { userId } } } : {}),
        },
      },
    },
  });

  const data = topics.map((topic) => ({
    topic: {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      orderIndex: topic.orderIndex,
    },
    tests: topic.tests.map((test) => ({
      id: test.id,
      name: test.name,
      description: test.description,
      isPublished: test.isPublished,
      orderIndex: test.orderIndex,
      typeConfigs: test.typeConfigs,
      itemCounts: {
        mcq: test.items.filter((i) => i.activityType === "mcq").length,
        canvas: test.items.filter((i) => i.activityType === "canvas").length,
        quantus: test.items.filter((i) => i.activityType === "quantus").length,
      },
      userProgress: userId ? (test as any).sessions ?? [] : [],
    })),
  }));

  return res.json({ data: { profession, topics: data } });
};

/** GET /skill/tests/:id */
export const getSingleTest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = await getUserIdFromRequest(req);

  const test = await prisma.skillTest.findUnique({
    where: { id },
    include: {
      typeConfigs: true,
      topic: true,
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          lesson: { select: { id: true, name: true, difficulty: true } },
          ...(userId
            ? { responses: { where: { session: { userId } }, select: { scorePct: true, activityType: true, testItemId: true } } }
            : {}),
        },
      },
      ...(userId ? { sessions: { where: { userId } } } : {}),
    },
  });

  if (!test) return res.status(404).json({ error: "Test not found" });

  const groupedItems = { mcq: [] as any[], canvas: [] as any[], quantus: [] as any[] };
  for (const item of test.items) {
    const type = item.activityType as "mcq" | "canvas" | "quantus";
    groupedItems[type].push({
      id: item.id,
      lessonId: item.lessonId,
      lessonName: item.lesson?.name || null,
      difficulty: item.lesson?.difficulty || null,
      activityId: item.activityId,
      activityType: item.activityType,
      orderIndex: item.orderIndex,
      userResponse: (item as any).responses?.[0] || null,
    });
  }

  return res.json({
    data: {
      test: {
        id: test.id,
        name: test.name,
        description: test.description,
        isPublished: test.isPublished,
        isActive: test.isActive,
        topicId: test.topicId,
        topic: test.topic,
        typeConfigs: test.typeConfigs,
        userSessions: (test as any).sessions || [],
      },
      items: groupedItems,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/** POST /skill/tests/:id/sessions */
export const startTestSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id: testId } = req.params;
  const { activityType } = req.body as { activityType: string };

  if (!activityType) {
    return res.status(400).json({ error: "activityType is required" });
  }

  // Use findFirst to avoid compound key naming issues
  const existing = await prisma.userSkillTestSession.findFirst({
    where: { userId, testId, activityType: activityType as any },
  });
  if (existing) {
    return res.status(409).json({ error: "Session already exists. No retakes allowed." });
  }

  const test = await prisma.skillTest.findUnique({
    where: { id: testId },
    include: {
      typeConfigs: { where: { activityType: activityType as any } },
      items: {
        where: { activityType: activityType as any },
        orderBy: { orderIndex: "asc" },
        include: { lesson: { select: { name: true, difficulty: true } } },
      },
    },
  });
  if (!test) return res.status(404).json({ error: "Test not found" });
  if (!test.isPublished) return res.status(400).json({ error: "Test is not published yet" });

  const defaultMins: Record<string, number> = { mcq: 20, canvas: 30, quantus: 45 };
  const timeLimitMins = test.typeConfigs[0]?.timeLimitMins ?? defaultMins[activityType] ?? 30;

  try {
    const session = await prisma.userSkillTestSession.create({
      data: {
        userId, testId,
        activityType: activityType as any,
        timeLimitMins,
        timeSpentSecs: 0,
        totalItems: test.items.length,
        completedItems: 0,
        status: "in_progress",
        startedAt: new Date(),
      },
    });
    return res.json({ data: { session, items: test.items, timeLimitMins, timeSpentSecs: 0 } });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Session already exists. No retakes allowed." });
    }
    throw err;
  }
};

/** GET /skill/tests/:id/sessions/:activityType */
export const resumeTestSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id: testId, activityType } = req.params;

  const session = await prisma.userSkillTestSession.findFirst({
    where: { userId, testId, activityType: activityType as any },
    include: {
      responses: {
        select: { testItemId: true, scorePct: true, activityType: true },
      },
    },
  });

  if (!session) return res.status(404).json({ error: "Session not found" });

  const completedItemIds = session.responses.map((r) => r.testItemId);
  const nextItem = await prisma.skillTestItem.findFirst({
    where: { testId, activityType: activityType as any, id: { notIn: completedItemIds } },
    orderBy: { orderIndex: "asc" },
  });

  return res.json({ data: { session, completedItemIds, nextItem } });
};

/** PATCH /skill/sessions/:sessionId */
export const pauseTestSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { timeSpentSecs } = req.body as { timeSpentSecs: number };

  if (typeof timeSpentSecs !== "number") {
    return res.status(400).json({ error: "timeSpentSecs must be a number" });
  }

  const session = await prisma.userSkillTestSession.findUnique({ where: { id: sessionId } });
  if (!session) return res.status(404).json({ error: "Session not found" });

  if (session.status !== "in_progress") {
    return res.json({ data: { timeSpentSecs: session.timeSpentSecs, status: session.status } });
  }

  const isExpired = timeSpentSecs >= session.timeLimitMins * 60;
  const updated = await prisma.userSkillTestSession.update({
    where: { id: sessionId },
    data: {
      timeSpentSecs,
      lastActiveAt: new Date(),
      status: isExpired ? "expired" : "in_progress",
      completedAt: isExpired ? new Date() : undefined,
    },
  });

  return res.json({ data: { timeSpentSecs: updated.timeSpentSecs, status: updated.status } });
};

/** POST /skill/sessions/:sessionId/submit */
export const submitSessionActivity = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { testItemId, activityType, existingSessionId, scorePct } = req.body as {
    testItemId: string; activityType: string; existingSessionId: string; scorePct: number;
  };

  if (!testItemId || !activityType || !existingSessionId || typeof scorePct !== "number") {
    return res.status(400).json({ error: "testItemId, activityType, existingSessionId, and scorePct are required" });
  }

  const session = await prisma.userSkillTestSession.findUnique({ where: { id: sessionId } });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const data: any = { sessionId, testItemId, activityType: activityType as any, scorePct };
  if (activityType === "mcq") data.mcqSessionId = existingSessionId;
  if (activityType === "canvas") data.canvasSessionId = existingSessionId;
  if (activityType === "quantus") data.quantusSessionId = existingSessionId;

  const response = await prisma.userSkillTestResponse.upsert({
    where: { sessionId_testItemId: { sessionId, testItemId } },
    update: { mcqSessionId: data.mcqSessionId, canvasSessionId: data.canvasSessionId, quantusSessionId: data.quantusSessionId, scorePct },
    create: data,
  });

  const sessionProgress = await updateSkillTestSessionProgress(sessionId);
  const allComplete = sessionProgress.completedItems >= sessionProgress.totalItems;

  return res.json({ data: { response, sessionProgress, allComplete } });
};

/** POST /skill/sessions/:sessionId/complete */
export const completeTestSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { timeSpentSecs } = req.body as { timeSpentSecs?: number };

  const session = await prisma.userSkillTestSession.findUnique({ where: { id: sessionId } });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const updated = await prisma.userSkillTestSession.update({
    where: { id: sessionId },
    data: {
      status: "completed",
      completedAt: new Date(),
      timeSpentSecs: typeof timeSpentSecs === "number" ? timeSpentSecs : session.timeSpentSecs,
    },
  });

  return res.json({ data: updated });
};

// ─────────────────────────────────────────────────────────────────────────────
// USER PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /skill/me/sessions */
export const getMySessions = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const status = req.query.status as string | undefined;

  const sessions = await prisma.userSkillTestSession.findMany({
    where: { userId, ...(status ? { status: status as any } : {}) },
    include: { test: { include: { profession: true } } },
    orderBy: { lastActiveAt: "desc" },
  });

  return res.json({
    data: sessions.map((s) => ({
      session: { id: s.id, activityType: s.activityType, timeLimitMins: s.timeLimitMins, timeSpentSecs: s.timeSpentSecs, totalItems: s.totalItems, completedItems: s.completedItems, scorePct: s.scorePct, status: s.status, startedAt: s.startedAt, lastActiveAt: s.lastActiveAt, completedAt: s.completedAt },
      test: { id: s.test.id, name: s.test.name, description: s.test.description },
      profession: s.test.profession,
    })),
  });
};

/** GET /skill/me/recently-active */
export const getRecentlyActiveSession = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const session = await prisma.userSkillTestSession.findFirst({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
    include: {
      test: { include: { profession: true } },
      responses: { select: { testItemId: true } },
    },
  });

  if (!session) return res.json({ data: null });

  const completedItemIds = session.responses.map((r) => r.testItemId);
  const nextItem = await prisma.skillTestItem.findFirst({
    where: { testId: session.testId, activityType: session.activityType, id: { notIn: completedItemIds } },
    orderBy: { orderIndex: "asc" },
  });

  return res.json({
    data: {
      session: { id: session.id, activityType: session.activityType, timeLimitMins: session.timeLimitMins, timeSpentSecs: session.timeSpentSecs, totalItems: session.totalItems, completedItems: session.completedItems, scorePct: session.scorePct, status: session.status, startedAt: session.startedAt, lastActiveAt: session.lastActiveAt, completedAt: session.completedAt },
      test: { id: session.test.id, name: session.test.name },
      profession: session.test.profession,
      nextItem,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — SKILL TOPICS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /admin/skill/topics */
export const createSkillTopic = async (req: Request, res: Response) => {
  const { professionId, name, description, orderIndex } = req.body as {
    professionId: string; name: string; description?: string; orderIndex?: number;
  };
  if (!professionId || !name) {
    return res.status(400).json({ error: "professionId and name are required" });
  }
  const topic = await prisma.skillTopic.create({
    data: { professionId, name, description, orderIndex: orderIndex ?? 0 },
  });
  return res.json({ data: topic });
};

export const getSkillTopics = async (req: Request, res: Response) => {
  const { professionId } = req.params;
  const topics = await prisma.skillTopic.findMany({
    where: { professionId, isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      tests: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          typeConfigs: true,
          items: true,        // ← need items to compute counts
        },
      },
    },
  });

  // Map to include itemCounts on each test
  const data = topics.map(topic => ({
    ...topic,
    tests: topic.tests.map(test => ({
      ...test,
      itemCounts: {
        mcq: test.items.filter(i => i.activityType === "mcq").length,
        canvas: test.items.filter(i => i.activityType === "canvas").length,
        quantus: test.items.filter(i => i.activityType === "quantus").length,
      },
    })),
  }));

  return res.json({ data });
};

/** PUT /admin/skill/topics/:id */
export const updateSkillTopic = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, orderIndex, isActive } = req.body;
  const topic = await prisma.skillTopic.update({
    where: { id },
    data: { name, description, orderIndex, isActive },
  });
  return res.json({ data: topic });
};

/** DELETE /admin/skill/topics/:id */
export const deleteSkillTopic = async (req: Request, res: Response) => {
  const { id } = req.params;
  // Soft delete
  await prisma.skillTopic.update({ where: { id }, data: { isActive: false } });
  return res.json({ data: { success: true } });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — SKILL TESTS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /admin/skill/tests */
export const createTest = async (req: Request, res: Response) => {
  const { professionId, topicId, name, description, orderIndex } = req.body as {
    professionId: string; topicId?: string; name: string; description?: string; orderIndex?: number;
  };
  if (!professionId || !name) {
    return res.status(400).json({ error: "professionId and name are required" });
  }
  const test = await prisma.skillTest.create({
    data: { professionId, topicId: topicId || null, name, description, orderIndex: orderIndex ?? 0 },
  });
  return res.json({ data: test });
};

/**
 * POST /admin/skill/tests/:id/publish
 *
 * Atomically writes items + configs and marks test as published.
 * Body: {
 *   items: [{ activityType, lessonId, activityId, timeLimitMins }]
 * }
 * Once published, test is locked — no further item changes allowed.
 */
export const publishTest = async (req: Request, res: Response) => {
  const { id: testId } = req.params;
  const { items } = req.body as {
    items: Array<{
      activityType: "mcq" | "canvas" | "quantus";
      lessonId: string;
      activityId: string;
      timeLimitMins: number;
    }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }

  const test = await prisma.skillTest.findUnique({ where: { id: testId } });
  if (!test) return res.status(404).json({ error: "Test not found" });
  if (test.isPublished) return res.status(409).json({ error: "Test is already published and cannot be modified" });

  // Validate: max one item per activity type
  const types = items.map((i) => i.activityType);
  const uniqueTypes = new Set(types);


  // Check global uniqueness — each activityId can only be in one test
  for (const item of items) {
    const existing = await prisma.skillTestItem.findFirst({
      where: { activityId: item.activityId, activityType: item.activityType },
    });
    if (existing && existing.testId !== testId) {
      return res.status(409).json({
        error: `Activity is already assigned to another test`,
        activityType: item.activityType,
        lessonId: item.lessonId,
      });
    }
  }

  // Atomic transaction: write items + configs + mark published
  const result = await prisma.$transaction(async (tx) => {
    // Delete any draft items that might exist from previous attempts
    await tx.skillTestItem.deleteMany({ where: { testId } });
    await tx.skillTestTypeConfig.deleteMany({ where: { testId } });

    // Create all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await tx.skillTestItem.create({
        data: {
          testId,
          lessonId: item.lessonId,
          activityType: item.activityType,
          activityId: item.activityId,
          orderIndex: i,
        },
      });
    }

    // Create time configs
    for (const item of items) {
      await tx.skillTestTypeConfig.create({
        data: {
          testId,
          activityType: item.activityType,
          timeLimitMins: item.timeLimitMins,
        },
      });
    }

    // Mark as published
    return tx.skillTest.update({
      where: { id: testId },
      data: { isPublished: true },
      include: { items: true, typeConfigs: true },
    });
  });

  return res.json({ data: result });
};

/** DELETE /admin/skill/tests/:id (soft delete) */
export const deleteTest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const test = await prisma.skillTest.findUnique({ where: { id } });
  if (!test) return res.status(404).json({ error: "Test not found" });
  await prisma.skillTest.update({ where: { id }, data: { isActive: false } });
  return res.json({ data: { success: true } });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — ACTIVITIES (for picker in admin UI)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/skill/professions/:professionId/available-activities
 * Returns activities tagged to profession, not yet in any published test.
 */
export const getAvailableActivities = async (req: Request, res: Response) => {
  const { professionId } = req.params;
  const activityType = req.query.activityType as string;

  if (!activityType) {
    return res.status(400).json({ error: "activityType query parameter is required" });
  }

  const tags = await prisma.subtopicProfessionTag.findMany({
    where: { professionId },
    select: { subtopicId: true },
  });
  const subtopicIds = tags.map((t) => t.subtopicId);
  if (subtopicIds.length === 0) return res.json({ data: [] });

  const lessons = await prisma.lesson.findMany({
    where: {
      subtopicId: { in: subtopicIds },
      isActive: true,
      deletedAt: null,
      lessonActivities: { some: { activityType: activityType as any } },
    },
    include: {
      mcqActivity: activityType === "mcq" ? true : false,
      canvasActivity: activityType === "canvas" ? true : false,
      quantusActivity: activityType === "quantus" ? true : false,
    },
  });

  // Only exclude activities already in PUBLISHED tests
  const assignedItems = await prisma.skillTestItem.findMany({
    where: {
      activityType: activityType as any,
      test: { isPublished: true },
    },
    select: { activityId: true },
  });
  const assignedIds = new Set(assignedItems.map((i) => i.activityId));

  const data: any[] = [];
  for (const lesson of lessons) {
    let activityId: string | null = null;
    if (activityType === "mcq" && lesson.mcqActivity) activityId = (lesson.mcqActivity as any).id;
    if (activityType === "canvas" && lesson.canvasActivity) activityId = (lesson.canvasActivity as any).id;
    if (activityType === "quantus" && lesson.quantusActivity) activityId = (lesson.quantusActivity as any).id;
    if (activityId && !assignedIds.has(activityId)) {
      data.push({ activityId, activityType, lessonId: lesson.id, lessonName: lesson.name, difficulty: lesson.difficulty });
    }
  }

  return res.json({ data });
};

// ─────────────────────────────────────────────────────────────────────────────
// CROSS PROMOTION
// ─────────────────────────────────────────────────────────────────────────────

/** GET /skill/lessons/:lessonId/skill-context */
export const getLessonSkillContext = async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userId = await getUserIdFromRequest(req);

  const testItems = await prisma.skillTestItem.findMany({
    where: { lessonId },
    include: { test: { include: { profession: true, topic: true } } },
  });

  if (testItems.length === 0) return res.json({ data: { bundles: [], skillLessons: [] } });

  const userSessionMap: Record<string, any> = {};
  if (userId) {
    const testIds = testItems.map((i) => i.testId);
    const sessions = await prisma.userSkillTestSession.findMany({ where: { userId, testId: { in: testIds } } });
    for (const s of sessions) userSessionMap[`${s.testId}_${s.activityType}`] = s;
  }

  return res.json({
    data: {
      bundles: testItems.map((item) => ({
        bundleId: item.testId,
        bundleName: item.test.name,
        topicName: item.test.topic?.name || null,
        itemId: item.id,
        activityType: item.activityType,
        professions: [{ id: item.test.profession.id, name: item.test.profession.name }],
        userProgress: userSessionMap[`${item.testId}_${item.activityType}`] || null,
      })),
      skillLessons: [],
    },
  });
};