import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { getUserIdFromRequest } from "../middleware/auth";

const router = Router();

// 1. GET /api/v1/activities/:id
router.get("/:id", async (req: Request, res: Response) => {
  const lessonId = req.params.id;
  const userId = await getUserIdFromRequest(req);

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        mcqActivity: { include: { questions: { include: { options: true } } } },
        canvasActivity: { include: { zones: true, items: true } },
        quantusActivity: { include: { columnGroups: true, columns: true, sections: { include: { rows: { include: { quantusCells: true } } } } } },
        subtopic: { include: { topic: { include: { module: true } } } },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson / Activity not found" });
    }

    // Query hints
    const hints = await prisma.activityHint.findMany({
      where: {
        activityId: {
          in: [
            lesson.mcqActivity?.id,
            lesson.canvasActivity?.id,
            lesson.quantusActivity?.id
          ].filter(Boolean) as string[]
        }
      },
      orderBy: { orderIndex: "asc" }
    });
    const hintTexts = hints.map(h => h.hintText);

    // Fetch question-level MCQ completed states (only select correct answers!)
    const completedQuestionIds = new Set<string>();
    const submittedOptionMap = new Map<string, string>();

    if (userId && lesson.mcqActivity) {
      const answers = await prisma.userMcqAnswer.findMany({
        where: { session: { userId, activityId: lesson.mcqActivity.id }, isCorrect: true },
        include: { question: { include: { options: true } } }
      });
      answers.forEach(a => {
        completedQuestionIds.add(a.questionId);
        const optIdx = a.question.options.findIndex(o => o.id === a.selectedOptionId);
        if (optIdx !== -1) {
          submittedOptionMap.set(a.questionId, String.fromCharCode(65 + optIdx));
        }
      });
    }

    // Fetch Quantus & Canvas completed sessions
    let quantusCompleted = false;
    let submittedGrid: any = null;
    let canvasCompleted = false;
    let submittedCanvasData: any = null;

    if (userId) {
      if (lesson.quantusActivity) {
        const sess = await prisma.userQuantusSession.findFirst({
          where: { userId, activityId: lesson.quantusActivity.id }
        });
        quantusCompleted = !!sess;
        if (sess) {
          submittedGrid = sess.inputSnapshot;
        }
      }
      if (lesson.canvasActivity) {
        const sess = await prisma.userCanvasSession.findFirst({
          where: { userId, activityId: lesson.canvasActivity.id }
        });
        canvasCompleted = !!sess;
        if (sess) {
          submittedCanvasData = sess.canvasData;
        }
      }
    }

    // Build steps
    const steps: any[] = [];

    // MCQ Steps — Add each MCQ question as an independent step
    if (lesson.mcqActivity) {
      const questions = lesson.mcqActivity.questions.sort((a, b) => a.orderIndex - b.orderIndex);
      for (const question of questions) {
        steps.push({
          id: question.id,
          type: "mcq",
          completed: completedQuestionIds.has(question.id),
          submittedOptionId: submittedOptionMap.get(question.id) || null,
          instructions: lesson.mcqActivity.instructions,
          contextText: lesson.mcqActivity.context || "",
          questionText: question.questionText,
          options: question.options.map((opt, idx) => ({
            id: String.fromCharCode(65 + idx), // A, B, C, D
            label: opt.optionText,
          })),
        });
      }
    }

    // Quantus Step
    if (lesson.quantusActivity) {
      const cols = lesson.quantusActivity.columns.sort((a, b) => a.colIndex - b.colIndex);
      const gridCols = cols.map(c => c.label);
      const sections = lesson.quantusActivity.sections.sort((a, b) => a.orderIndex - b.orderIndex);
      const gridRows: string[] = [];
      const gridValues: Record<string, string> = {};

      let rowIndexCounter = 1;
      for (const section of sections) {
        const rows = section.rows.sort((a, b) => a.orderIndex - b.orderIndex);
        for (const row of rows) {
          const rowStr = String(rowIndexCounter);
          gridRows.push(rowStr);

          // First col is Metric/Row Label
          const metricCol = cols[0]?.label || "Metric";
          gridValues[`${rowStr}-${metricCol}`] = row.label;

          // Other columns
          for (let cIdx = 1; cIdx < cols.length; cIdx++) {
            const col = cols[cIdx];
            const cell = row.quantusCells.find(c => c.columnId === col.id);
            const cellKey = `${rowStr}-${col.label}`;
            if (cell) {
              if (cell.cellType === "prefilled" || cell.cellType === "editable") {
                gridValues[cellKey] = cell.defaultValue !== null ? String(cell.defaultValue) : "";
              } else if (cell.cellType === "formula") {
                gridValues[cellKey] = cell.formulaExpression || "";
              } else {
                gridValues[cellKey] = "";
              }
            } else {
              gridValues[cellKey] = "";
            }
          }
          rowIndexCounter++;
        }
      }

      steps.push({
        id: lesson.quantusActivity.id,
        type: "quantus",
        completed: quantusCompleted,
        submittedGrid,
        instructions: lesson.quantusActivity.instructions,
        contextText: lesson.quantusActivity.context || "",
        gridCols,
        gridRows,
        gridValues,
      });
    }

    // Canvas Step
    if (lesson.canvasActivity) {
      const zones = lesson.canvasActivity.zones.map(z => ({
        id: z.id,
        key: z.zoneKey,
        label: z.label,
        color: z.color,
        bgColor: z.bgColor,
      }));

      const itemsByCategory = [
        {
          category: "Framework Variables",
          items: lesson.canvasActivity.items.map(item => ({
            id: item.id,
            type: item.label.toLowerCase().includes("input") || item.label.toLowerCase().includes("coefficient")
              ? "rectangle" as const
              : "diamond" as const,
            label: item.label,
            description: item.description || item.label,
            correctZoneId: item.correctZoneId,
          }))
        }
      ];

      steps.push({
        id: lesson.canvasActivity.id,
        type: "canvas",
        completed: canvasCompleted,
        submittedCanvasData,
        instructions: lesson.canvasActivity.instructions,
        contextText: lesson.canvasActivity.context || "",
        questionText: "Framework Categorization Challenge",
        zones,
        draggableElements: itemsByCategory,
      });
    }

    // Determine the first incomplete step index
    let startIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].completed) {
        startIndex = i;
        break;
      }
    }

    return res.json({
      data: {
        id: lesson.id,
        title: lesson.name,
        difficulty: lesson.difficulty.toUpperCase(),
        referenceFile: "Reference Model.xlsx",
        hints: hintTexts.length > 0 ? hintTexts : ["Analyze standard parameters carefully.", "Perform a quick sanity check before submission."],
        caseNotes: lesson.description || "Review this interactive case study model to align core strategic metrics.",
        steps,
        startIndex,
        moduleSlug: lesson.subtopic.topic.module.slug,
      }
    });
  } catch (error) {
    console.error("Error loading activity:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. POST /api/v1/attempts
router.post("/", async (req: Request, res: Response) => {
  const attemptId = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return res.json({
    data: {
      attemptId
    }
  });
});

// 3. POST /api/v1/attempts/:attemptId/submit
router.post("/:attemptId/submit", async (req: Request, res: Response) => {
  const { activityId, answers, cells, canvasData } = req.body;
  const userId = await getUserIdFromRequest(req);

  let accuracy = 100;
  let recall = 100;
  let application = 100;
  let isCorrect = true;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: activityId },
      include: {
        mcqActivity: { include: { questions: true } },
        canvasActivity: true,
        quantusActivity: true,
        subtopic: { include: { topic: { include: { module: true } } } }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // 1. Calculate accuracy and save step session depending on submitted type
    if (answers && answers.length > 0) {
      const submitted = answers[0];
      const question = await prisma.mcqQuestion.findUnique({
        where: { id: submitted.questionId },
        include: { options: true }
      });

      if (question) {
        const optionIndex = (submitted.selectedOptionId || "A").charCodeAt(0) - 65;
        const chosenOpt = question.options[optionIndex];
        isCorrect = chosenOpt?.isCorrect || false;
        accuracy = isCorrect ? 100 : 0;
        recall = isCorrect ? 100 : 0;
        application = isCorrect ? 100 : 0;

        if (userId && lesson.mcqActivity) {
          // Find or create UserMcqSession
          let session = await prisma.userMcqSession.findFirst({
            where: { userId, activityId: lesson.mcqActivity.id }
          });

          if (!session) {
            session = await prisma.userMcqSession.create({
              data: {
                userId,
                activityId: lesson.mcqActivity.id,
                score: 0,
                total: lesson.mcqActivity.questions.length,
                scorePct: 0
              }
            });
          }

          // Check if answer already exists
          const existingAns = await prisma.userMcqAnswer.findFirst({
            where: { sessionId: session.id, questionId: question.id }
          });

          if (existingAns) {
            await prisma.userMcqAnswer.update({
              where: { id: existingAns.id },
              data: {
                selectedOptionId: chosenOpt?.id || "",
                isCorrect
              }
            });
          } else if (chosenOpt) {
            await prisma.userMcqAnswer.create({
              data: {
                sessionId: session.id,
                questionId: question.id,
                selectedOptionId: chosenOpt.id,
                isCorrect
              }
            });
          }

          // Recalculate session score
          const allAnswers = await prisma.userMcqAnswer.findMany({
            where: { sessionId: session.id }
          });
          const correctAnswersCount = allAnswers.filter(a => a.isCorrect).length;
          const scorePct = Math.round((correctAnswersCount / lesson.mcqActivity.questions.length) * 100);

          await prisma.userMcqSession.update({
            where: { id: session.id },
            data: {
              score: correctAnswersCount,
              scorePct
            }
          });
        }
      }
    } else if (cells) {
      accuracy = 100;
      recall = 100;
      application = 100;

      if (userId && lesson.quantusActivity) {
        await prisma.userQuantusSession.deleteMany({
          where: { userId, activityId: lesson.quantusActivity.id }
        });

        await prisma.userQuantusSession.create({
          data: {
            userId,
            activityId: lesson.quantusActivity.id,
            inputSnapshot: cells,
            score: 1,
            total: 1,
            scorePct: 100
          }
        });
      }
    } else if (canvasData) {
      accuracy = 100;
      recall = 100;
      application = 100;

      if (userId && lesson.canvasActivity) {
        await prisma.userCanvasSession.deleteMany({
          where: { userId, activityId: lesson.canvasActivity.id }
        });

        await prisma.userCanvasSession.create({
          data: {
            userId,
            activityId: lesson.canvasActivity.id,
            score: 1,
            total: 1,
            scorePct: 100,
            canvasData: canvasData
          }
        });
      }
    }

    // 2. Propagate progress to the database with integer-rounded percentages out of 3 activities (MCQ, Quantus, Canvas)
    if (userId) {
      let totalActivities = 0;
      let completedActivities = 0;

      if (lesson.mcqActivity) {
        totalActivities += 1;
        const correctCount = await prisma.userMcqAnswer.count({
          where: { session: { userId, activityId: lesson.mcqActivity.id }, isCorrect: true }
        });
        // MCQ counts as completed ONLY if ALL questions in the group are answered correctly!
        if (correctCount === lesson.mcqActivity.questions.length) {
          completedActivities += 1;
        }
      }
      if (lesson.quantusActivity) {
        totalActivities += 1;
        const count = await prisma.userQuantusSession.count({
          where: { userId, activityId: lesson.quantusActivity.id }
        });
        if (count > 0) completedActivities += 1;
      }
      if (lesson.canvasActivity) {
        totalActivities += 1;
        const count = await prisma.userCanvasSession.count({
          where: { userId, activityId: lesson.canvasActivity.id }
        });
        if (count > 0) completedActivities += 1;
      }

      const completionPct = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
      const isLessonCompleted = completedActivities === totalActivities;

      // Update UserLessonProgress
      await prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: lesson.id } },
        create: {
          userId,
          lessonId: lesson.id,
          lessonCompletionPct: completionPct,
          status: isLessonCompleted ? "completed" : "in_progress",
          mcqBestScore: accuracy,
          completedAt: isLessonCompleted ? new Date() : null
        },
        update: {
          lessonCompletionPct: completionPct,
          status: isLessonCompleted ? "completed" : "in_progress",
          mcqBestScore: accuracy,
          completedAt: isLessonCompleted ? new Date() : null
        }
      });

      // Update Subtopic Progress
      const lessonsInSubtopic = await prisma.lesson.findMany({
        where: { subtopicId: lesson.subtopicId }
      });
      const lessonProgresses = await prisma.userLessonProgress.findMany({
        where: { userId, lessonId: { in: lessonsInSubtopic.map(l => l.id) } }
      });

      const completedLessonsCount = lessonProgresses.filter(p => p.status === "completed").length;
      const subtopicPct = Math.round(
        (lessonProgresses.reduce((acc, curr) => acc + curr.lessonCompletionPct, 0) / (lessonsInSubtopic.length * 100)) * 100
      );

      await prisma.userSubtopicProgress.upsert({
        where: { userId_subtopicId: { userId, subtopicId: lesson.subtopicId } },
        create: {
          userId,
          subtopicId: lesson.subtopicId,
          subtopicCompletionPct: subtopicPct,
          conceptAccuracy: accuracy,
          recallStrength: recall,
          applicationScore: application,
          lessonsCompleted: completedLessonsCount,
          lessonsTotal: lessonsInSubtopic.length
        },
        update: {
          subtopicCompletionPct: subtopicPct,
          conceptAccuracy: accuracy,
          recallStrength: recall,
          applicationScore: application,
          lessonsCompleted: completedLessonsCount
        }
      });

      // Update Topic Progress
      const subtopicsInTopic = await prisma.subtopic.findMany({
        where: { topicId: lesson.subtopic.topicId }
      });
      const subtopicProgresses = await prisma.userSubtopicProgress.findMany({
        where: { userId, subtopicId: { in: subtopicsInTopic.map(s => s.id) } }
      });

      const topicPct = Math.round(
        subtopicProgresses.reduce((acc, curr) => acc + curr.subtopicCompletionPct, 0) / subtopicsInTopic.length
      );

      await prisma.userTopicProgress.upsert({
        where: { userId_topicId: { userId, topicId: lesson.subtopic.topicId } },
        create: {
          userId,
          topicId: lesson.subtopic.topicId,
          topicCompletionPct: topicPct,
          conceptAccuracy: accuracy,
          recallStrength: recall,
          applicationScore: application,
          lessonsTotal: lessonsInSubtopic.length
        },
        update: {
          topicCompletionPct: topicPct,
          conceptAccuracy: accuracy,
          recallStrength: recall,
          applicationScore: application
        }
      });

      // Update Module Progress
      const topicsInModule = await prisma.topic.findMany({
        where: { moduleId: lesson.subtopic.topic.moduleId }
      });
      const topicProgresses = await prisma.userTopicProgress.findMany({
        where: { userId, topicId: { in: topicsInModule.map(t => t.id) } }
      });

      const modulePct = Math.round(
        topicProgresses.reduce((acc, curr) => acc + curr.topicCompletionPct, 0) / topicsInModule.length
      );

      await prisma.userModuleProgress.upsert({
        where: { userId_moduleId: { userId, moduleId: lesson.subtopic.topic.moduleId } },
        create: {
          userId,
          moduleId: lesson.subtopic.topic.moduleId,
          moduleCompletionPct: modulePct,
          conceptAccuracy: accuracy,
          recallStrength: recall,
          applicationScore: application
        },
        update: {
          moduleCompletionPct: modulePct,
          conceptAccuracy: accuracy,
          recallStrength: recall,
          applicationScore: application
        }
      });
    }

    return res.json({
      data: {
        isCorrect,
        conceptAccuracy: accuracy,
        recallStrength: recall,
        applicationScore: application
      }
    });
  } catch (error) {
    console.error("Error submitting attempt:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
