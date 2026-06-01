import { prisma } from "../prisma";
import { ActivityType } from "@prisma/client";

/**
 * Recalculate lesson, subtopic, topic, and module progress for a given user and lesson.
 * This follows the cascade steps outlined in the system documentation.
 */
export async function cascadeLessonProgress(userId: string, lessonId: string) {
  // Fetch the lesson hierarchy
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
    throw new Error("Lesson not found");
  }

  // ---- Subtopic progress ----
  const subtopicId = lesson.subtopic.id;
  const subtopicLessons = lesson.subtopic.lessons.map((l) => l.id);
  const subtopicLessonProgress = await prisma.userLessonProgress.findMany({
    where: { userId, lessonId: { in: subtopicLessons } },
  });
  const subtopicCompleted = subtopicLessonProgress.filter((p) => p.status === "completed").length;
  const subtopicTotal = subtopicLessons.length;
  const subtopicCompletionPct = subtopicTotal > 0 ? Math.round((subtopicCompleted / subtopicTotal) * 100) : 0;

  await prisma.userSubtopicProgress.upsert({
    where: { userId_subtopicId: { userId, subtopicId } },
    update: { subtopicCompletionPct, lessonsCompleted: subtopicCompleted, lessonsTotal: subtopicTotal },
    create: { userId, subtopicId, subtopicCompletionPct, lessonsCompleted: subtopicCompleted, lessonsTotal: subtopicTotal },
  });

  // ---- Topic progress ----
  const topicId = lesson.subtopic.topic.id;
  const topicSubtopics = await prisma.subtopic.findMany({
    where: { topicId, deletedAt: null, isActive: true },
    select: { id: true },
  });
  const topicSubtopicIds = topicSubtopics.map((st) => st.id);
  const topicProgresses = await prisma.userSubtopicProgress.findMany({
    where: { userId, subtopicId: { in: topicSubtopicIds } },
  });
  const topicCompletedSum = topicProgresses.reduce((sum, p) => sum + p.subtopicCompletionPct, 0);
  const topicMaxSum = topicSubtopicIds.length * 100; // each subtopic max 100
  const topicCompletionPct = topicMaxSum > 0 ? Math.round((topicCompletedSum / topicMaxSum) * 100) : 0;

  // Count lesson totals across all subtopics in the topic
  const topicLessonsCompleted = topicProgresses.reduce((sum, p) => sum + p.lessonsCompleted, 0);
  const topicLessonsTotal = topicProgresses.reduce((sum, p) => sum + p.lessonsTotal, 0);
  const subtopicsCompleted = topicProgresses.filter((p) => p.subtopicCompletionPct === 100).length;

  await prisma.userTopicProgress.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: {
      topicCompletionPct,
      lessonsCompleted: topicLessonsCompleted,
      lessonsTotal: topicLessonsTotal,
      subtopicsCompleted,
      subtopicsTotal: topicSubtopicIds.length,
    },
    create: {
      userId, topicId, topicCompletionPct,
      lessonsCompleted: topicLessonsCompleted,
      lessonsTotal: topicLessonsTotal,
      subtopicsCompleted,
      subtopicsTotal: topicSubtopicIds.length,
    },
  });

  // ---- Module progress ----
  const moduleId = lesson.subtopic.topic.module.id;
  const moduleTopics = await prisma.topic.findMany({
    where: { moduleId, deletedAt: null, isActive: true },
    select: { id: true },
  });
  const moduleTopicIds = moduleTopics.map((t) => t.id);
  const moduleTopicProgresses = await prisma.userTopicProgress.findMany({
    where: { userId, topicId: { in: moduleTopicIds } },
  });
  const moduleCompletedSum = moduleTopicProgresses.reduce((sum, p) => sum + p.topicCompletionPct, 0);
  const moduleMaxSum = moduleTopicIds.length * 100;
  const moduleCompletionPct = moduleMaxSum > 0 ? Math.round((moduleCompletedSum / moduleMaxSum) * 100) : 0;

  const moduleLessonsCompleted = moduleTopicProgresses.reduce((sum, p) => sum + p.lessonsCompleted, 0);
  const moduleLessonsTotal = moduleTopicProgresses.reduce((sum, p) => sum + p.lessonsTotal, 0);
  const topicsStarted = moduleTopicProgresses.filter((p) => p.topicCompletionPct > 0).length;

  await prisma.userModuleProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: {
      moduleCompletionPct,
      lessonsCompleted: moduleLessonsCompleted,
      lessonsTotal: moduleLessonsTotal,
      topicsStarted,
      topicsTotal: moduleTopicIds.length,
    },
    create: {
      userId, moduleId, moduleCompletionPct,
      lessonsCompleted: moduleLessonsCompleted,
      lessonsTotal: moduleLessonsTotal,
      topicsStarted,
      topicsTotal: moduleTopicIds.length,
    },
  });
}

/**
 * Bridge lesson activity results to skill progress.
 * Upserts UserSkillItemProgress and recalculates the bundle's aggregate completion.
 *
 * Schema fields (UserSkillItemProgress):
 *   bundleItemId, bestScorePct (Float?), isCompleted, hintsUsed, attempts
 * Schema fields (UserSkillBundleProgress):
 *   bundleId, itemsCompleted, itemsTotal, completionPct
 */
export async function updateSkillProgress(
  userId: string,
  lessonId: string,
  activityType: string,
  scorePct: number
) {
  // Find the related SkillBundleItem (if any)
  const bundleItem = await prisma.skillBundleItem.findFirst({
    where: { lessonId, activityType: activityType as ActivityType },
  });

  if (!bundleItem) {
    // No linked skill item – nothing to update.
    return;
  }

  // Upsert the user's best score for this item (keep highest).
  const existing = await prisma.userSkillItemProgress.findUnique({
    where: { userId_bundleItemId: { userId, bundleItemId: bundleItem.id } },
  });

  const newBest = existing?.bestScorePct != null
    ? Math.max(existing.bestScorePct, scorePct)
    : scorePct;
  const isCompleted = newBest >= 70;

  await prisma.userSkillItemProgress.upsert({
    where: { userId_bundleItemId: { userId, bundleItemId: bundleItem.id } },
    update: {
      bestScorePct: newBest,
      isCompleted,
      attempts: { increment: 1 },
      completedAt: isCompleted ? new Date() : undefined,
    },
    create: {
      userId,
      bundleItemId: bundleItem.id,
      bestScorePct: scorePct,
      isCompleted,
      attempts: 1,
      completedAt: isCompleted ? new Date() : undefined,
    },
  });

  // Recalculate the bundle progress.
  const bundleItems = await prisma.skillBundleItem.findMany({
    where: { bundleId: bundleItem.bundleId },
    select: { id: true },
  });
  const itemIds = bundleItems.map((i) => i.id);
  const userItemProgress = await prisma.userSkillItemProgress.findMany({
    where: { userId, bundleItemId: { in: itemIds } },
  });
  const itemsCompleted = userItemProgress.filter((p) => p.isCompleted).length;
  const itemsTotal = itemIds.length;
  const completionPct = itemsTotal > 0 ? Math.round((itemsCompleted / itemsTotal) * 100) : 0;

  await prisma.userSkillBundleProgress.upsert({
    where: { userId_bundleId: { userId, bundleId: bundleItem.bundleId } },
    update: { itemsCompleted, itemsTotal, completionPct, lastAccessedAt: new Date() },
    create: {
      userId,
      bundleId: bundleItem.bundleId,
      itemsCompleted,
      itemsTotal,
      completionPct,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    },
  });
}

/**
 * Calculate the current consecutive day streak for a user.
 * Uses the `UserStreak` table where each row represents a day the user was active.
 */
export async function calculateUserStreak(userId: string): Promise<number> {
  const streakRows = await prisma.userStreak.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (streakRows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const expectedDate = new Date(today);

  for (const row of streakRows) {
    const rowDate = new Date(row.date);
    rowDate.setHours(0, 0, 0, 0);
    if (rowDate.getTime() === expectedDate.getTime()) {
      streak++;
      // Move back one day for next iteration
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (rowDate < expectedDate) {
      // Gap detected – streak broken
      break;
    } else {
      // Future date or duplicate – ignore
      continue;
    }
  }
  return streak;
}

/**
 * Record today's streak entry (idempotent).
 * Called after each successful activity submission.
 */
export async function recordStreakDay(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.userStreak.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today },
  });
}

/**
 * Recalculate all progress (lesson → subtopic → topic → module) for a user.
 * Called from the admin recalculate endpoint.
 */
export async function recalculateAllUserProgress(userId: string) {
  // Get all lessons the user has progress on
  const userLessonProgresses = await prisma.userLessonProgress.findMany({
    where: { userId },
    select: { lessonId: true },
  });

  for (const ulp of userLessonProgresses) {
    try {
      await cascadeLessonProgress(userId, ulp.lessonId);
    } catch {
      // Skip lessons that may have been deleted
      continue;
    }
  }
}
