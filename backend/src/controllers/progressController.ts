import { Request, Response } from "express";
import { prisma } from "../prisma";

export const getMeProgress = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const progress = await prisma.userModuleProgress.findMany({ where: { userId } });

  return res.json({ data: progress.map((record) => ({
    moduleId: record.moduleId,
    moduleCompletionPct: record.moduleCompletionPct,
    recallStrength: record.recallStrength,
    conceptAccuracy: record.conceptAccuracy,
    applicationScore: record.applicationScore,
  })) });
};

export const getModuleProgress = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { moduleId } = req.params;
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      topics: {
        where: { deletedAt: null, isActive: true },
        orderBy: { orderIndex: "asc" },
        include: { subtopics: { where: { deletedAt: null, isActive: true }, orderBy: { orderIndex: "asc" } } },
      },
    },
  });

  if (!module) return res.status(404).json({ error: "Module not found" });

  const topicIds = module.topics.map((topic) => topic.id);
  const subtopicIds = module.topics.flatMap((topic) => topic.subtopics.map((subtopic) => subtopic.id));
  const topicProgresses = await prisma.userTopicProgress.findMany({ where: { userId, topicId: { in: topicIds } } });
  const subtopicProgresses = await prisma.userSubtopicProgress.findMany({ where: { userId, subtopicId: { in: subtopicIds } } });

  return res.json({
    data: {
      moduleId,
      moduleName: module.name,
      topics: module.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        completionPct: topicProgresses.find((progress) => progress.topicId === topic.id)?.topicCompletionPct || 0,
      })),
      subtopics: module.topics.flatMap((topic) => topic.subtopics.map((subtopic) => ({
        id: subtopic.id,
        name: subtopic.name,
        completionPct: subtopicProgresses.find((progress) => progress.subtopicId === subtopic.id)?.subtopicCompletionPct || 0,
      }))),
    },
  });
};

export const getSubtopicProgress = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { subtopicId } = req.params;
  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
    include: { lessons: { where: { deletedAt: null, isActive: true }, orderBy: { orderIndex: "asc" } } },
  });

  if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

  const lessonProgresses = await prisma.userLessonProgress.findMany({ where: { userId, lessonId: { in: subtopic.lessons.map((lesson) => lesson.id) } } });
  const subtopicProgress = await prisma.userSubtopicProgress.findUnique({ where: { userId_subtopicId: { userId, subtopicId } } });

  return res.json({
    data: {
      subtopicId,
      subtopicName: subtopic.name,
      completionPct: subtopicProgress?.subtopicCompletionPct || 0,
      lessons: subtopic.lessons.map((lesson) => {
        const progress = lessonProgresses.find((item) => item.lessonId === lesson.id);
        return {
          id: lesson.id,
          name: lesson.name,
          difficulty: lesson.difficulty,
          status: progress?.status || "not_started",
          lessonCompletionPct: progress?.lessonCompletionPct || 0,
        };
      }),
    },
  });
};

export const revealHint = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { activity_type, activity_id } = req.body;
  if (!activity_type || !activity_id) return res.status(400).json({ error: "activity_type and activity_id are required" });

  const hints = await prisma.activityHint.findMany({
    where: { activityType: activity_type as import("@prisma/client").ActivityType, activityId: activity_id },
    orderBy: { orderIndex: "asc" },
  });
  if (hints.length === 0) return res.status(404).json({ error: "No hints available for this activity" });

  const revealedCount = await prisma.userHintUsage.count({
    where: { userId, hint: { activityId: activity_id, activityType: activity_type as import("@prisma/client").ActivityType } },
  });

  const nextHint = hints[revealedCount];
  if (!nextHint) return res.status(400).json({ error: "No more hints available" });

  await prisma.userHintUsage.create({ data: { userId, hintId: nextHint.id } });
  await prisma.userActivityDraft.updateMany({
    where: { userId, activityId: activity_id, activityType: activity_type as import("@prisma/client").ActivityType },
    data: { hintsRevealed: { increment: 1 }, lastSavedAt: new Date() },
  });

  return res.status(201).json({
    data: {
      hint_id: nextHint.id,
      hint_text: nextHint.hintText,
      index: nextHint.orderIndex,
      remaining: Math.max(0, hints.length - revealedCount - 1),
    },
  });
};

export const trackTelemetry = async (req: Request, res: Response) => {
  console.log("Telemetry event:", req.body);
  return res.status(201).json({ data: { success: true } });
};

const summaryCache = new Map<string, any>();

export const invalidateProgressSummaryCache = (userId: string) => {
  summaryCache.delete(userId);
};

export const getLearningProgressSummary = async (req: Request, res: Response) => {
  const userId = req.userId!;
  if (summaryCache.has(userId)) {
    return res.json({ data: summaryCache.get(userId) });
  }

  const modules = await prisma.module.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      topics: {
        where: { deletedAt: null, isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          subtopics: {
            where: { deletedAt: null, isActive: true },
            orderBy: { orderIndex: "asc" },
            include: {
              lessons: {
                where: { deletedAt: null, isActive: true },
              },
            },
          },
        },
      },
    },
  });

  const lessonProgresses = await prisma.userLessonProgress.findMany({
    where: { userId },
  });

  const completedLessonIds = new Set(
    lessonProgresses
      .filter((lp) => lp.status === "completed" || lp.lessonCompletionPct === 100)
      .map((lp) => lp.lessonId)
  );

  const result = modules.map((module) => {
    let moduleCompleted = 0;
    let moduleTotal = 0;

    const topicsData = module.topics.map((topic) => {
      let topicCompleted = 0;
      let topicTotal = 0;

      const subtopicsData = topic.subtopics.map((subtopic) => {
        const subtopicTotal = subtopic.lessons.length;
        const subtopicCompleted = subtopic.lessons.filter((l) => completedLessonIds.has(l.id)).length;
        const subtopicPct = subtopicTotal > 0 ? Math.round((subtopicCompleted / subtopicTotal) * 100) : 0;

        topicTotal += subtopicTotal;
        topicCompleted += subtopicCompleted;

        return {
          id: subtopic.id,
          name: subtopic.name,
          description: subtopic.description,
          completion_pct: subtopicPct,
          lessons_completed: subtopicCompleted,
          lessons_total: subtopicTotal,
        };
      });

      const topicPct = topicTotal > 0 ? Math.round((topicCompleted / topicTotal) * 100) : 0;

      moduleTotal += topicTotal;
      moduleCompleted += topicCompleted;

      return {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        completion_pct: topicPct,
        lessons_completed: topicCompleted,
        lessons_total: topicTotal,
        subtopics: subtopicsData,
      };
    });

    const modulePct = moduleTotal > 0 ? Math.round((moduleCompleted / moduleTotal) * 100) : 0;

    return {
      id: module.id,
      slug: module.slug,
      name: module.name,
      description: module.description,
      completion_pct: modulePct,
      lessons_completed: moduleCompleted,
      lessons_total: moduleTotal,
      topics: topicsData,
    };
  });

  summaryCache.set(userId, result);
  return res.json({ data: result });
};

export const getDashboardData = async (req: Request, res: Response) => {
  const userId = req.userId!;

  try {
    const { calculateUserStreak } = require("../services/progressService");
    const streak = await calculateUserStreak(userId);

    // Simulations: completed lessons count
    const simulations = await prisma.userLessonProgress.count({
      where: { userId, status: "completed" }
    });

    // Completed dates (formatted YYYY-MM-DD strings)
    const streaksList = await prisma.userStreak.findMany({
      where: { userId },
      select: { date: true }
    });
    const completedDates = streaksList.map(s => {
      const d = new Date(s.date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });

    // Modules Progress
    const modules = await prisma.module.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { orderIndex: "asc" },
      include: {
        userModuleProgresses: {
          where: { userId }
        }
      }
    });

    const modulesProgress = modules.map(m => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      completionPct: m.userModuleProgresses[0]?.moduleCompletionPct || 0,
      accentColor: m.accentColor
    }));

    // Calculate overall curriculum progress percentage
    const totalModules = modulesProgress.length;
    const overallProgressPct = totalModules > 0 
      ? Math.round(modulesProgress.reduce((sum, m) => sum + m.completionPct, 0) / totalModules)
      : 0;

    // Retrieve resume lesson details (DB Fallback)
    let resumeLesson = null;
    const inProgress = await prisma.userLessonProgress.findFirst({
      where: { userId, status: "in_progress" },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { module: true } } } } } } }
    });

    if (inProgress) {
      resumeLesson = {
        id: inProgress.lesson.id,
        title: inProgress.lesson.name,
        moduleName: inProgress.lesson.subtopic.topic.module.name,
        moduleSlug: inProgress.lesson.subtopic.topic.module.slug,
        subtopicName: inProgress.lesson.subtopic.name
      };
    } else {
      // Find the first lesson in the curriculum
      const firstModule = await prisma.module.findFirst({
        where: { deletedAt: null, isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          topics: {
            where: { deletedAt: null, isActive: true },
            orderBy: { orderIndex: "asc" },
            include: {
              subtopics: {
                where: { deletedAt: null, isActive: true },
                orderBy: { orderIndex: "asc" },
                include: {
                  lessons: {
                    where: { deletedAt: null, isActive: true },
                    orderBy: { orderIndex: "asc" }
                  }
                }
              }
            }
          }
        }
      });

      if (firstModule) {
        const firstTopic = firstModule.topics[0];
        if (firstTopic) {
          const firstSubtopic = firstTopic.subtopics[0];
          if (firstSubtopic) {
            const firstLesson = firstSubtopic.lessons[0];
            if (firstLesson) {
              resumeLesson = {
                id: firstLesson.id,
                title: firstLesson.name,
                moduleName: firstModule.name,
                moduleSlug: firstModule.slug,
                subtopicName: firstSubtopic.name
              };
            }
          }
        }
      }
    }

    // Fetch active professions — traverse the same hierarchy the skill page uses:
    // Profession → SkillTopic (isActive) → SkillTest (isActive + isPublished)
    // This guarantees dashboard counts are consistent with what the student actually sees.
    const professions = await prisma.profession.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
      include: {
        skillTopics: {
          where: { isActive: true },
          include: {
            tests: {
              where: { isActive: true, isPublished: true },
              include: {
                items: true,
                sessions: { where: { userId } },
              },
            },
          },
        },
      },
    });

    const professionsProgress = professions.map((p) => {
      // Flatten tests from active topics only — mirrors the skill page query path
      const tests = p.skillTopics.flatMap((t) => t.tests);

      // Count at the activity-session level (not whole-test level) so that
      // e.g. MCQ✓ + Canvas✓ + Quantus(in_progress) shows 2/3 done, not 0/1.
      let totalActivities = 0;
      let completedActivities = 0;
      let hasAnyStartedSession = false;

      for (const test of tests) {
        const types = Array.from(new Set(test.items.map((item) => item.activityType)));
        if (types.length === 0) continue;

        totalActivities += types.length;

        if (test.sessions.length > 0) hasAnyStartedSession = true;

        for (const type of types) {
          const done = test.sessions.some(
            (s) => s.activityType === type && (s.status === "completed" || s.status === "expired")
          );
          if (done) completedActivities++;
        }
      }

      const progressPct = totalActivities > 0
        ? Math.round((completedActivities / totalActivities) * 100)
        : 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        iconKey: p.iconKey,
        totalActivities,
        completedActivities,
        progressPct,
        hasStarted: hasAnyStartedSession,
      };
    });

    return res.json({
      data: {
        streak,
        simulations,
        completedDates,
        modulesProgress,
        overallProgressPct,
        resumeLesson,
        professionsProgress
      }
    });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

