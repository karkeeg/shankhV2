import { prisma } from "../prisma";
import { ActivityType } from "@prisma/client";

// ─── Shared threshold (single source of truth) ────────────────────────────────
export const PASS_THRESHOLD_PCT = 70;
export const COMPLETION_THRESHOLD_PCT = 70;

// ─── UTC date helpers ─────────────────────────────────────────────────────────

function utcDayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Recalculate lesson, subtopic, topic, and module progress for a given user and lesson.
 * All writes are wrapped in a single transaction to prevent partial updates.
 */
export async function cascadeLessonProgress(userId: string, lessonId: string) {
  // Read the lesson hierarchy outside the transaction (read-only, anchors the cascade)
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      subtopic: {
        include: {
          topic: { include: { module: true } },
          lessons: { where: { deletedAt: null, isActive: true } },
        },
      },
      mcqActivity: true,
      canvasActivity: true,
      quantusActivity: true,
    },
  });

  if (!lesson) {
    throw new Error(`Lesson not found: ${lessonId}`);
  }

  const subtopicId  = lesson.subtopic.id;
  const topicId     = lesson.subtopic.topic.id;
  const moduleId    = lesson.subtopic.topic.module.id;

  // All reads + writes inside one interactive transaction to prevent partial state
  await prisma.$transaction(async (tx) => {

    // ── Subtopic progress ────────────────────────────────────────────────────
    const subtopicLessons = lesson.subtopic.lessons.map((l) => l.id);
    const subtopicLessonProgress = await tx.userLessonProgress.findMany({
      where: { userId, lessonId: { in: subtopicLessons } },
    });
    const subtopicCompleted = subtopicLessonProgress.filter((p) => p.status === "completed").length;
    const subtopicTotal     = subtopicLessons.length;
    const totalCompletionPctSum = subtopicLessons.reduce((sum, lid) => {
      const prog = subtopicLessonProgress.find((p) => p.lessonId === lid);
      return sum + (prog?.lessonCompletionPct ?? 0);
    }, 0);
    const subtopicCompletionPct = subtopicTotal > 0 ? Math.round(totalCompletionPctSum / subtopicTotal) : 0;

    await tx.userSubtopicProgress.upsert({
      where:  { userId_subtopicId: { userId, subtopicId } },
      update: { subtopicCompletionPct, lessonsCompleted: subtopicCompleted, lessonsTotal: subtopicTotal },
      create: { userId, subtopicId, subtopicCompletionPct, lessonsCompleted: subtopicCompleted, lessonsTotal: subtopicTotal },
    });

    // ── Topic progress ───────────────────────────────────────────────────────
    const topicSubtopics = await tx.subtopic.findMany({
      where:  { topicId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    const topicSubtopicIds = topicSubtopics.map((st) => st.id);
    const topicProgresses  = await tx.userSubtopicProgress.findMany({
      where: { userId, subtopicId: { in: topicSubtopicIds } },
    });
    const topicCompletedSum  = topicProgresses.reduce((sum, p) => sum + p.subtopicCompletionPct, 0);
    const topicMaxSum        = topicSubtopicIds.length * 100;
    const topicCompletionPct = topicMaxSum > 0 ? Math.round((topicCompletedSum / topicMaxSum) * 100) : 0;
    const topicLessonsCompleted = topicProgresses.reduce((sum, p) => sum + p.lessonsCompleted, 0);
    const topicLessonsTotal     = topicProgresses.reduce((sum, p) => sum + p.lessonsTotal, 0);
    const subtopicsCompleted    = topicProgresses.filter((p) => p.subtopicCompletionPct === 100).length;

    await tx.userTopicProgress.upsert({
      where:  { userId_topicId: { userId, topicId } },
      update: { topicCompletionPct, lessonsCompleted: topicLessonsCompleted, lessonsTotal: topicLessonsTotal, subtopicsCompleted, subtopicsTotal: topicSubtopicIds.length },
      create: { userId, topicId, topicCompletionPct, lessonsCompleted: topicLessonsCompleted, lessonsTotal: topicLessonsTotal, subtopicsCompleted, subtopicsTotal: topicSubtopicIds.length },
    });

    // ── Module progress ──────────────────────────────────────────────────────
    const moduleTopics = await tx.topic.findMany({
      where:  { moduleId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    const moduleTopicIds       = moduleTopics.map((t) => t.id);
    const moduleTopicProgresses = await tx.userTopicProgress.findMany({
      where: { userId, topicId: { in: moduleTopicIds } },
    });
    const moduleCompletedSum  = moduleTopicProgresses.reduce((sum, p) => sum + p.topicCompletionPct, 0);
    const moduleMaxSum        = moduleTopicIds.length * 100;
    const moduleCompletionPct = moduleMaxSum > 0 ? Math.round((moduleCompletedSum / moduleMaxSum) * 100) : 0;
    const moduleLessonsCompleted = moduleTopicProgresses.reduce((sum, p) => sum + p.lessonsCompleted, 0);
    const moduleLessonsTotal     = moduleTopicProgresses.reduce((sum, p) => sum + p.lessonsTotal, 0);
    const topicsStarted          = moduleTopicProgresses.filter((p) => p.topicCompletionPct > 0).length;

    await tx.userModuleProgress.upsert({
      where:  { userId_moduleId: { userId, moduleId } },
      update: { moduleCompletionPct, lessonsCompleted: moduleLessonsCompleted, lessonsTotal: moduleLessonsTotal, topicsStarted, topicsTotal: moduleTopicIds.length },
      create: { userId, moduleId, moduleCompletionPct, lessonsCompleted: moduleLessonsCompleted, lessonsTotal: moduleLessonsTotal, topicsStarted, topicsTotal: moduleTopicIds.length },
    });
  });
}

/**
 * Update a user's skill test session progress.
 * Only counts responses that have been graded (scorePct !== null).
 */
export async function updateSkillTestSessionProgress(sessionId: string) {
  const responses = await prisma.userSkillTestResponse.findMany({
    where: { sessionId },
  });

  const gradedResponses = responses.filter((r) => r.scorePct !== null);
  const completedItems  = gradedResponses.length;
  const avgScorePct     = completedItems > 0
    ? Math.round(gradedResponses.reduce((acc, r) => acc + (r.scorePct ?? 0), 0) / completedItems)
    : null;

  return prisma.userSkillTestSession.update({
    where: { id: sessionId },
    data:  { completedItems, scorePct: avgScorePct },
  });
}

/**
 * Calculate the current consecutive day streak for a user (UTC-based).
 */
export async function calculateUserStreak(userId: string): Promise<number> {
  const streakRows = await prisma.userStreak.findMany({
    where:   { userId },
    orderBy: { date: "desc" },
    select:  { date: true },
  });

  if (streakRows.length === 0) return 0;

  let streak = 0;
  const expectedDate = utcDayStart();

  for (const row of streakRows) {
    const rowDate = utcDayStart(new Date(row.date));
    if (rowDate.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
    } else if (rowDate < expectedDate) {
      break; // gap — streak broken
    }
    // future date or duplicate — skip
  }
  return streak;
}

/**
 * Record today's streak entry (idempotent, UTC-based).
 * Called after each successful activity submission.
 */
export async function recordStreakDay(userId: string) {
  const today = utcDayStart();
  await prisma.userStreak.upsert({
    where:  { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });
}

/**
 * Recalculate all progress (lesson → subtopic → topic → module) for a user.
 */
export async function recalculateAllUserProgress(userId: string) {
  const userLessonProgresses = await prisma.userLessonProgress.findMany({
    where:  { userId },
    select: { lessonId: true },
  });

  for (const ulp of userLessonProgresses) {
    try {
      await cascadeLessonProgress(userId, ulp.lessonId);
    } catch {
      // Skip lessons that may have been deleted
    }
  }
}

/**
 * Recalculate lesson progress (completion percentage and status) based on
 * all registered activities in the lesson.
 */
export async function recalculateLessonProgress(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where:   { id: lessonId },
    include: {
      lessonActivities: true,
      mcqActivity:    { include: { questions: true } },
      canvasActivity: true,
      quantusActivity: true,
    },
  });

  if (!lesson) return;

  const activeTypes = lesson.lessonActivities.map((la) => la.activityType);
  if (activeTypes.length === 0) return;

  const progress = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  let totalStepsCount     = 0;
  let completedStepsCount = 0;
  let allActivitiesDone   = true;

  for (const type of activeTypes) {
    if (type === "mcq" && lesson.mcqActivity) {
      const qCount = lesson.mcqActivity.questions.length;
      totalStepsCount += qCount;

      const correctQuestions = await prisma.userMcqAnswer.groupBy({
        by:    ["questionId"],
        where: {
          session:   { userId, activityId: lesson.mcqActivity.id },
          isCorrect: true,
        },
      });

      const correctCount = correctQuestions.length;
      completedStepsCount += correctCount;
      if (correctCount !== qCount) allActivitiesDone = false;

    } else if (type === "canvas" && lesson.canvasActivity) {
      totalStepsCount += 1;
      const isCompleted = (progress?.canvasBestScore ?? 0) >= COMPLETION_THRESHOLD_PCT;
      if (isCompleted) completedStepsCount += 1; else allActivitiesDone = false;

    } else if (type === "quantus" && lesson.quantusActivity) {
      totalStepsCount += 1;
      const isCompleted = !!progress?.quantusAttempted;
      if (isCompleted) completedStepsCount += 1; else allActivitiesDone = false;
    }
  }

  const lessonCompletionPct = totalStepsCount > 0
    ? Math.round((completedStepsCount / totalStepsCount) * 100)
    : 0;
  const status = allActivitiesDone ? "completed" : "in_progress";

  await prisma.userLessonProgress.upsert({
    where:  { userId_lessonId: { userId, lessonId } },
    update: {
      status,
      lessonCompletionPct,
      completedAt: status === "completed" ? (progress?.completedAt ?? new Date()) : null,
    },
    create: {
      userId, lessonId, status, lessonCompletionPct,
      startedAt:   new Date(),
      completedAt: status === "completed" ? new Date() : null,
    },
  });
}
