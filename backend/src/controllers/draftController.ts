import { Request, Response } from "express";
import { prisma } from "../prisma";

export const saveDraft = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { activityType, activityId } = req.params;
  const { draft_state, hints_revealed } = req.body;

  if (draft_state === undefined) return res.status(400).json({ error: "draft_state is required" });

  const draft = await prisma.userActivityDraft.upsert({
    where: { userId_activityId_activityType: { userId, activityId, activityType: activityType as import("@prisma/client").ActivityType } },
    create: {
      userId,
      activityId,
      activityType: activityType as import("@prisma/client").ActivityType,
      draftState: draft_state,
      hintsRevealed: hints_revealed || 0,
      startedAt: new Date(),
      lastSavedAt: new Date(),
    },
    update: {
      draftState: draft_state,
      hintsRevealed: hints_revealed || 0,
      lastSavedAt: new Date(),
    },
  });

  return res.json({ data: { saved: true, last_saved_at: draft.lastSavedAt.toISOString() } });
};

export const getDraft = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { activityType, activityId } = req.params;
  const draft = await prisma.userActivityDraft.findUnique({
    where: { userId_activityId_activityType: { userId, activityId, activityType: activityType as import("@prisma/client").ActivityType } },
  });

  return res.json({
    data: draft
      ? { draft_state: draft.draftState, hints_revealed: draft.hintsRevealed, last_saved_at: draft.lastSavedAt }
      : null,
  });
};

export const deleteDraft = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { activityType, activityId } = req.params;
  await prisma.userActivityDraft.deleteMany({ where: { userId, activityId, activityType: activityType as import("@prisma/client").ActivityType } });
  return res.json({ data: { deleted: true } });
};
