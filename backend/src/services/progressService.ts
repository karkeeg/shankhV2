import { prisma } from "../prisma";
import { LessonStatus, SessionStatus, Prisma } from "@prisma/client";

type LessonWithActivities = Prisma.LessonGetPayload<{
  include: { lessonActivities: true; mcqActivity: true; canvasActivity: true; quantusActivity: true };
}>;

const buildAssignedActivityTypes = (lesson: LessonWithActivities) => {
  const activityTypes = lesson.lessonActivities.map((act) => act.activityType);
  if (activityTypes.length === 0) {
    if (lesson.mcqActivity) activityTypes.push("mcq");
    if (lesson.canvasActivity) activityTypes.push("canvas");
    if (lesson.quantusActivity) activityTypes.push("quantus");
  }
  return [...new Set(activityTypes)];
};

export const recalculateLessonProgress = async (userId: string, lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      lessonActivities: true,
      mcqActivity: true,
      canvasActivity: true,
      quantusActivity: true,
      subtopic: {
        include: {
          topic: {
            include: { module: true },
          },
        },
      },
    },
  });

  if (!lesson) return null;
  const assignedActivityTypes = buildAssignedActivityTypes(lesson);

  const [mcqSessions, canvasSessions, quantusSessions] = await Promise.all([
    lesson.mcqActivity
      ? prisma.userMcqSession.findMany({ where: { userId, activityId: lesson.mcqActivity.id } })
      : Promise.resolve([]),
    lesson.canvasActivity
      ? prisma.userCanvasSession.findMany({ where: { userId, activityId: lesson.canvasActivity.id } })
      : Promise.resolve([]),
    lesson.quantusActivity
      ? prisma.userQuantusSession.findMany({ where: { userId, activityId: lesson.quantusActivity.id } })
      : Promise.resolve([]),
  ]);

  const mcqBestScore = mcqSessions.length > 0 ? Math.max(...mcqSessions.map((session) => session.scorePct || 0)) : null;
  const canvasBestScore = canvasSessions.length > 0 ? Math.max(...canvasSessions.map((session) => session.scorePct || 0)) : null;
  const quantusAttempted = quantusSessions.length > 0;

  const completedTypes = new Set<string>();
  if (mcqSessions.length > 0) completedTypes.add("mcq");
  if (canvasSessions.length > 0) completedTypes.add("canvas");
  if (quantusSessions.length > 0) completedTypes.add("quantus");

  const hintsUsed =
    mcqSessions.reduce((sum, s) => sum + s.hintsUsed, 0) +
    canvasSessions.reduce((sum, s) => sum + s.hintsUsed, 0) +
    quantusSessions.reduce((sum, s) => sum + s.hintsUsed, 0);
  const lessonCompletionPct = assignedActivityTypes.length > 0 ? Math.round((completedTypes.size / assignedActivityTypes.length) * 100) : 0;
  const status = lessonCompletionPct === 100 ? LessonStatus.completed : lessonCompletionPct > 0 ? LessonStatus.in_progress : LessonStatus.not_started;

  const result = await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      lessonCompletionPct,
      mcqBestScore: mcqBestScore ?? undefined,
      canvasBestScore: canvasBestScore ?? undefined,
      quantusAttempted,
      status,
      hintsUsed,
      startedAt: lessonCompletionPct > 0 ? new Date() : undefined,
      completedAt: lessonCompletionPct === 100 ? new Date() : undefined,
      updatedAt: new Date(),
    },
    update: {
      lessonCompletionPct,
      mcqBestScore: mcqBestScore ?? undefined,
      canvasBestScore: canvasBestScore ?? undefined,
      quantusAttempted,
      status,
      hintsUsed,
      completedAt: lessonCompletionPct === 100 ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  await prisma.userLessonSession.updateMany({
    where: { userId, lessonId: lesson.id },
    data: {
      status: lessonCompletionPct === 100 ? SessionStatus.completed : SessionStatus.active,
      completedAt: lessonCompletionPct === 100 ? new Date() : undefined,
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  return result;
};

export const cascadeLessonProgress = async (userId: string, lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      subtopic: {
        include: {
          topic: { include: { module: true } },
          lessons: true,
        },
      },
    },
  });

  if (!lesson) return null;

  const subtopic = lesson.subtopic;
  const topic = subtopic.topic;
  const module = topic.module;

  const lessonProgresses = await prisma.userLessonProgress.findMany({ where: { userId, lessonId: { in: subtopic.lessons.map((item: any) => item.id) } } });
  const subtopicCompletionPct = subtopic.lessons.length > 0
    ? Math.round(lessonProgresses.reduce((sum, record) => sum + record.lessonCompletionPct, 0) / subtopic.lessons.length)
    : 0;
  const subtopicLessonsCompleted = lessonProgresses.filter((record) => record.lessonCompletionPct >= 100).length;
  const subtopicQuantusLessons = await prisma.lesson.count({ where: { subtopicId: subtopic.id, quantusActivity: { isNot: null } } });
  const subtopicQuantusAttempted = lessonProgresses.filter((record) => record.quantusAttempted).length;
  const subtopicRecallStrength = lessonProgresses.filter((record) => record.mcqBestScore !== null).length > 0
    ? Math.round(lessonProgresses.reduce((sum, record) => sum + (record.mcqBestScore || 0), 0) / lessonProgresses.filter((record) => record.mcqBestScore !== null).length)
    : 0;
  const subtopicConceptAccuracy = lessonProgresses.filter((record) => record.canvasBestScore !== null).length > 0
    ? Math.round(lessonProgresses.reduce((sum, record) => sum + (record.canvasBestScore || 0), 0) / lessonProgresses.filter((record) => record.canvasBestScore !== null).length)
    : 0;
  const subtopicApplicationScore = subtopicQuantusLessons > 0 ? Math.round((subtopicQuantusAttempted / subtopicQuantusLessons) * 100) : 0;

  const subtopicProgress = await prisma.userSubtopicProgress.upsert({
    where: { userId_subtopicId: { userId, subtopicId: subtopic.id } },
    create: {
      userId,
      subtopicId: subtopic.id,
      subtopicCompletionPct,
      recallStrength: subtopicRecallStrength,
      conceptAccuracy: subtopicConceptAccuracy,
      applicationScore: subtopicApplicationScore,
      lessonsCompleted: subtopicLessonsCompleted,
      lessonsTotal: subtopic.lessons.length,
      updatedAt: new Date(),
    },
    update: {
      subtopicCompletionPct,
      recallStrength: subtopicRecallStrength,
      conceptAccuracy: subtopicConceptAccuracy,
      applicationScore: subtopicApplicationScore,
      lessonsCompleted: subtopicLessonsCompleted,
      lessonsTotal: subtopic.lessons.length,
      updatedAt: new Date(),
    },
  });

  const topicSubtopics = await prisma.subtopic.findMany({ where: { topicId: topic.id, deletedAt: null } });
  const topicProgressRecords = await prisma.userSubtopicProgress.findMany({ where: { userId, subtopicId: { in: topicSubtopics.map((item) => item.id) } } });
  const topicCompletionPct = topicProgressRecords.length > 0
    ? Math.round(topicProgressRecords.reduce((sum, record) => sum + record.subtopicCompletionPct, 0) / topicProgressRecords.length)
    : 0;
  const topicRecallStrength = topicProgressRecords.length > 0
    ? Math.round(topicProgressRecords.reduce((sum, record) => sum + record.recallStrength, 0) / topicProgressRecords.length)
    : 0;
  const topicConceptAccuracy = topicProgressRecords.length > 0
    ? Math.round(topicProgressRecords.reduce((sum, record) => sum + record.conceptAccuracy, 0) / topicProgressRecords.length)
    : 0;
  const topicApplicationScore = topicProgressRecords.length > 0
    ? Math.round(topicProgressRecords.reduce((sum, record) => sum + record.applicationScore, 0) / topicProgressRecords.length)
    : 0;
  const topicLessonsCompleted = topicProgressRecords.reduce((sum, record) => sum + record.lessonsCompleted, 0);
  const topicLessonsTotal = topicProgressRecords.reduce((sum, record) => sum + record.lessonsTotal, 0);
  const topicSubtopicsCompleted = topicProgressRecords.filter((record) => record.subtopicCompletionPct >= 100).length;
  const topicSubtopicsTotal = topicSubtopics.length;

  const topicProgress = await prisma.userTopicProgress.upsert({
    where: { userId_topicId: { userId, topicId: topic.id } },
    create: {
      userId,
      topicId: topic.id,
      topicCompletionPct,
      recallStrength: topicRecallStrength,
      conceptAccuracy: topicConceptAccuracy,
      applicationScore: topicApplicationScore,
      lessonsCompleted: topicLessonsCompleted,
      lessonsTotal: topicLessonsTotal,
      subtopicsCompleted: topicSubtopicsCompleted,
      subtopicsTotal: topicSubtopicsTotal,
      lastAccessedAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      topicCompletionPct,
      recallStrength: topicRecallStrength,
      conceptAccuracy: topicConceptAccuracy,
      applicationScore: topicApplicationScore,
      lessonsCompleted: topicLessonsCompleted,
      lessonsTotal: topicLessonsTotal,
      subtopicsCompleted: topicSubtopicsCompleted,
      subtopicsTotal: topicSubtopicsTotal,
      lastAccessedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const moduleTopics = await prisma.topic.findMany({ where: { moduleId: module.id, deletedAt: null } });
  const moduleProgressRecords = await prisma.userTopicProgress.findMany({ where: { userId, topicId: { in: moduleTopics.map((item) => item.id) } } });
  const moduleCompletionPct = moduleProgressRecords.length > 0
    ? Math.round(moduleProgressRecords.reduce((sum, record) => sum + record.topicCompletionPct, 0) / moduleProgressRecords.length)
    : 0;
  const moduleRecallStrength = moduleProgressRecords.length > 0
    ? Math.round(moduleProgressRecords.reduce((sum, record) => sum + record.recallStrength, 0) / moduleProgressRecords.length)
    : 0;
  const moduleConceptAccuracy = moduleProgressRecords.length > 0
    ? Math.round(moduleProgressRecords.reduce((sum, record) => sum + record.conceptAccuracy, 0) / moduleProgressRecords.length)
    : 0;
  const moduleApplicationScore = moduleProgressRecords.length > 0
    ? Math.round(moduleProgressRecords.reduce((sum, record) => sum + record.applicationScore, 0) / moduleProgressRecords.length)
    : 0;

  const moduleTopicsStarted = moduleProgressRecords.filter((record) => record.topicCompletionPct > 0).length;
  const moduleTopicsTotal = moduleTopics.length;
  const moduleLessonsCompleted = moduleProgressRecords.reduce((sum, record) => sum + record.lessonsCompleted, 0);
  const moduleLessonsTotal = moduleProgressRecords.reduce((sum, record) => sum + record.lessonsTotal, 0);

  const moduleProgress = await prisma.userModuleProgress.upsert({
    where: { userId_moduleId: { userId, moduleId: module.id } },
    create: {
      userId,
      moduleId: module.id,
      moduleCompletionPct,
      recallStrength: moduleRecallStrength,
      conceptAccuracy: moduleConceptAccuracy,
      applicationScore: moduleApplicationScore,
      topicsStarted: moduleTopicsStarted,
      topicsTotal: moduleTopicsTotal,
      lessonsCompleted: moduleLessonsCompleted,
      lessonsTotal: moduleLessonsTotal,
      updatedAt: new Date(),
    },
    update: {
      moduleCompletionPct,
      recallStrength: moduleRecallStrength,
      conceptAccuracy: moduleConceptAccuracy,
      applicationScore: moduleApplicationScore,
      topicsStarted: moduleTopicsStarted,
      topicsTotal: moduleTopicsTotal,
      lessonsCompleted: moduleLessonsCompleted,
      lessonsTotal: moduleLessonsTotal,
      updatedAt: new Date(),
    },
  });

  return {
    lesson: await prisma.userLessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } } }),
    subtopic: subtopicProgress,
    topic: topicProgress,
    module: moduleProgress,
  };
};

export const recalculateAllUserProgress = async (userId: string) => {
  const lessons = await prisma.lesson.findMany({ select: { id: true } });
  for (const lesson of lessons) {
    await recalculateLessonProgress(userId, lesson.id);
    await cascadeLessonProgress(userId, lesson.id);
  }
};
