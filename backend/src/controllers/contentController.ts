import { Request, Response } from "express";
import { prisma } from "../prisma";
import { getUserIdFromRequest } from "../middleware/auth";
import { COMPLETION_THRESHOLD_PCT } from "../services/progressService";

export const getModules = async (req: Request, res: Response) => {
  const userId = await getUserIdFromRequest(req);
  const modules = await prisma.module.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      topics: {
        where: { deletedAt: null, isActive: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  const moduleProgresses = userId
    ? await prisma.userModuleProgress.findMany({ where: { userId, moduleId: { in: modules.map((module) => module.id) } } })
    : [];

  return res.json({
    data: modules.map((module) => {
      const progress = moduleProgresses.find((item) => item.moduleId === module.id);
      return {
        id: module.id,
        slug: module.slug,
        name: module.name,
        description: module.description,
        accentColor: module.accentColor,
        iconKey: module.iconKey,
        orderIndex: module.orderIndex,
        completionPercentage: progress?.moduleCompletionPct || 0,
        conceptAccuracy: progress?.conceptAccuracy || 0,
        recallStrength: progress?.recallStrength || 0,
        applicationScore: progress?.applicationScore || 0,
      };
    }),
  });
};

export const getModuleBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const userId = await getUserIdFromRequest(req);

  const module = await prisma.module.findFirst({
    where: { slug, deletedAt: null, isActive: true },
  });
  if (!module) return res.status(404).json({ error: "Module not found" });

  const progress = userId
    ? await prisma.userModuleProgress.findUnique({ where: { userId_moduleId: { userId, moduleId: module.id } } })
    : null;

  return res.json({
    data: {
      id: module.id,
      slug: module.slug,
      name: module.name,
      description: module.description,
      accentColor: module.accentColor,
      iconKey: module.iconKey,
      orderIndex: module.orderIndex,
      completionPercentage: progress?.moduleCompletionPct ?? 0,
      conceptAccuracy:      progress?.conceptAccuracy ?? 0,
      recallStrength:       progress?.recallStrength ?? 0,
      applicationScore:     progress?.applicationScore ?? 0,
    },
  });
};

export const getModuleTopics = async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const userId = await getUserIdFromRequest(req);
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      topics: {
        where: { deletedAt: null, isActive: true },
        orderBy: { orderIndex: "asc" },
        include: {
          subtopics: {
            where: { deletedAt: null, isActive: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!module) return res.status(404).json({ error: "Module not found" });

  const topicProgresses = userId
    ? await prisma.userTopicProgress.findMany({ where: { userId, topicId: { in: module.topics.map((topic) => topic.id) } } })
    : [];

  return res.json({
    data: module.topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      subtitle: topic.subtitle,
      description: topic.description,
      tags: topic.tags,
      type: topic.type,
      orderIndex: topic.orderIndex,
      subtopicsTotal: topic.subtopics.length,
      completionPercentage: topicProgresses.find((progress) => progress.topicId === topic.id)?.topicCompletionPct || 0,
    })),
  });
};

export const getTopic = async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const userId = await getUserIdFromRequest(req);
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { module: true },
  });

  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const progress = userId
    ? await prisma.userTopicProgress.findUnique({ where: { userId_topicId: { userId, topicId: topic.id } } })
    : null;

  return res.json({
    data: {
      id: topic.id,
      name: topic.name,
      subtitle: topic.subtitle,
      description: topic.description,
      tags: topic.tags,
      type: topic.type,
      module: { id: topic.module.id, name: topic.module.name, slug: topic.module.slug },
      completionPercentage: progress?.topicCompletionPct || 0,
      recallStrength: progress?.recallStrength || 0,
      conceptAccuracy: progress?.conceptAccuracy || 0,
      applicationScore: progress?.applicationScore || 0,
    },
  });
};

export const getTopicSubtopics = async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const userId = await getUserIdFromRequest(req);
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subtopics: {
        where: { deletedAt: null, isActive: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const subtopicIds = topic.subtopics.map((subtopic) => subtopic.id);
  const lessons = await prisma.lesson.findMany({
    where: { subtopicId: { in: subtopicIds }, deletedAt: null, isActive: true }
  });

  const lessonProgresses = userId
    ? await prisma.userLessonProgress.findMany({
        where: { userId, lessonId: { in: lessons.map((l) => l.id) }, status: "completed" }
      })
    : [];

  const subtopicProgresses = userId
    ? await prisma.userSubtopicProgress.findMany({ where: { userId, subtopicId: { in: subtopicIds } } })
    : [];

  return res.json({
    data: topic.subtopics.map((subtopic) => {
      const subtopicLessons = lessons.filter((l) => l.subtopicId === subtopic.id);
      const completedCount = lessonProgresses.filter((p) =>
        subtopicLessons.some((l) => l.id === p.lessonId)
      ).length;

      return {
        id: subtopic.id,
        name: subtopic.name,
        description: subtopic.description,
        type: subtopic.type,
        orderIndex: subtopic.orderIndex,
        completionPercentage: subtopicProgresses.find((progress) => progress.subtopicId === subtopic.id)?.subtopicCompletionPct || 0,
        lessonsTotal: subtopicLessons.length,
        lessonsCompleted: completedCount,
      };
    }),
  });
};

export const getSubtopic = async (req: Request, res: Response) => {
  const { subtopicId } = req.params;
  const userId = await getUserIdFromRequest(req);
  const subtopic = await prisma.subtopic.findUnique({
    where: { id: subtopicId },
    include: { topic: true },
  });

  if (!subtopic) return res.status(404).json({ error: "Subtopic not found" });

  const progress = userId
    ? await prisma.userSubtopicProgress.findUnique({ where: { userId_subtopicId: { userId, subtopicId: subtopic.id } } })
    : null;

  const lessons = await prisma.lesson.findMany({
    where: { subtopicId: subtopic.id, deletedAt: null, isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      lessonActivities: true,
      mcqActivity: { include: { questions: { select: { id: true } } } },
      canvasActivity: { select: { id: true } },
      quantusActivity: { select: { id: true } },
    },
  });

  const lessonProgresses = userId
    ? await prisma.userLessonProgress.findMany({ where: { userId, lessonId: { in: lessons.map((lesson) => lesson.id) } } })
    : [];

  // For MCQ completed steps, we need to check actual user sessions
  const mcqActivityIds = lessons
    .filter((l) => l.mcqActivity)
    .map((l) => l.mcqActivity!.id);
  const correctMcqAnswers = userId && mcqActivityIds.length > 0
    ? await prisma.userMcqAnswer.findMany({
        where: {
          session: { userId, activityId: { in: mcqActivityIds } },
          isCorrect: true,
        },
        select: { questionId: true, question: { select: { activityId: true } } },
      })
    : [];

  return res.json({
    data: {
      id: subtopic.id,
      name: subtopic.name,
      description: subtopic.description,
      type: subtopic.type,
      orderIndex: subtopic.orderIndex,
      topic: { id: subtopic.topic.id, name: subtopic.topic.name },
      completionPercentage: progress?.subtopicCompletionPct || 0,
      lessons: lessons.map((lesson) => {
        const lessonProg = lessonProgresses.find((prog) => prog.lessonId === lesson.id);
        const actTypes = lesson.lessonActivities.map((act) => act.activityType);

        // Calculate totalSteps: MCQ questions count individually, canvas/quantus = 1 each
        let totalSteps = 0;
        let completedSteps = 0;

        for (const type of actTypes) {
          if (type === "mcq" && lesson.mcqActivity) {
            const qCount = lesson.mcqActivity.questions.length;
            totalSteps += qCount;

            const correctCount = correctMcqAnswers.filter(
              (ans) => ans.question.activityId === lesson.mcqActivity!.id
            ).length;
            completedSteps += correctCount;

          } else if (type === "canvas") {
            totalSteps += 1;
            if (lessonProg?.canvasBestScore != null && lessonProg.canvasBestScore >= COMPLETION_THRESHOLD_PCT) {
              completedSteps += 1;
            }

          } else if (type === "quantus") {
            totalSteps += 1;
            if (lessonProg?.quantusAttempted) {
              completedSteps += 1;
            }
          }
        }

        return {
          id: lesson.id,
          name: lesson.name,
          description: lesson.description,
          difficulty: lesson.difficulty,
          status: lessonProg?.status || "not_started",
          lessonCompletionPct: lessonProg?.lessonCompletionPct || 0,
          activityTypes: actTypes,
          totalSteps,
          completedSteps,
        };
      }),
    },
  });
};

export const getSubtopicLessons = async (req: Request, res: Response) => {
  const { subtopicId } = req.params;
  const userId = await getUserIdFromRequest(req);
  const lessons = await prisma.lesson.findMany({
    where: { subtopicId, deletedAt: null, isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      lessonActivities: true,
      mcqActivity: { include: { questions: { select: { id: true } } } },
      canvasActivity: { select: { id: true } },
      quantusActivity: { select: { id: true } },
    },
  });

  const lessonProgresses = userId
    ? await prisma.userLessonProgress.findMany({ where: { userId, lessonId: { in: lessons.map((lesson) => lesson.id) } } })
    : [];

  const mcqActivityIds = lessons
    .filter((l) => l.mcqActivity)
    .map((l) => l.mcqActivity!.id);
  const correctMcqAnswers = userId && mcqActivityIds.length > 0
    ? await prisma.userMcqAnswer.findMany({
        where: {
          session: { userId, activityId: { in: mcqActivityIds } },
          isCorrect: true,
        },
        select: { questionId: true, question: { select: { activityId: true } } },
      })
    : [];

  return res.json({
    data: lessons.map((lesson) => {
      const lessonProg = lessonProgresses.find((prog) => prog.lessonId === lesson.id);
      const actTypes = lesson.lessonActivities.map((act) => act.activityType);

      let totalSteps = 0;
      let completedSteps = 0;

      for (const type of actTypes) {
        if (type === "mcq" && lesson.mcqActivity) {
          totalSteps += lesson.mcqActivity.questions.length;
          const correctCount = correctMcqAnswers.filter(
            (ans) => ans.question.activityId === lesson.mcqActivity!.id
          ).length;
          completedSteps += correctCount;
        } else if (type === "canvas") {
          totalSteps += 1;
          if (lessonProg?.canvasBestScore != null && lessonProg.canvasBestScore >= COMPLETION_THRESHOLD_PCT) {
            completedSteps += 1;
          }
        } else if (type === "quantus") {
          totalSteps += 1;
          if (lessonProg?.quantusAttempted) {
            completedSteps += 1;
          }
        }
      }

      return {
        id: lesson.id,
        name: lesson.name,
        difficulty: lesson.difficulty,
        status: lessonProg?.status || "not_started",
        lessonCompletionPct: lessonProg?.lessonCompletionPct || 0,
        activityTypes: actTypes,
        totalSteps,
        completedSteps,
      };
    }),
  });
};

const buildHintSummary = async (activityId: string, activityType: string, userId?: string) => {
  const totalHints = await prisma.activityHint.count({ where: { activityId, activityType: activityType as import("@prisma/client").ActivityType } });
  const revealedCount = userId
    ? await prisma.userHintUsage.count({
        where: {
          hint: { activityId, activityType: activityType as import("@prisma/client").ActivityType },
          userId,
        },
      })
    : 0;

  return {
    totalHints,
    revealedCount,
    nextRevealIndex: Math.min(revealedCount + 1, totalHints),
  };
};

export const getLessonDetail = async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userId = await getUserIdFromRequest(req);
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      lessonActivities: {
        orderBy: { orderIndex: "asc" },
      },
      mcqActivity: { include: { questions: { include: { options: true } } } },
      canvasActivity: { include: { tokens: { orderBy: { orderIndex: "asc" } } } },
      quantusActivity: { include: { columnGroups: true, columns: true, quantusCells: true } },
      subtopic: { include: { topic: true } },
    },
  });

  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  let activitiesCompleted = 0;
  if (userId) {
    const ulp = await prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (ulp) {
      if (lesson.mcqActivity && ulp.mcqBestScore !== null) activitiesCompleted++;
      if (lesson.canvasActivity && ulp.canvasBestScore !== null) activitiesCompleted++;
      if (lesson.quantusActivity && ulp.quantusAttempted) activitiesCompleted++;
    }
  }

  const activitiesList = lesson.lessonActivities.map((act) => {
    let activityId = "";
    if (act.activityType === "mcq") activityId = lesson.mcqActivity?.id || "";
    if (act.activityType === "canvas") activityId = lesson.canvasActivity?.id || "";
    if (act.activityType === "quantus") activityId = lesson.quantusActivity?.id || "";
    return {
      type: act.activityType,
      activity_id: activityId,
      order_index: act.orderIndex,
    };
  });

  const activitiesData: Record<string, unknown> = {
    mcq: null,
    canvas: null,
    quantus: null,
  };

  if (lesson.mcqActivity) {
    const hintsCount = await prisma.activityHint.count({ where: { activityId: lesson.mcqActivity.id, activityType: "mcq" } });
    activitiesData.mcq = {
      id: lesson.mcqActivity.id,
      title: lesson.mcqActivity.title,
      instructions: lesson.mcqActivity.instructions,
      context: lesson.mcqActivity.context,
      hintsCount,
      questions: lesson.mcqActivity.questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        explanation: question.explanation,
        orderIndex: question.orderIndex,
        options: question.options.map((option) => ({
          id: option.id,
          label: option.optionText,
          isCorrect: option.isCorrect,
        })),
      })),
    };
  }

  if (lesson.canvasActivity) {
    const hintsCount = await prisma.activityHint.count({ where: { activityId: lesson.canvasActivity.id, activityType: "canvas" } });
    activitiesData.canvas = {
      id: lesson.canvasActivity.id,
      title: lesson.canvasActivity.title,
      instructions: lesson.canvasActivity.instructions,
      context: lesson.canvasActivity.context,
      hintsCount,
      assemblyMode: lesson.canvasActivity.assemblyMode,
      scoringMode: lesson.canvasActivity.scoringMode,
      tokens: lesson.canvasActivity.tokens,
    };
  }

  if (lesson.quantusActivity) {
    const hintsCount = await prisma.activityHint.count({ where: { activityId: lesson.quantusActivity.id, activityType: "quantus" } });
    activitiesData.quantus = {
      id: lesson.quantusActivity.id,
      title: lesson.quantusActivity.title,
      instructions: lesson.quantusActivity.instructions,
      context: lesson.quantusActivity.context,
      hintsCount,
      columnGroups: lesson.quantusActivity.columnGroups,
      columns: lesson.quantusActivity.columns,
      quantusCells: lesson.quantusActivity.quantusCells,
    };
  }

  return res.json({
    data: {
      id: lesson.id,
      name: lesson.name,
      description: lesson.description,
      difficulty: lesson.difficulty,
      topic: { id: lesson.subtopic.topic.id, name: lesson.subtopic.topic.name },
      subtopic: { id: lesson.subtopic.id, name: lesson.subtopic.name },
      activities: activitiesList,
      activities_total: lesson.lessonActivities.length,
      activities_completed: activitiesCompleted,
      activitiesData,
    },
  });
};

export const getLessonHints = async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const activityType = String(req.query.activity_type || "");
  if (!activityType) return res.status(400).json({ error: "activity_type query parameter is required" });

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      mcqActivity: true,
      canvasActivity: true,
      quantusActivity: true,
    },
  });
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const activityId =
    activityType === "mcq" ? lesson.mcqActivity?.id :
    activityType === "canvas" ? lesson.canvasActivity?.id :
    activityType === "quantus" ? lesson.quantusActivity?.id :
    undefined;

  if (!activityId) return res.status(404).json({ error: "Activity not found for this lesson" });

  const data = await buildHintSummary(activityId, activityType, (await getUserIdFromRequest(req)) ?? undefined);
  return res.json({ data });
};