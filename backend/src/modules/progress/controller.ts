import { Response } from "express";
import * as progressService from "./service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function getUserProgress(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;
    const studyPlanId = req.query.studyPlanId as string;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const data = await progressService.getUserProgress(userId, studyPlanId);
    res.json({ data });
  } catch (error) {
    console.error("Progress Error:", error);
    res.status(500).json({ error: "Failed to fetch user progress" });
  }
}

export async function recordAttempt(req: AuthenticatedRequest, res: Response) {
  try {
    const { activityId, scorePercent, checkCount, hintsUsedCount, status, studyPlanId, answers } = req.body;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await progressService.recordAttempt({
      userId,
      activityId,
      scorePercent,
      checkCount,
      hintsUsedCount,
      status,
      studyPlanId,
      answers
    });
    res.json({ data });
  } catch (error: any) {
    console.error("Record Attempt Error Details:", {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ error: "Failed to record attempt", details: error.message });
  }
}



