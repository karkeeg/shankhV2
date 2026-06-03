import { Request, Response } from "express";
import { prisma } from "../prisma";
import { ActivityType } from "@prisma/client";
import { cascadeLessonProgress, recordStreakDay, recalculateLessonProgress } from "../services/progressService";
import { invalidateProgressSummaryCache } from "./progressController";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Grade MCQ answers against the correct options.
 * `total` is the number of *submitted* answers, not the total questions in the
 * activity — cards are shown one per question so each submit is independent.
 */
function gradeMcq(
  questions: { id: string; options: { id: string; isCorrect: boolean }[] }[],
  answers: { questionId: string; selectedOptionId: string }[]
) {
  let correct = 0;
  const total = answers.length;          // grade only what was submitted
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));
  for (const q of questions) {
    const correctOption = q.options.find((o) => o.isCorrect);
    if (!correctOption) continue;
    const selected = answerMap.get(q.id);
    if (selected && selected === correctOption.id) correct++;
  }
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, accuracy };
}

// ─── Session lifecycle ───────────────────────────────────────────────────────

/**
 * GET /session/me/resume — return the user's most recent in-progress lesson session.
 */
export const getResume = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const session = await prisma.userLessonSession.findFirst({
    where: { userId, status: "active" },
    orderBy: { lastActiveAt: "desc" },
    include: {
      lesson: {
        include: {
          subtopic: { include: { topic: { include: { module: true } } } },
          lessonActivities: { orderBy: { orderIndex: "asc" } },
        },
      },
    },
  });

  if (!session) {
    return res.json({ data: null });
  }

  return res.json({
    data: {
      lessonId: session.lessonId,
      lessonName: session.lesson.name,
      moduleName: session.lesson.subtopic.topic.module.name,
      moduleSlug: session.lesson.subtopic.topic.module.slug,
      subtopicName: session.lesson.subtopic.name,
      currentActivityType: session.currentActivityType,
      activityOrder: session.activityOrder,
      lastActiveAt: session.lastActiveAt,
    },
  });
};


export const getActivity = async (req: Request, res: Response) => {
  const { id: lessonId } = req.params;
  const userId = req.userId!;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      subtopic: { include: { topic: { include: { module: true } } } },
      lessonActivities: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const steps: object[] = [];

  // Fetch each activity + the user's best session for that activity in parallel
  const [mcqActivity, canvasActivity, quantusActivity] = await Promise.all([
    prisma.mcqActivity.findUnique({
      where: { lessonId },
      include: { questions: { include: { options: true } } },
    }),
    prisma.canvasActivity.findUnique({
      where: { lessonId },
      include: { tokens: { orderBy: { orderIndex: "asc" } } },
    }),
    prisma.quantusActivity.findUnique({
      where: { lessonId },
      include: {
        columns: { orderBy: { colIndex: "asc" } },
        quantusCells: true,
        columnGroups: { orderBy: { orderIndex: "asc" } },
      },
    }),
  ]);

  // Best sessions per type (for completion state on reload)
  const [canvasBest, quantusBest] = await Promise.all([
    canvasActivity
      ? prisma.userCanvasSession.findFirst({
          where: { userId, activityId: canvasActivity.id },
          orderBy: { scorePct: "desc" },
        })
      : null,
    quantusActivity
      ? prisma.userQuantusSession.findFirst({
          where: { userId, activityId: quantusActivity.id },
          orderBy: { scorePct: "desc" },
        })
      : null,
  ]);

  // Fetch all MCQ answers for this user & activity, ordered by completedAt descending
  const mcqAnswers = mcqActivity
    ? await prisma.userMcqAnswer.findMany({
        where: {
          session: { userId, activityId: mcqActivity.id },
        },
        orderBy: {
          session: { completedAt: "desc" },
        },
      })
    : [];

  const mcqMergedAnswers: typeof mcqAnswers = [];
  if (mcqActivity) {
    for (const q of mcqActivity.questions) {
      const qAnswers = mcqAnswers.filter((a) => a.questionId === q.id);
      if (qAnswers.length > 0) {
        // Prefer correct answer if exists, otherwise take latest
        const correctAnswer = qAnswers.find((a) => a.isCorrect);
        mcqMergedAnswers.push(correctAnswer || qAnswers[0]);
      }
    }
  }

  const allMcqCorrect = mcqActivity && mcqActivity.questions.length > 0
    ? mcqMergedAnswers.filter((a) => a.isCorrect).length === mcqActivity.questions.length
    : false;

  // Drafts per type (for keeping work in progress on reload)
  const [mcqDraft, canvasDraft, quantusDraft] = await Promise.all([
    mcqActivity
      ? prisma.userActivityDraft.findUnique({
          where: { userId_activityId_activityType: { userId, activityId: mcqActivity.id, activityType: "mcq" } },
        })
      : null,
    canvasActivity
      ? prisma.userActivityDraft.findUnique({
          where: { userId_activityId_activityType: { userId, activityId: canvasActivity.id, activityType: "canvas" } },
        })
      : null,
    quantusActivity
      ? prisma.userActivityDraft.findUnique({
          where: { userId_activityId_activityType: { userId, activityId: quantusActivity.id, activityType: "quantus" } },
        })
      : null,
  ]);

  for (const la of lesson.lessonActivities) {
    if (la.activityType === "mcq" && mcqActivity) {
      steps.push({
        type: "mcq",
        orderIndex: la.orderIndex,
        data: mcqActivity,
        completedByUser: allMcqCorrect,
        bestScore: mcqActivity.questions.length > 0 ? Math.round((mcqMergedAnswers.filter(a => a.isCorrect).length / mcqActivity.questions.length) * 100) : 0,
        submittedAnswers: mcqMergedAnswers,
        draft: mcqDraft?.draftState || null,
      });
    } else if (la.activityType === "canvas" && canvasActivity) {
      // Group tokens by role for sidebar display
      const tokensByRole: Record<string, typeof canvasActivity.tokens> = {};
      for (const tk of canvasActivity.tokens) {
        const role = tk.tokenRole;
        if (!tokensByRole[role]) tokensByRole[role] = [];
        tokensByRole[role].push(tk);
      }

      // Build sidebar categories from token roles
      const roleLabels: Record<string, string> = {
        operand: "Operands",
        operator: "Operators",
        relation: "Relations",
        result: "Results",
      };
      const draggableElements = Object.entries(tokensByRole).map(([role, tokens]) => ({
        category: roleLabels[role] || role,
        items: tokens.map((tk) => ({
          id: tk.id,
          type: tk.shape === "diamond" ? "diamond" as const
            : tk.shape === "ellipse" ? "ellipse" as const
            : tk.shape === "pill" ? "equation" as const
            : "rectangle" as const,
          label: tk.displayText,
          content: tk.displayText,
        })),
      }));

      steps.push({
        type: "canvas",
        orderIndex: la.orderIndex,
        data: {
          id: canvasActivity.id,
          title: canvasActivity.title,
          instructions: canvasActivity.instructions,
          context: canvasActivity.context,
          assemblyMode: canvasActivity.assemblyMode,
          scoringMode: canvasActivity.scoringMode,
          tokens: canvasActivity.tokens.map((tk) => ({
            id: tk.id,
            displayText: tk.displayText,
            tokenRole: tk.tokenRole,
            shape: tk.shape,
            isDistractor: tk.isDistractor,
          })),
          draggableElements,
          // solutionEdges intentionally omitted — grading is server-side only
        },
        completedByUser: (canvasBest?.scorePct ?? 0) >= 70,
        bestScore: canvasBest?.scorePct ?? 0,
        submittedCanvasData: canvasBest?.canvasData || null,
        draft: canvasDraft?.draftState || null,
      });
    } else if (la.activityType === "quantus" && quantusActivity) {
      const columns = quantusActivity.columns || [];
      const colLabels = columns.map(c => c.label);
      const rowIndices = Array.from(new Set((quantusActivity.quantusCells || []).map(c => c.rowIndex))).sort((a, b) => a - b);
      const gridRows = rowIndices.map(r => String(r));
      const gridValues: Record<string, string> = {};
      const correctAnswers: Record<string, string> = {};

      (quantusActivity.quantusCells || []).forEach(cell => {
        const colLabel = columns[cell.colIndex]?.label || String(cell.colIndex);
        const key = `${cell.rowIndex}-${colLabel}`;
        gridValues[key] = cell.displayValue || "";
        correctAnswers[key] = cell.expectedValue || "";
      });

      steps.push({
        type: "quantus",
        orderIndex: la.orderIndex,
        data: {
          ...quantusActivity,
          gridRows,
          gridCols: colLabels,
          gridValues,
          correctAnswers,
        },
        completedByUser: (quantusBest?.scorePct ?? 0) >= 70,
        bestScore: quantusBest?.scorePct ?? 0,
        submittedGrid: quantusBest?.inputSnapshot || null,
        draft: quantusDraft?.draftState || null,
      });
    }
  }

  return res.json({
    data: {
      lessonId: lesson.id,
      lessonName: lesson.name,
      difficulty: lesson.difficulty,
      moduleName: lesson.subtopic.topic.module.name,
      moduleSlug: lesson.subtopic.topic.module.slug,
      topicName: lesson.subtopic.topic.name,
      subtopicName: lesson.subtopic.name,
      steps,
    },
  });
};
/**
 * POST /session/me/lessons/:lessonId/session/start — begin or resume a lesson session.
 */
export const startLessonSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { lessonId } = req.params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { lessonActivities: { orderBy: { orderIndex: "asc" } } },
  });
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const activityOrder = lesson.lessonActivities.map((a) => a.activityType);
  const firstActivity = activityOrder[0] || "mcq";

  const session = await prisma.userLessonSession.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { status: "active", lastActiveAt: new Date() },
    create: {
      userId,
      lessonId,
      status: "active",
      currentActivityType: firstActivity,
      activityOrder,
      lastActiveAt: new Date(),
    },
  });

  // Mark lesson as in_progress if not yet started
  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { status: "in_progress", startedAt: new Date() },
    create: { userId, lessonId, status: "in_progress", startedAt: new Date() },
  });

  return res.json({ data: session });
};

/**
 * PATCH /session/me/lessons/:lessonId/session — update the current activity in the session.
 */
export const updateLessonSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { lessonId } = req.params;
  const { currentActivityType } = req.body as { currentActivityType?: string };

  const session = await prisma.userLessonSession.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const updated = await prisma.userLessonSession.update({
    where: { id: session.id },
    data: {
      currentActivityType: (currentActivityType || session.currentActivityType) as ActivityType,
      lastActiveAt: new Date(),
    },
  });

  return res.json({ data: updated });
};

// ─── Activity Submissions ────────────────────────────────────────────────────

/**
 * POST /session/me/sessions/mcq
 *
 * Schema: UserMcqSession { userId, activityId, score (Int), total (Int), scorePct, hintsUsed }
 *         UserMcqAnswer  { sessionId, questionId, selectedOptionId, isCorrect }
 */
export const submitMcqSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { lessonId, answers, hintsUsed } = req.body as {
    lessonId: string;
    answers: { questionId: string; selectedOptionId: string }[];
    hintsUsed?: number;
  };
  if (!lessonId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "lessonId and answers are required" });
  }

  // Fetch MCQ activity for the lesson
  const activity = await prisma.mcqActivity.findUnique({
    where: { lessonId },
    include: { questions: { include: { options: true } } },
  });
  if (!activity) {
    return res.status(404).json({ error: "MCQ activity not found for lesson" });
  }

  const { correct, total, accuracy } = gradeMcq(activity.questions, answers);

  // Build answer records for the relational create
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));
  const answerRecords = activity.questions
    .filter((q) => answerMap.has(q.id))
    .map((q) => {
      const selectedId = answerMap.get(q.id)!;
      const correctOption = q.options.find((o) => o.isCorrect);
      return {
        questionId: q.id,
        selectedOptionId: selectedId,
        isCorrect: correctOption?.id === selectedId,
      };
    });

  // Persist session record with nested answers
  const newSession = await prisma.userMcqSession.create({
    data: {
      userId,
      activityId: activity.id,
      score: correct,
      total,
      scorePct: accuracy,
      hintsUsed: hintsUsed || 0,
      answers: { create: answerRecords },
    },
  });

  // Update lesson progress
  const status = accuracy >= 70 ? "completed" : "in_progress";
  if (status === "completed") {
    await prisma.userActivityDraft.deleteMany({
      where: { userId, activityId: activity.id, activityType: "mcq" },
    });
  }
  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {
      mcqBestScore: accuracy,
    },
    create: {
      userId,
      lessonId,
      mcqBestScore: accuracy,
    },
  });

  // Re-calculate the aggregated lesson completion and status across all activities
  await recalculateLessonProgress(userId, lessonId);

  // Cascade progress up the hierarchy
  await cascadeLessonProgress(userId, lessonId);



  // Record streak day
  await recordStreakDay(userId);
  invalidateProgressSummaryCache(userId);

  return res.json({ data: { correct, total, accuracy, status, id: newSession.id } });
};

/**
 * POST /session/me/sessions/canvas
 *
 * Server-side structural graph validation.
 * Input: { lessonId, canvasData: { placedTokens: string[], edges: { from, to, slot? }[] } }
 */
export const submitCanvasSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { lessonId, canvasData, hintsUsed } = req.body as {
    lessonId: string;
    canvasData?: { placedTokens?: string[]; edges?: { from: string; to: string; slot?: string }[] };
    hintsUsed?: number;
  };
  if (!lessonId || !canvasData) {
    return res.status(400).json({ error: "lessonId and canvasData are required" });
  }

  // ── 1. Fetch activity with solution edges & tokens ──────────────────────
  const activity = await prisma.canvasActivity.findUnique({
    where: { lessonId },
    include: { solutionEdges: true, tokens: true },
  });
  if (!activity) {
    return res.status(404).json({ error: "Canvas activity not found for lesson" });
  }

  const userEdges = canvasData.edges ?? [];
  const userPlaced = new Set(canvasData.placedTokens ?? []);
  const correctEdges = activity.solutionEdges;

  // ── 2. Normalize edge into a comparison key ─────────────────────────────
  //   For commutative edges, also generate the swapped key.
  type EdgeKey = string;
  const makeKey = (from: string, to: string, slot?: string | null): EdgeKey =>
    `${from}→${to}${slot ? `:${slot}` : ""}`;

  // Build the correct-edge set (with commutative alternatives)
  const correctSet = new Set<EdgeKey>();
  const commutativePairs = new Map<EdgeKey, EdgeKey>(); // original → swapped
  for (const ce of correctEdges) {
    const key = makeKey(ce.fromTokenId, ce.toTokenId, ce.operandSlot);
    correctSet.add(key);
    if (ce.isCommutative && ce.operandSlot) {
      // Swap slots: left↔right and swap from/to
      const swappedSlot = ce.operandSlot === "left" ? "right" : "left";
      const swappedKey = makeKey(ce.toTokenId, ce.fromTokenId, swappedSlot);
      commutativePairs.set(swappedKey, key);
    }
  }

  // ── 3. Score: compare user edges against correct edges ──────────────────
  let matched = 0;
  let extra = 0;
  const matchedCorrectKeys = new Set<EdgeKey>();

  for (const ue of userEdges) {
    const key = makeKey(ue.from, ue.to, ue.slot);
    const keyNoSlot = makeKey(ue.from, ue.to, null);

    if (correctSet.has(key) && !matchedCorrectKeys.has(key)) {
      matched++;
      matchedCorrectKeys.add(key);
    } else if (correctSet.has(keyNoSlot) && !matchedCorrectKeys.has(keyNoSlot)) {
      matched++;
      matchedCorrectKeys.add(keyNoSlot);
    } else if (commutativePairs.has(key)) {
      const origKey = commutativePairs.get(key)!;
      if (!matchedCorrectKeys.has(origKey)) {
        matched++;
        matchedCorrectKeys.add(origKey);
      } else {
        extra++;
      }
    } else {
      extra++;
    }
  }

  // Check for distractor tokens placed — each counts as an extra penalty
  const distractorIds = new Set(activity.tokens.filter(t => t.isDistractor).map(t => t.id));
  for (const pid of userPlaced) {
    if (distractorIds.has(pid)) extra++;
  }

  const totalCorrect = correctEdges.length;
  const penaltyWeight = activity.penaltyWeight;
  const rawScore = totalCorrect > 0
    ? (matched / totalCorrect - penaltyWeight * extra / totalCorrect) * 100
    : 0;
  const scorePct = Math.round(Math.max(0, Math.min(100, rawScore)));

  // ── 4. Persist session ──────────────────────────────────────────────────
  const newSession = await prisma.userCanvasSession.create({
    data: {
      userId,
      activityId: activity.id,
      score: matched,
      total: totalCorrect,
      scorePct,
      canvasData: canvasData as object,
      hintsUsed: hintsUsed || 0,
    },
  });

  // ── 5. Cascade progress ─────────────────────────────────────────────────
  const passThreshold = activity.passThreshold;
  const status = scorePct >= passThreshold ? "completed" : "in_progress";
  if (status === "completed") {
    await prisma.userActivityDraft.deleteMany({
      where: { userId, activityId: activity.id, activityType: "canvas" },
    });
  }
  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {
      canvasBestScore: scorePct,
    },
    create: {
      userId,
      lessonId,
      canvasBestScore: scorePct,
    },
  });

  // Re-calculate the aggregated lesson completion and status across all activities
  await recalculateLessonProgress(userId, lessonId);

  await cascadeLessonProgress(userId, lessonId);

  await recordStreakDay(userId);
  invalidateProgressSummaryCache(userId);

  return res.json({
    data: {
      matched,
      extra,
      totalCorrect,
      scorePct,
      status,
      passed: scorePct >= passThreshold,
      id: newSession.id,
    },
  });
};

/**
 * POST /session/me/sessions/quantus
 *
 * Schema: UserQuantusSession { userId, activityId, inputSnapshot (Json), score (Int), total (Int), scorePct, hintsUsed }
 */
export const submitQuantusSession = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { lessonId, score, total, inputSnapshot, hintsUsed } = req.body as {
    lessonId: string;
    score: number;
    total?: number;
    inputSnapshot?: unknown;
    hintsUsed?: number;
  };
  if (!lessonId || typeof score !== "number") {
    return res.status(400).json({ error: "lessonId and numeric score are required" });
  }

  const activity = await prisma.quantusActivity.findUnique({ where: { lessonId } });
  if (!activity) {
    return res.status(404).json({ error: "Quantus activity not found for lesson" });
  }

  const scorePct = total && total > 0 ? Math.round((score / total) * 100) : score;

  const newSession = await prisma.userQuantusSession.create({
    data: {
      userId,
      activityId: activity.id,
      inputSnapshot: inputSnapshot || {},
      score,
      total: total || 0,
      scorePct,
      hintsUsed: hintsUsed || 0,
    },
  });

  const status = scorePct >= 70 ? "completed" : "in_progress";
  if (status === "completed") {
    await prisma.userActivityDraft.deleteMany({
      where: { userId, activityId: activity.id, activityType: "quantus" },
    });
  }
  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {
      quantusAttempted: true,
    },
    create: {
      userId,
      lessonId,
      quantusAttempted: true,
    },
  });

  // Re-calculate the aggregated lesson completion and status across all activities
  await recalculateLessonProgress(userId, lessonId);

  await cascadeLessonProgress(userId, lessonId);

  await recordStreakDay(userId);
  invalidateProgressSummaryCache(userId);

  return res.json({ data: { score, total, scorePct, status, id: newSession.id } });
};
