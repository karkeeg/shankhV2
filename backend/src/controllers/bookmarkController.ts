import { Request, Response } from "express";
import { prisma } from "../prisma";

// GET /api/v1/bookmarks/me/ids  — just the subtopicIds (for the learning page indicator)
export async function getMyBookmarkIds(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const bookmarks = await prisma.userBookmark.findMany({
    where: { userId },
    select: { subtopicId: true },
  });
  return res.json({ data: bookmarks.map((b) => b.subtopicId) });
}

// GET /api/v1/bookmarks/me  — full subtopic details for the bookmarks page
export async function getMyBookmarks(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const bookmarks = await prisma.userBookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      subtopic: {
        include: {
          lessons: {
            include: {
              lessonActivities: true,
              userLessonProgresses: {
                where: { userId },
              },
              lessonReactions: true,
            },
          },
          topic: {
            include: {
              module: true,
            },
          },
        },
      },
    },
  });

  return res.json({
    data: bookmarks.map((b) => ({
      subtopicId: b.subtopicId,
      name: b.subtopic.name,
      description: b.subtopic.description,
      type: b.subtopic.type,
      topic: b.subtopic.topic.name,
      topicId: b.subtopic.topic.id,
      topicDescription: b.subtopic.topic.description,
      topicSubtitle: b.subtopic.topic.subtitle,
      module: b.subtopic.topic.module.name,
      moduleSlug: b.subtopic.topic.module.slug,
      savedAt: b.createdAt,
      lessons: b.subtopic.lessons.map((lesson) => ({
        lessonId: lesson.id,
        name: lesson.name,
        description: lesson.description,
        difficulty: lesson.difficulty,
        status: lesson.userLessonProgresses[0]?.status ?? "not_started",
        activityTypes: lesson.lessonActivities.map((la) => la.activityType),
        likesCount: lesson.lessonReactions.filter((lr) => lr.reaction === "like").length,
        userReaction: lesson.lessonReactions.find((lr) => lr.userId === userId)?.reaction ?? null,
      })),
    })),
  });
}

// POST /api/v1/bookmarks/subtopics/:subtopicId  — toggle bookmark
export async function toggleBookmark(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { subtopicId } = req.params;

  const existing = await prisma.userBookmark.findUnique({
    where: { userId_subtopicId: { userId, subtopicId } },
  });

  if (existing) {
    await prisma.userBookmark.delete({ where: { id: existing.id } });
    return res.json({ data: { bookmarked: false, subtopicId } });
  } else {
    await prisma.userBookmark.create({ data: { userId, subtopicId } });
    return res.json({ data: { bookmarked: true, subtopicId } });
  }
}
