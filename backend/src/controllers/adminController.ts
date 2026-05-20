import { Request, Response } from "express";
import { CellType, CellStyle } from "@prisma/client";
import { prisma } from "../prisma";
import { recalculateAllUserProgress } from "../services/progressService";

interface McqOptionInput { option_text: string; is_correct: boolean; order_index?: number; }
interface McqQuestionInput { question_text: string; explanation: string; order_index?: number; options: McqOptionInput[]; }
interface ZoneInput { zone_key: string; label: string; description?: string; color: string; bg_color: string; order_index?: number; }
interface ItemInput { label: string; description?: string; correct_zone_id?: string; order_index?: number; }
interface BundleItemInput { lesson_id: string; activity_type: string; label: string; }
interface CellInput { column_id: string; cell_type?: string; default_value?: number; formula_expression?: string; style_class?: string; prefix?: string; decimal_places?: number; is_negative_red?: boolean; }
interface RowInput { label: string; row_key: string; is_separator?: boolean; is_bold?: boolean; is_italic?: boolean; indent_level?: number; order_index?: number; cells?: CellInput[]; }
interface SectionInput { label: string; header_bg?: string; header_color?: string; order_index?: number; rows?: RowInput[]; }
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
  const { title, instructions, context, subtype, drawing_prompt, zones, items } = req.body;
  if (!title || !instructions || !Array.isArray(zones) || !Array.isArray(items)) return res.status(400).json({ error: "title, instructions, zones, and items are required" });

  const activity = await prisma.canvasActivity.upsert({
    where: { lessonId: id },
    create: {
      lessonId: id,
      title,
      instructions,
      context,
      subtype: subtype || "drag_drop",
      drawingPrompt: drawing_prompt,
      zones: {
        create: (zones as ZoneInput[]).map((zone) => ({
          zoneKey: zone.zone_key,
          label: zone.label,
          description: zone.description,
          color: zone.color,
          bgColor: zone.bg_color,
          orderIndex: zone.order_index || 0,
        })),
      },
      items: {
        create: (items as ItemInput[]).map((item) => ({
          label: item.label,
          description: item.description,
          correctZoneId: item.correct_zone_id,
          orderIndex: item.order_index || 0,
        })),
      },
    },
    update: {
      title,
      instructions,
      context,
      subtype: subtype || "drag_drop",
      drawingPrompt: drawing_prompt,
      zones: { deleteMany: {}, create: (zones as ZoneInput[]).map((zone) => ({ zoneKey: zone.zone_key, label: zone.label, description: zone.description, color: zone.color, bgColor: zone.bg_color, orderIndex: zone.order_index || 0 })) },
      items: { deleteMany: {}, create: (items as ItemInput[]).map((item) => ({ label: item.label, description: item.description, correctZoneId: item.correct_zone_id, orderIndex: item.order_index || 0 })) },
    },
  });

  return res.status(201).json({ data: activity });
};

const buildQuantusRow = (row: RowInput) => ({
  label: row.label,
  rowKey: row.row_key,
  isSeparator: row.is_separator || false,
  isBold: row.is_bold || false,
  isItalic: row.is_italic || false,
  indentLevel: row.indent_level || 0,
  orderIndex: row.order_index || 0,
  quantusCells: {
    create: (row.cells || []).map((cell: CellInput) => ({
      column: { connect: { id: cell.column_id } },
      cellType: (cell.cell_type || "empty") as CellType,
      defaultValue: cell.default_value,
      formulaExpression: cell.formula_expression,
      styleClass: (cell.style_class || "default") as CellStyle,
      prefix: cell.prefix ?? null,
      decimalPlaces: cell.decimal_places ?? 2,
      isNegativeRed: cell.is_negative_red ?? true,
    })),
  },
});

const buildQuantusSection = (section: SectionInput) => ({
  label: section.label,
  headerBg: section.header_bg || "#6b5ce7",
  headerColor: section.header_color || "#ffffff",
  orderIndex: section.order_index || 0,
  rows: { create: (section.rows || []).map(buildQuantusRow) },
});

export const setupQuantusActivity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, instructions, context, reference_url, column_groups, columns, sections } = req.body;
  if (!title || !instructions || !Array.isArray(columns) || !Array.isArray(sections))
    return res.status(400).json({ error: "title, instructions, columns, and sections are required" });

  const colCreate = (columns as ColumnInput[]).map((col) => ({ label: col.label, colIndex: col.col_index, widthPx: col.width_px || 100 }));
  const groupCreate = (column_groups as ColumnGroupInput[] || []).map((g) => ({ label: g.label, colStart: g.col_start, colEnd: g.col_end, bgColor: g.bg_color || "#e8e8ff", textColor: g.text_color || "#333", orderIndex: g.order_index || 0 }));

  const activity = await prisma.quantusActivity.upsert({
    where: { lessonId: id },
    create: {
      lessonId: id, title, instructions, context, referenceUrl: reference_url,
      columns: { create: colCreate },
      columnGroups: { create: groupCreate },
      sections: { create: sections.map(buildQuantusSection) },
    },
    update: {
      title, instructions, context, referenceUrl: reference_url,
      columns: { deleteMany: {}, create: colCreate },
      columnGroups: { deleteMany: {}, create: groupCreate },
      sections: { deleteMany: {}, create: sections.map(buildQuantusSection) },
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

export const assignTopicProfessions = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { profession_ids } = req.body;
  if (!Array.isArray(profession_ids)) return res.status(400).json({ error: "profession_ids is required" });

  const created = await prisma.topicProfessionTag.createMany({ data: profession_ids.map((professionId: string) => ({ topicId: id, professionId })) });
  return res.status(201).json({ data: { created: created.count } });
};

export const recalculateUserProgress = async (req: Request, res: Response) => {
  const { userId } = req.params;
  await recalculateAllUserProgress(userId);
  return res.json({ data: { success: true } });
};
