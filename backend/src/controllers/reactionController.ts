import { Request, Response } from "express";
import { prisma } from "../prisma";

// GET /api/v1/reactions/me/lessons
export async function getMyReactions(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const reactions = await prisma.lessonReaction.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      lesson: {
        include: {
          lessonActivities: true,
          userLessonProgresses: {
            where: { userId },
          },
          subtopic: {
            include: {
              topic: {
                include: {
                  module: true,
                },
              },
            },
          },
          lessonReactions: {
            where: { reaction: "like" },
          },
        },
      },
    },
  });

  const mapReaction = (r: (typeof reactions)[number]) => ({
    lessonId: r.lesson.id,
    name: r.lesson.name,
    description: r.lesson.description,
    difficulty: r.lesson.difficulty,
    status: r.lesson.userLessonProgresses[0]?.status ?? "not_started",
    activityTypes: r.lesson.lessonActivities.map((la) => la.activityType),
    likesCount: r.lesson.lessonReactions.length,
    subtopicId: r.lesson.subtopic.id,
    subtopicName: r.lesson.subtopic.name,
    subtopicDescription: r.lesson.subtopic.description,
    subtopicType: r.lesson.subtopic.type,
    topicId: r.lesson.subtopic.topic.id,
    topicName: r.lesson.subtopic.topic.name,
    topicDescription: r.lesson.subtopic.topic.description,
    topicSubtitle: r.lesson.subtopic.topic.subtitle,
    moduleName: r.lesson.subtopic.topic.module.name,
    moduleSlug: r.lesson.subtopic.topic.module.slug,
    source: r.source,
    reactedAt: r.updatedAt,
    reaction: r.reaction,
  });

  return res.json({
    data: {
      liked: reactions.filter((r) => r.reaction === "like").map(mapReaction),
      disliked: reactions.filter((r) => r.reaction === "dislike").map(mapReaction),
    },
  });
}

// GET /api/v1/reactions/lessons/:lessonId
export async function getLessonReactions(req: Request, res: Response) {
  const { lessonId } = req.params;
  const userId = (req as any).userId as string | undefined;

  const [likes, dislikes, userRecord] = await Promise.all([
    prisma.lessonReaction.count({ where: { lessonId, reaction: "like" } }),
    prisma.lessonReaction.count({ where: { lessonId, reaction: "dislike" } }),
    userId
      ? prisma.lessonReaction.findFirst({ where: { userId, lessonId } })
      : Promise.resolve(null),
  ]);

  return res.json({ data: { likes, dislikes, userReaction: userRecord?.reaction ?? null, source: userRecord?.source ?? null } });
}

// POST /api/v1/reactions/lessons/:lessonId
// Body: { reaction: "like" | "dislike" | null, source?: "lesson" | "test" }
export async function setLessonReaction(req: Request, res: Response) {
  const { lessonId } = req.params;
  const userId = (req as any).userId as string | undefined;
  const { reaction, source = "lesson" } = req.body as { reaction: "like" | "dislike" | null; source?: string };

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (reaction !== null && reaction !== "like" && reaction !== "dislike") {
    return res.status(400).json({ error: "reaction must be 'like', 'dislike', or null" });
  }

  const existing = await prisma.lessonReaction.findFirst({
    where: { userId, lessonId, source },
  });

  const effectiveReaction = existing?.reaction === reaction ? null : reaction;

  if (!effectiveReaction) {
    await prisma.lessonReaction.deleteMany({ where: { userId, lessonId, source } });
  } else {
    await prisma.lessonReaction.upsert({
      where: { userId_lessonId_source: { userId, lessonId, source } },
      create: { userId, lessonId, reaction: effectiveReaction, source },
      update: { reaction: effectiveReaction },
    });
  }

  const [likes, dislikes] = await Promise.all([
    prisma.lessonReaction.count({ where: { lessonId, reaction: "like" } }),
    prisma.lessonReaction.count({ where: { lessonId, reaction: "dislike" } }),
  ]);

  return res.json({ data: { likes, dislikes, userReaction: effectiveReaction } });
}
