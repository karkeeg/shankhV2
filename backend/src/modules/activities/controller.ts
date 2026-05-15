import type { Request, Response } from "express";
import { fetchPublishedActivity, fetchPublishedActivityBySlug } from "./service.js";

export async function getActivityById(req: Request, res: Response) {
  const activity = await fetchPublishedActivity(req.params.activityId);
  if (!activity) {
    res.status(404).json({ errors: [{ message: "Activity not found" }] });
    return;
  }
  res.json({ data: activity });
}

export async function getActivityBySlug(req: Request, res: Response) {
  const activity = await fetchPublishedActivityBySlug(req.params.activitySlug);
  if (!activity) {
    res.status(404).json({ errors: [{ message: "Activity not found" }] });
    return;
  }
  res.json({ data: activity });
}
