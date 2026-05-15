import type { Request, Response } from "express";
import { fetchStudyPlanTree, listStudyPlans, fetchDefaultStudyPlanTree } from "./service.js";

export async function getStudyPlans(_req: Request, res: Response) {
  const plans = await listStudyPlans();
  res.json({ data: plans });
}

export async function getStudyPlanTree(req: Request, res: Response) {
  const tree = await fetchStudyPlanTree(req.params.planId);
  if (!tree) {
    res.status(404).json({ errors: [{ message: "Study plan not found" }] });
    return;
  }
  res.json({ data: tree });
}

export async function getDefaultStudyPlanTree(_req: Request, res: Response) {
  const tree = await fetchDefaultStudyPlanTree();
  if (!tree) {
    res.status(404).json({ errors: [{ message: "No study plans available" }] });
    return;
  }
  res.json({ data: tree });
}
