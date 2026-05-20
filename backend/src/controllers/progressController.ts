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
