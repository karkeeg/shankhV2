import { Request, Response } from "express";
import { prisma } from "../prisma";
import { cascadeLessonProgress } from "../services/progressService";

interface AnswerInput { question_id: string; selected_option_id: string; }
interface PlacementInput { item_id: string; placed_zone_id: string; }

const getActiveSession = async (userId: string) =>
  prisma.userLessonSession.findFirst({
    where: { userId, status: "active" },
    orderBy: { lastActiveAt: "desc" },
    include: {
      lesson: {
        include: {
          subtopic: { include: { topic: { include: { module: true } } } },
          mcqActivity: true,
          canvasActivity: true,
          quantusActivity: true,
        },
      },
    },
  });

export const getResume = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const session = await getActiveSession(userId);
  if (!session) return res.json({ data: null });

  const draftCount = await prisma.userActivityDraft.count({
    where: {
      userId,
      activityId: session.lesson.mcqActivity?.id || session.lesson.canvasActivity?.id || session.lesson.quantusActivity?.id,
      activityType: session.currentActivityType,
    },
  });

  return res.json({
    data: {
      lesson_name: session.lesson.name,
      subtopic_name: session.lesson.subtopic.name,
      topic_name: session.lesson.subtopic.topic.name,
      module_name: session.lesson.subtopic.topic.module.name,
      last_active_at: session.lastActiveAt.toISOString(),
      resume_at_activity: {
        activity_type: session.currentActivityType,
        draft_exists: draftCount > 0,
      },
    },
  });
};

export const startLessonSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { lessonId } = req.params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { lessonActivities: true, mcqActivity: true, canvasActivity: true, quantusActivity: true },
  });

  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const session = await prisma.userLessonSession.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: {
      userId,
      lessonId: lesson.id,
      currentActivityType:
        lesson.lessonActivities?.[0]?.activityType ||
        (lesson.mcqActivity ? "mcq" : lesson.canvasActivity ? "canvas" : "quantus"),
      status: "active",
      lastActiveAt: new Date(),
      startedAt: new Date(),
      updatedAt: new Date(),
    },
    update: {
      status: "active",
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  const activityTasks = [lesson.mcqActivity, lesson.canvasActivity, lesson.quantusActivity]
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const drafts = await prisma.userActivityDraft.findMany({
    where: { userId, activityId: { in: activityTasks.map((activity) => activity.id) } },
  });

  return res.status(201).json({
    data: {
      session_id: session.id,
      is_resume: false,
      resume_at: {
        activity_type: session.currentActivityType,
        draft_exists: drafts.some((draft) => draft.activityType === session.currentActivityType),
      },
      activities: activityTasks.map((activity) => ({
        activityType:
          activity.id === lesson.mcqActivity?.id
            ? "mcq"
            : activity.id === lesson.canvasActivity?.id
            ? "canvas"
            : "quantus",
        activityId: activity.id,
        draft_exists: drafts.some((draft) => draft.activityId === activity.id),
      })),
    },
  });
};

export const updateLessonSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { lessonId } = req.params;
  const { current_activity_type } = req.body;

  if (!current_activity_type) return res.status(400).json({ error: "current_activity_type is required" });

  const session = await prisma.userLessonSession.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const updated = await prisma.userLessonSession.update({
    where: { id: session.id },
    data: { currentActivityType: current_activity_type as import("@prisma/client").ActivityType, updatedAt: new Date(), lastActiveAt: new Date() },
  });

  return res.json({ data: updated });
};

const buildAnswerResults = async (answers: AnswerInput[]) => {
  const questionIds = answers.map((answer) => answer.question_id);
  const questions = await prisma.mcqQuestion.findMany({ where: { id: { in: questionIds } }, include: { options: true } });
  return answers.map((answer) => {
    const question = questions.find((q) => q.id === answer.question_id);
    const selected = question?.options.find((opt) => opt.id === answer.selected_option_id);
    return {
      question_id: answer.question_id,
      selected_option_id: answer.selected_option_id,
      is_correct: selected?.isCorrect || false,
    };
  });
};

export const submitMcqSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { activity_id, hints_used, answers } = req.body;

  if (!activity_id || !Array.isArray(answers)) {
    return res.status(400).json({ error: "activity_id and answers are required" });
  }

  const activity = await prisma.mcqActivity.findUnique({
    where: { id: activity_id },
    include: { lesson: { include: { subtopic: { include: { topic: { include: { module: true } } } }, lessonActivities: true } }, questions: { include: { options: true } } },
  });

  if (!activity) return res.status(404).json({ error: "MCQ activity not found" });

  const score = (answers as AnswerInput[]).reduce((sum: number, answer) => {
    const question = activity.questions.find((question) => question.id === answer.question_id);
    if (!question) return sum;
    const selectedOption = question.options.find((opt) => opt.id === answer.selected_option_id);
    return sum + (selectedOption?.isCorrect ? 1 : 0);
  }, 0);

  const total = answers.length;
  const scorePct = total > 0 ? Math.round((score / total) * 100) : 0;

  const session = await prisma.userMcqSession.create({
    data: {
      userId,
      activityId: activity.id,
      score,
      total,
      scorePct,
      hintsUsed: hints_used || 0,
      answers: {
        create: (answers as AnswerInput[]).map((answer) => ({
          questionId: answer.question_id,
          selectedOptionId: answer.selected_option_id,
          isCorrect: activity.questions.find((q) => q.id === answer.question_id)?.options.find((opt) => opt.id === answer.selected_option_id)?.isCorrect || false,
        })),
      },
    },
  });

  await prisma.userActivityDraft.deleteMany({ where: { userId, activityId: activity.id, activityType: "mcq" } });
  const progress = await cascadeLessonProgress(userId, activity.lessonId);
  const results = await buildAnswerResults(answers);

  return res.json({
    data: {
      session_id: session.id,
      score,
      total,
      score_pct: scorePct,
      results,
      draft_cleared: true,
      lesson_session: {
        lesson_completion_pct: progress?.lesson?.lessonCompletionPct || 0,
        all_activities_complete: (progress?.lesson?.lessonCompletionPct || 0) === 100,
        next_activity: null,
      },
      learning_progress: {
        subtopic_pct: progress?.subtopic.subtopicCompletionPct || 0,
        topic_pct: progress?.topic.topicCompletionPct || 0,
        module_pct: progress?.module.moduleCompletionPct || 0,
      },
      skill_progress: null,
    },
  });
};

export const submitCanvasSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { activity_id, hints_used, placements } = req.body;

  if (!activity_id || !Array.isArray(placements)) {
    return res.status(400).json({ error: "activity_id and placements are required" });
  }

  const activity = await prisma.canvasActivity.findUnique({
    where: { id: activity_id },
    include: { lesson: { include: { subtopic: { include: { topic: { include: { module: true } } } }, lessonActivities: true } }, items: true },
  });

  if (!activity) return res.status(404).json({ error: "Canvas activity not found" });

  const total = placements.length;
  const score = (placements as PlacementInput[]).filter((placement) => {
    const item = activity.items.find((item) => item.id === placement.item_id);
    return item?.correctZoneId === placement.placed_zone_id;
  }).length;
  const scorePct = total > 0 ? Math.round((score / total) * 100) : 0;

  const session = await prisma.userCanvasSession.create({
    data: {
      userId,
      activityId: activity.id,
      score,
      total,
      scorePct,
      hintsUsed: hints_used || 0,
      placements: {
        create: (placements as PlacementInput[]).map((placement) => ({
          itemId: placement.item_id,
          placedZoneId: placement.placed_zone_id,
          isCorrect: activity.items.find((item) => item.id === placement.item_id)?.correctZoneId === placement.placed_zone_id,
        })),
      },
    },
  });

  await prisma.userActivityDraft.deleteMany({ where: { userId, activityId: activity.id, activityType: "canvas" } });
  const progress = await cascadeLessonProgress(userId, activity.lessonId);

  return res.json({
    data: {
      session_id: session.id,
      score,
      total,
      score_pct: scorePct,
      results: placements,
      draft_cleared: true,
      lesson_session: {
        lesson_completion_pct: progress?.lesson?.lessonCompletionPct || 0,
        all_activities_complete: (progress?.lesson?.lessonCompletionPct || 0) === 100,
        next_activity: null,
      },
      learning_progress: {
        subtopic_pct: progress?.subtopic.subtopicCompletionPct || 0,
        topic_pct: progress?.topic.topicCompletionPct || 0,
        module_pct: progress?.module.moduleCompletionPct || 0,
      },
      skill_progress: null,
    },
  });
};

export const submitQuantusSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { activity_id, hints_used, input_snapshot } = req.body;

  if (!activity_id || !input_snapshot) {
    return res.status(400).json({ error: "activity_id and input_snapshot are required" });
  }

  const activity = await prisma.quantusActivity.findUnique({
    where: { id: activity_id },
    include: { lesson: { include: { subtopic: { include: { topic: { include: { module: true } } } }, lessonActivities: true } } },
  });

  if (!activity) return res.status(404).json({ error: "Quantus activity not found" });

  const score = 0;
  const total = 0;
  const scorePct = 0;

  const session = await prisma.userQuantusSession.create({
    data: {
      userId,
      activityId: activity.id,
      inputSnapshot: input_snapshot,
      score,
      total,
      scorePct,
      hintsUsed: hints_used || 0,
    },
  });

  await prisma.userActivityDraft.deleteMany({ where: { userId, activityId: activity.id, activityType: "quantus" } });
  const progress = await cascadeLessonProgress(userId, activity.lessonId);

  return res.json({
    data: {
      session_id: session.id,
      score,
      total,
      score_pct: scorePct,
      results: [],
      draft_cleared: true,
      lesson_session: {
        lesson_completion_pct: progress?.lesson?.lessonCompletionPct || 0,
        all_activities_complete: (progress?.lesson?.lessonCompletionPct || 0) === 100,
        next_activity: null,
      },
      learning_progress: {
        subtopic_pct: progress?.subtopic.subtopicCompletionPct || 0,
        topic_pct: progress?.topic.topicCompletionPct || 0,
        module_pct: progress?.module.moduleCompletionPct || 0,
      },
      skill_progress: null,
    },
  });
};
