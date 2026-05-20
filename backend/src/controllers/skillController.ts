import { Request, Response } from "express";
import { prisma } from "../prisma";

export const getSkillSections = async (_req: Request, res: Response) => {
  const sections = await prisma.skillSection.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" } });
  return res.json({ data: sections });
};

export const getProfessions = async (_req: Request, res: Response) => {
  const professions = await prisma.profession.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" } });
  return res.json({ data: professions });
};

export const getSectionBundles = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const profession = String(req.query.profession || "");
  const section = await prisma.skillSection.findUnique({
    where: { slug },
    include: {
      bundles: {
        where: { isActive: true },
        orderBy: [{ bundleGroup: "asc" }, { orderIndex: "asc" }],
        include: { professions: { include: { profession: true } } },
      },
    },
  });

  if (!section) return res.status(404).json({ error: "Skill section not found" });

  const bundles = section.bundles.filter((bundle) => {
    if (!profession) return true;
    return bundle.professions.some((item) => item.profession.slug === profession);
  });

  return res.json({
    data: bundles.map((bundle) => ({
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      level: bundle.level,
      durationWeeks: bundle.durationWeeks,
      bundleGroup: bundle.bundleGroup,
      professions: bundle.professions.map((item) => ({
        id: item.profession.id,
        name: item.profession.name,
        slug: item.profession.slug,
      })),
    })),
  });
};

export const startSkillBundle = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { bundleId } = req.params;

  const bundle = await prisma.skillBundle.findUnique({
    where: { id: bundleId },
    include: { items: true },
  });
  if (!bundle) return res.status(404).json({ error: "Skill bundle not found" });

  const progress = await prisma.userSkillBundleProgress.upsert({
    where: { userId_bundleId: { userId, bundleId } },
    create: {
      userId,
      bundleId,
      itemsTotal: bundle.items.length,
      completionPct: 0,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
      updatedAt: new Date(),
    },
    update: { lastAccessedAt: new Date(), updatedAt: new Date() },
  });

  return res.json({ data: { bundleId: progress.bundleId, completionPct: progress.completionPct, startedAt: progress.startedAt } });
};

export const getSkillBundleProgress = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { bundleId } = req.params;

  const progress = await prisma.userSkillBundleProgress.findUnique({
    where: { userId_bundleId: { userId, bundleId } },
    include: { bundle: { include: { items: true } } },
  });

  if (!progress) return res.status(404).json({ error: "Bundle progress not found" });

  const itemProgresses = await prisma.userSkillItemProgress.findMany({
    where: { userId, bundleItem: { bundleId } },
    include: { bundleItem: true },
  });

  return res.json({
    data: {
      bundleId: progress.bundleId,
      completionPct: progress.completionPct,
      itemsCompleted: progress.itemsCompleted,
      itemsTotal: progress.itemsTotal,
      items: itemProgresses.map((item) => ({
        id: item.id,
        lessonId: item.bundleItem.lessonId,
        activityType: item.bundleItem.activityType,
        label: item.bundleItem.label,
        isCompleted: item.isCompleted,
        bestScorePct: item.bestScorePct,
        attempts: item.attempts,
      })),
      updatedAt: progress.updatedAt,
    },
  });
};

export const getMySkillProgress = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const bundleProgresses = await prisma.userSkillBundleProgress.findMany({
    where: { userId },
    include: { bundle: true },
  });

  return res.json({
    data: bundleProgresses.map((record) => ({
      bundleId: record.bundleId,
      name: record.bundle.name,
      completionPct: record.completionPct,
      itemsCompleted: record.itemsCompleted,
      itemsTotal: record.itemsTotal,
      lastAccessedAt: record.lastAccessedAt,
    })),
  });
};
