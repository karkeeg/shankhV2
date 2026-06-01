import { Request, Response } from "express";
import { CellType, CellStyle } from "@prisma/client";
import { prisma } from "../prisma";
import { recalculateAllUserProgress } from "../services/progressService";

interface McqOptionInput { option_text: string; is_correct: boolean; order_index?: number; }
interface McqQuestionInput { question_text: string; explanation: string; order_index?: number; options: McqOptionInput[]; }
interface TokenInput { display_text: string; token_role: string; shape?: string; is_distractor?: boolean; order_index?: number; }
interface TokenEdgeInput { from_token_index: number; to_token_index: number; operand_slot?: string; is_commutative?: boolean; edge_role: string; edge_order?: number; edge_label?: string; }
interface BundleItemInput { lesson_id: string; activity_type: string; label: string; }
interface QuantusCellInput { row_index: number; col_index: number; cell_type: string; display_value?: string; expected_value?: string; formula?: string; format_type?: string; is_editable?: boolean; tolerance_pct?: number; hint_text?: string; row_span?: number; col_span?: number; }
interface ColumnInput { label: string; col_index: number; width_px?: number; }
interface ColumnGroupInput { label: string; col_start: number; col_end: number; bg_color?: string; text_color?: string; order_index?: number; }

export const createModule = async (req: Request, res: Response) => {
  const { slug, name, description, accentColor, iconKey, orderIndex } = req.body;
  if (!slug || !name || !accentColor) return res.status(400).json({ error: "slug, name, and accentColor are required" });
  const module = await prisma.module.create({ data: { slug, name, description, accentColor, iconKey, orderIndex: orderIndex || 0 } });
  return res.status(201).json({ data: module });
};

export const createTopic = async (req: Request, res: Response) => {
  const { module_id, name, subtitle, description, tags, orderIndex, type } = req.body;
  if (!module_id || !name) return res.status(400).json({ error: "module_id and name are required" });
  const topic = await prisma.topic.create({ data: { moduleId: module_id, name, subtitle, description, tags: tags || [], orderIndex: orderIndex || 0, type: type || "topic" } });
  return res.status(201).json({ data: topic });
};

export const createSubtopic = async (req: Request, res: Response) => {
  const { topic_id, name, description, type, orderIndex } = req.body;
  if (!topic_id || !name) return res.status(400).json({ error: "topic_id and name are required" });
  const subtopic = await prisma.subtopic.create({ data: { topicId: topic_id, name, description, type: type || "topic", orderIndex: orderIndex || 0 } });
  return res.status(201).json({ data: subtopic });
};

export const createLesson = async (req: Request, res: Response) => {
  const { subtopic_id, name, difficulty, description, orderIndex } = req.body;
  if (!subtopic_id || !name) return res.status(400).json({ error: "subtopic_id and name are required" });
  const lesson = await prisma.lesson.create({ data: { subtopicId: subtopic_id, name, description, difficulty: difficulty || "easy", orderIndex: orderIndex || 0 } });
  return res.status(201).json({ data: lesson });
};

export const assignLessonActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activity_type, order_index } = req.body;
  if (!activity_type) return res.status(400).json({ error: "activity_type is required" });
  const activity = await prisma.lessonActivity.create({ data: { lessonId: id, activityType: activity_type as any, orderIndex: order_index || 0 } });
  return res.status(201).json({ data: activity });
};

export const setupMcqActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, instructions, context, questions } = req.body;
  if (!instructions || !Array.isArray(questions)) return res.status(400).json({ error: "instructions and questions are required" });

  const activity = await prisma.mcqActivity.upsert({
    where: { lessonId: id },
    create: {
      lessonId: id,
      title,
      instructions,
      context,
      questions: {
        create: (questions as McqQuestionInput[]).map((question) => ({
          questionText: question.question_text,
          explanation: question.explanation,
          orderIndex: question.order_index || 0,
          options: {
            create: question.options.map((option) => ({
              optionText: option.option_text,
              isCorrect: option.is_correct,
              orderIndex: option.order_index || 0,
            })),
          },
        })),
      },
    },
    update: {
      title,
      instructions,
      context,
      questions: {
        deleteMany: {},
        create: (questions as McqQuestionInput[]).map((question) => ({
          questionText: question.question_text,
          explanation: question.explanation,
          orderIndex: question.order_index || 0,
          options: {
            create: question.options.map((option) => ({
              optionText: option.option_text,
              isCorrect: option.is_correct,
              orderIndex: option.order_index || 0,
            })),
          },
        })),
      },
    },
  });

  return res.status(201).json({ data: activity });
};

export const setupCanvasActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, instructions, context, assembly_mode, scoring_mode, penalty_weight, pass_threshold, tokens, solution_edges } = req.body;
  if (!title || !instructions) return res.status(400).json({ error: "title and instructions are required" });

  // Delete existing activity and recreate (cascade deletes children)
  await prisma.canvasActivity.deleteMany({ where: { lessonId: id } });

  const activity = await prisma.canvasActivity.create({
    data: {
      lessonId: id,
      title,
      instructions,
      context,
      assemblyMode: assembly_mode || "graph",
      scoringMode: scoring_mode || "partial",
      penaltyWeight: penalty_weight ?? 0.5,
      passThreshold: pass_threshold ?? 70,
    },
  });

  // Create tokens — keep an index→id map to wire edges.
  const createdTokenIds: string[] = [];
  for (let i = 0; i < ((tokens || []) as TokenInput[]).length; i++) {
    const tk = (tokens as TokenInput[])[i];
    const row = await prisma.canvasToken.create({
      data: {
        activityId: activity.id,
        displayText: tk.display_text,
        tokenRole: tk.token_role,
        shape: tk.shape || "rect",
        isDistractor: tk.is_distractor ?? false,
        orderIndex: tk.order_index ?? i,
      },
    });
    createdTokenIds.push(row.id);
  }

  // Create solution edges referencing tokens by index.
  for (const edge of ((solution_edges || []) as TokenEdgeInput[])) {
    const fromId = createdTokenIds[edge.from_token_index];
    const toId = createdTokenIds[edge.to_token_index];
    if (!fromId || !toId) continue;
    await prisma.canvasSolutionEdge.create({
      data: {
        activityId: activity.id,
        fromTokenId: fromId,
        toTokenId: toId,
        operandSlot: edge.operand_slot ?? null,
        isCommutative: edge.is_commutative ?? false,
        edgeRole: edge.edge_role,
        edgeOrder: edge.edge_order ?? null,
        edgeLabel: edge.edge_label ?? null,
      },
    });
  }

  return res.status(201).json({ data: activity });
};

export const getLessonDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        subtopic: { include: { topic: { include: { module: true } } } },
        lessonActivities: { orderBy: { orderIndex: "asc" } },
        mcqActivity: {
          include: {
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { options: { orderBy: { orderIndex: "asc" } } },
            },
          },
        },
        canvasActivity: {
          include: {
            tokens: { orderBy: { orderIndex: "asc" } },
            solutionEdges: true,
          },
        },
        quantusActivity: {
          include: {
            columnGroups: { orderBy: { orderIndex: "asc" } },
            columns: { orderBy: { colIndex: "asc" } },
            quantusCells: { orderBy: [{ rowIndex: "asc" }, { colIndex: "asc" }] },
          },
        },
      },
    });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    return res.json({ data: lesson });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch lesson detail" });
  }
};

export const setupQuantusActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, instructions, context, reference_url, column_groups, columns, cells } = req.body;
  if (!title || !instructions || !Array.isArray(columns))
    return res.status(400).json({ error: "title, instructions, and columns are required" });

  const colCreate = (columns as ColumnInput[]).map((col) => ({ label: col.label, colIndex: col.col_index, widthPx: col.width_px || 100 }));
  const groupCreate = ((column_groups || []) as ColumnGroupInput[]).map((g) => ({ label: g.label, colStart: g.col_start, colEnd: g.col_end, bgColor: g.bg_color || "#e8e8ff", textColor: g.text_color || "#333", orderIndex: g.order_index || 0 }));
  const cellCreate = ((cells || []) as QuantusCellInput[]).map((c) => ({
    rowIndex: c.row_index,
    colIndex: c.col_index,
    cellType: c.cell_type || "data",
    displayValue: c.display_value ?? null,
    expectedValue: c.expected_value ?? null,
    formula: c.formula ?? null,
    formatType: c.format_type ?? null,
    isEditable: c.is_editable ?? false,
    tolerancePct: c.tolerance_pct ?? null,
    hintText: c.hint_text ?? null,
    rowSpan: c.row_span ?? 1,
    colSpan: c.col_span ?? 1,
  }));

  // Delete existing and recreate (cascade deletes children)
  await prisma.quantusActivity.deleteMany({ where: { lessonId: id } });

  const activity = await prisma.quantusActivity.create({
    data: {
      lessonId: id, title, instructions, context, referenceUrl: reference_url,
      columns: { create: colCreate },
      columnGroups: { create: groupCreate },
      quantusCells: { create: cellCreate },
    },
  });

  return res.status(201).json({ data: activity });
};

export const addActivityHints = async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const { hints } = req.body;
  if (!Array.isArray(hints)) return res.status(400).json({ error: "hints are required" });

  const created = await prisma.activityHint.createMany({
    data: hints.map((hint: any) => ({
      activityType: type as any,
      activityId: id,
      hintText: hint.hint_text,
      orderIndex: hint.order_index || 0,
    })),
  });

  return res.status(201).json({ data: { created: created.count } });
};

export const createSkillBundle = async (req: Request, res: Response) => {
  const { section_id, name, description, level, duration_weeks, bundle_group, order_index } = req.body;
  if (!section_id || !name) return res.status(400).json({ error: "section_id and name are required" });
  const bundle = await prisma.skillBundle.create({
    data: {
      sectionId: section_id,
      name,
      description,
      level: level || "",
      durationWeeks: duration_weeks || 0,
      bundleGroup: bundle_group || "profession_based",
      orderIndex: order_index || 0,
    },
  });
  return res.status(201).json({ data: bundle });
};

export const assignBundleProfessions = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { profession_ids } = req.body;
  if (!Array.isArray(profession_ids)) return res.status(400).json({ error: "profession_ids is required" });

  const created = await prisma.skillBundleProfession.createMany({ data: profession_ids.map((professionId: string) => ({ bundleId: id, professionId })) });
  return res.status(201).json({ data: { created: created.count } });
};

export const assignBundleItems = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items are required" });

  const created = await prisma.skillBundleItem.createMany({ data: (items as BundleItemInput[]).map((item) => ({ bundleId: id, lessonId: item.lesson_id, activityType: item.activity_type as any, label: item.label })) });
  return res.status(201).json({ data: { created: created.count } });
};

export const assignSubtopicProfessions = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { profession_ids } = req.body;
  if (!Array.isArray(profession_ids)) return res.status(400).json({ error: "profession_ids is required" });

  const created = await prisma.subtopicProfessionTag.createMany({ data: profession_ids.map((professionId: string) => ({ subtopicId: id, professionId })) });
  return res.status(201).json({ data: { created: created.count } });
};

export const recalculateUserProgress = async (req: Request, res: Response) => {
  const { userId } = req.params;
  await recalculateAllUserProgress(userId);
  return res.json({ data: { success: true } });
};

// ─── NEW: Decoupled Skill Building Admin Operations ──────────────────────────

export const createProfession = async (req: Request, res: Response) => {
  const { name, slug, description, iconKey, orderIndex } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const prof = await prisma.profession.create({
      data: { name, slug, description, iconKey, orderIndex: orderIndex || 0 },
    });
    return res.status(201).json({ data: prof });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to create profession" });
  }
};

export const getAdminProfessions = async (req: Request, res: Response) => {
  const profs = await prisma.profession.findMany({
    orderBy: { orderIndex: "asc" },
  });
  return res.json({ data: profs });
};

export const updateProfession = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, slug, description, iconKey, orderIndex, isActive } = req.body;
  try {
    const prof = await prisma.profession.update({
      where: { id },
      data: { name, slug, description, iconKey, orderIndex, isActive },
    });
    return res.json({ data: prof });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update profession" });
  }
};

export const deleteProfession = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.profession.delete({ where: { id } });
    return res.json({ data: { success: true } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to delete profession" });
  }
};

export const createSkillTopic = async (req: Request, res: Response) => {
  const { professionId, name, description, level, durationWeeks, orderIndex } = req.body;
  if (!professionId || !name) return res.status(400).json({ error: "professionId and name are required" });
  try {
    const topic = await prisma.skillTopic.create({
      data: { professionId, name, description, level, durationWeeks, orderIndex: orderIndex || 0 },
    });
    return res.status(201).json({ data: topic });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to create skill topic" });
  }
};

export const getSkillTopicsForProfession = async (req: Request, res: Response) => {
  const { professionId } = req.params;
  const topics = await prisma.skillTopic.findMany({
    where: { professionId },
    orderBy: { orderIndex: "asc" },
  });
  return res.json({ data: topics });
};

export const updateSkillTopic = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, level, durationWeeks, orderIndex, isActive } = req.body;
  try {
    const topic = await prisma.skillTopic.update({
      where: { id },
      data: { name, description, level, durationWeeks, orderIndex, isActive },
    });
    return res.json({ data: topic });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to update skill topic" });
  }
};

export const deleteSkillTopic = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.skillTopic.delete({ where: { id } });
    return res.json({ data: { success: true } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to delete skill topic" });
  }
};

export const importLessonsToSkillTopic = async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const { lessonIds } = req.body;
  if (!Array.isArray(lessonIds)) return res.status(400).json({ error: "lessonIds is required and must be an array" });

  try {
    const learningLessons = await prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
    });

    const createdLessons = [];
    let currentMaxOrder = 0;
    const existingLessons = await prisma.skillLesson.findMany({
      where: { skillTopicId: topicId },
      orderBy: { orderIndex: "desc" },
      take: 1,
    });
    if (existingLessons.length > 0) {
      currentMaxOrder = existingLessons[0].orderIndex + 1;
    }

    for (const l of learningLessons) {
      const existing = await prisma.skillLesson.findFirst({
        where: { skillTopicId: topicId, lessonId: l.id },
      });
      if (existing) continue;

      const skillLesson = await prisma.skillLesson.create({
        data: {
          skillTopicId: topicId,
          lessonId: l.id,
          name: l.name,
          description: l.description,
          difficulty: l.difficulty,
          estimatedMins: l.estimatedMins,
          orderIndex: currentMaxOrder++,
        },
      });
      createdLessons.push(skillLesson);
    }

    return res.status(201).json({ data: createdLessons });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to import lessons" });
  }
};

export const getSkillLessonsForTopic = async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const lessons = await prisma.skillLesson.findMany({
    where: { skillTopicId: topicId },
    orderBy: { orderIndex: "asc" },
    include: {
      lesson: {
        include: {
          mcqActivity: true,
          canvasActivity: true,
          quantusActivity: true,
        }
      }
    }
  });
  return res.json({ data: lessons });
};

export const deleteSkillLesson = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.skillLesson.delete({ where: { id } });
    return res.json({ data: { success: true } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to delete skill lesson" });
  }
};

export const getLearningTree = async (req: Request, res: Response) => {
  try {
    const tree = await prisma.module.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { orderIndex: "asc" },
      include: {
        topics: {
          where: { isActive: true, deletedAt: null },
          orderBy: { orderIndex: "asc" },
          include: {
            subtopics: {
              where: { isActive: true, deletedAt: null },
              orderBy: { orderIndex: "asc" },
              include: {
                lessons: {
                  where: { isActive: true, deletedAt: null },
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });
    return res.json({ data: tree });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load learning tree" });
  }
};

