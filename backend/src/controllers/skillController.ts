import { Request, Response } from "express";
import { prisma } from "../prisma";
import { getUserIdFromRequest } from "../middleware/auth";
import { UserSkillBundleProgress, UserSkillItemProgress, UserSkillTopicProgress } from "@prisma/client";

// ─── LEGACY bundle-based (kept for backward compat) ──────────────────────────

/**
 * GET /skill/sections — list all skill sections.
 */
export const getSkillSections = async (_req: Request, res: Response) => {
  const sections = await prisma.skillSection.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
  });
  return res.json({ data: sections });
};

/**
 * GET /skill/professions — list all active professions.
 */
export const getProfessions = async (_req: Request, res: Response) => {
  const professions = await prisma.profession.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
  });
  return res.json({ data: professions });
};

/**
 * GET /skill/sections/:slug/bundles — get bundles for a section (optional auth for enrichment).
 */
export const getSectionBundles = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const userId = await getUserIdFromRequest(req);

  const section = await prisma.skillSection.findUnique({
    where: { slug },
    include: {
      bundles: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          professions: { include: { profession: true } },
          items: true,
        },
      },
    },
  });

  if (!section) return res.status(404).json({ error: "Section not found" });

  // Optionally enrich with user progress
  const userProgresses: Record<string, UserSkillBundleProgress> = {};
  if (userId) {
    const bundleIds = section.bundles.map((b) => b.id);
    const progresses = await prisma.userSkillBundleProgress.findMany({
      where: { userId, bundleId: { in: bundleIds } },
    });
    for (const p of progresses) {
      userProgresses[p.bundleId] = p;
    }
  }

  return res.json({
    data: {
      section: { id: section.id, slug: section.slug, name: section.name, description: section.description },
      bundles: section.bundles.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        level: b.level,
        durationWeeks: b.durationWeeks,
        bundleGroup: b.bundleGroup,
        professions: b.professions.map((bp) => ({
          id: bp.profession.id,
          name: bp.profession.name,
          slug: bp.profession.slug,
        })),
        itemsCount: b.items.length,
        userProgress: userProgresses[b.id] || null,
      })),
    },
  });
};

/**
 * GET /skill/bundles/:bundleId — get single bundle detail.
 */
export const getSingleBundle = async (req: Request, res: Response) => {
  const { bundleId } = req.params;
  const userId = await getUserIdFromRequest(req);

  const bundle = await prisma.skillBundle.findUnique({
    where: { id: bundleId },
    include: {
      professions: { include: { profession: true } },
      items: {
        orderBy: { orderIndex: "asc" },
        include: { lesson: true },
      },
    },
  });

  if (!bundle) return res.status(404).json({ error: "Bundle not found" });

  const userItemProgresses: Record<string, UserSkillItemProgress> = {};
  if (userId) {
    const itemIds = bundle.items.map((i) => i.id);
    const progresses = await prisma.userSkillItemProgress.findMany({
      where: { userId, bundleItemId: { in: itemIds } },
    });
    for (const p of progresses) {
      userItemProgresses[p.bundleItemId] = p;
    }
  }

  return res.json({
    data: {
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      level: bundle.level,
      durationWeeks: bundle.durationWeeks,
      professions: bundle.professions.map((bp) => ({
        id: bp.profession.id,
        name: bp.profession.name,
        slug: bp.profession.slug,
      })),
      items: bundle.items.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        activityType: item.activityType,
        lessonId: item.lessonId,
        lessonName: item.lesson?.name || null,
        userProgress: userItemProgresses[item.id] || null,
      })),
    },
  });
};

/**
 * POST /skill/bundles/:bundleId/start — start a skill bundle (mark as started).
 */
export const startSkillBundle = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { bundleId } = req.params;

  const bundle = await prisma.skillBundle.findUnique({ where: { id: bundleId } });
  if (!bundle) return res.status(404).json({ error: "Bundle not found" });

  const itemsTotal = await prisma.skillBundleItem.count({ where: { bundleId } });

  await prisma.userSkillBundleProgress.upsert({
    where: { userId_bundleId: { userId, bundleId } },
    update: { lastAccessedAt: new Date() },
    create: {
      userId,
      bundleId,
      itemsTotal,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    },
  });

  return res.json({ data: { success: true, bundleId } });
};

/**
 * POST /skill/bundles/:bundleId/items/:itemId/start — mark a bundle item as accessed.
 */
export const startBundleItem = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { bundleId, itemId } = req.params;

  const item = await prisma.skillBundleItem.findUnique({ where: { id: itemId } });
  if (!item || item.bundleId !== bundleId) {
    return res.status(404).json({ error: "Bundle item not found" });
  }

  // Ensure item progress exists
  await prisma.userSkillItemProgress.upsert({
    where: { userId_bundleItemId: { userId, bundleItemId: itemId } },
    update: { updatedAt: new Date() },
    create: { userId, bundleItemId: itemId },
  });

  // Update bundle last-accessed timestamp
  await prisma.userSkillBundleProgress.upsert({
    where: { userId_bundleId: { userId, bundleId } },
    update: { lastAccessedAt: new Date() },
    create: { userId, bundleId, startedAt: new Date(), lastAccessedAt: new Date() },
  });

  return res.json({
    data: {
      lessonId: item.lessonId,
      activityType: item.activityType,
    },
  });
};

/**
 * GET /skill/bundles/:bundleId/progress — get progress for a specific bundle.
 */
export const getSkillBundleProgress = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { bundleId } = req.params;

  const items = await prisma.skillBundleItem.findMany({
    where: { bundleId },
    select: { id: true },
  });
  const itemIds = items.map((i) => i.id);

  const progresses = await prisma.userSkillItemProgress.findMany({
    where: { userId, bundleItemId: { in: itemIds } },
  });

  const itemsCompleted = progresses.filter((p) => p.isCompleted).length;
  const completionPct = itemIds.length > 0 ? Math.round((itemsCompleted / itemIds.length) * 100) : 0;

  return res.json({
    data: {
      bundleId,
      itemsTotal: itemIds.length,
      itemsCompleted,
      completionPct,
      items: progresses.map((p) => ({
        bundleItemId: p.bundleItemId,
        bestScorePct: p.bestScorePct,
        isCompleted: p.isCompleted,
        attempts: p.attempts,
      })),
    },
  });
};

/**
 * GET /skill/me/recently-active — most recently accessed bundle (legacy).
 */
export const getRecentlyActive = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const recent = await prisma.userSkillBundleProgress.findFirst({
    where: { userId },
    orderBy: { lastAccessedAt: "desc" },
    include: {
      bundle: {
        include: { professions: { include: { profession: true } } },
      },
    },
  });

  if (!recent) return res.json({ data: null });

  return res.json({
    data: {
      bundleId: recent.bundleId,
      bundleName: recent.bundle.name,
      completionPct: recent.completionPct,
      lastAccessedAt: recent.lastAccessedAt,
      professions: recent.bundle.professions.map((bp) => ({
        id: bp.profession.id,
        name: bp.profession.name,
      })),
    },
  });
};

/**
 * GET /skill/me/progress — get all skill progress for the authenticated user.
 */
export const getMySkillProgress = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const bundleProgresses = await prisma.userSkillBundleProgress.findMany({
    where: { userId },
    include: {
      bundle: {
        include: { professions: { include: { profession: true } } },
      },
    },
  });

  // Also include new topic-based progress
  const topicProgresses = await prisma.userSkillTopicProgress.findMany({
    where: { userId },
    include: { skillTopic: { include: { profession: true } } },
  });

  return res.json({
    data: {
      bundles: bundleProgresses.map((bp) => ({
        bundleId: bp.bundleId,
        bundleName: bp.bundle.name,
        itemsCompleted: bp.itemsCompleted,
        itemsTotal: bp.itemsTotal,
        completionPct: bp.completionPct,
        professions: bp.bundle.professions.map((p) => ({
          id: p.profession.id,
          name: p.profession.name,
        })),
      })),
      topics: topicProgresses.map((tp) => ({
        topicId: tp.skillTopicId,
        topicName: tp.skillTopic.name,
        professionName: tp.skillTopic.profession.name,
        lessonsCompleted: tp.lessonsCompleted,
        lessonsTotal: tp.lessonsTotal,
        completionPct: tp.completionPct,
      })),
    },
  });
};

/**
 * GET /skill/lessons/:lessonId/skill-context — cross-promotion data for a lesson.
 */
export const getLessonSkillContext = async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userId = await getUserIdFromRequest(req);

  // Find which bundles contain this lesson
  const bundleItems = await prisma.skillBundleItem.findMany({
    where: { lessonId },
    include: {
      bundle: {
        include: { professions: { include: { profession: true } } },
      },
    },
  });

  if (bundleItems.length === 0) {
    return res.json({ data: { bundles: [], skillLessons: [] } });
  }

  // Also check new skill lessons
  const skillLessons = await prisma.skillLesson.findMany({
    where: { lessonId },
    include: { skillTopic: { include: { profession: true } } },
  });

  const userItemProgresses: Record<string, UserSkillItemProgress> = {};
  if (userId) {
    const itemIds = bundleItems.map((i) => i.id);
    const progresses = await prisma.userSkillItemProgress.findMany({
      where: { userId, bundleItemId: { in: itemIds } },
    });
    for (const p of progresses) {
      userItemProgresses[p.bundleItemId] = p;
    }
  }

  return res.json({
    data: {
      bundles: bundleItems.map((item) => ({
        bundleId: item.bundleId,
        bundleName: item.bundle.name,
        itemId: item.id,
        activityType: item.activityType,
        professions: item.bundle.professions.map((bp) => ({
          id: bp.profession.id,
          name: bp.profession.name,
        })),
        userProgress: userItemProgresses[item.id] || null,
      })),
      skillLessons: skillLessons.map((sl) => ({
        skillLessonId: sl.id,
        topicName: sl.skillTopic.name,
        professionName: sl.skillTopic.profession.name,
      })),
    },
  });
};

// ─── NEW topic-based ─────────────────────────────────────────────────────────

/**
 * GET /skill/sections/:slug — get topics grouped by profession for a section.
 */
export const getSectionTopics = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const userId = await getUserIdFromRequest(req);

  const section = await prisma.skillSection.findUnique({ where: { slug } });
  if (!section) return res.status(404).json({ error: "Section not found" });

  const allSections = await prisma.skillSection.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
  });

  // Get all professions that have topics
  const professions = await prisma.profession.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      skillTopics: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: { where: { isActive: true } },
        },
      },
    },
  });

  // Enrich with user progress if authenticated
  const topicProgresses: Record<string, UserSkillTopicProgress> = {};
  if (userId) {
    const topicIds = professions.flatMap((p) => p.skillTopics.map((t) => t.id));
    const progresses = await prisma.userSkillTopicProgress.findMany({
      where: { userId, skillTopicId: { in: topicIds } },
    });
    for (const p of progresses) {
      topicProgresses[p.skillTopicId] = p;
    }
  }

  return res.json({
    data: {
      section: { 
        id: section.id, 
        slug: section.slug, 
        name: section.name,
        activityType: section.activityType,
        tabLabel: section.tabLabel
      },
      tabs: allSections.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        tabLabel: s.tabLabel || s.name,
        activityType: s.activityType,
        isActive: s.id === section.id,
      })),
      modeling_fountains: [],
      profession_groups: professions
        .filter((p) => p.skillTopics.length > 0)
        .map((p) => ({
          profession: {
            id: p.id,
            name: p.name,
            slug: p.slug,
            iconKey: p.iconKey,
          },
          topics: p.skillTopics.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            level: t.level,
            durationWeeks: t.durationWeeks,
            lessonsTotal: t.lessons.length,
            userProgress: topicProgresses[t.id] || null,
            subtopics: [
              {
                id: t.id + "-sub",
                name: "Lessons",
                description: null,
                orderIndex: 0,
                lessons: t.lessons.map(l => ({
                  id: l.id,
                  name: l.name,
                  difficulty: l.difficulty,
                  activityType: section.activityType,
                  lessonProgress: null // Optional: enrich with user skill lesson progress if needed
                }))
              }
            ]
          })),
        })),
    },
  });
};

/**
 * POST /skill/topics/:topicId/start — start a skill topic.
 */
export const startSkillTopic = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { topicId } = req.params;

  const topic = await prisma.skillTopic.findUnique({
    where: { id: topicId },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { orderIndex: "asc" },
        take: 1,
      },
    },
  });
  if (!topic) return res.status(404).json({ error: "Skill topic not found" });

  const lessonsTotal = await prisma.skillLesson.count({
    where: { skillTopicId: topicId, isActive: true },
  });

  await prisma.userSkillTopicProgress.upsert({
    where: { userId_skillTopicId: { userId, skillTopicId: topicId } },
    update: { lastAccessedAt: new Date() },
    create: {
      userId,
      skillTopicId: topicId,
      lessonsTotal,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    },
  });

  const firstLesson = topic.lessons[0];
  return res.json({
    data: {
      topicId,
      firstLessonId: firstLesson?.lessonId || null,
      skillLessonId: firstLesson?.id || null,
    },
  });
};

/**
 * GET /skill/me/recently-active-topic — most recently accessed skill topic.
 */
export const getRecentlyActiveTopic = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const recent = await prisma.userSkillTopicProgress.findFirst({
    where: { userId },
    orderBy: { lastAccessedAt: "desc" },
    include: {
      skillTopic: {
        include: { profession: true },
      },
    },
  });

  if (!recent) return res.json({ data: null });

  return res.json({
    data: {
      topicId: recent.skillTopicId,
      topicName: recent.skillTopic.name,
      professionName: recent.skillTopic.profession.name,
      completionPct: recent.completionPct,
      lessonsCompleted: recent.lessonsCompleted,
      lessonsTotal: recent.lessonsTotal,
      lastAccessedAt: recent.lastAccessedAt,
    },
  });
};
