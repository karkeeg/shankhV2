import { prisma } from "../../prisma.js";
import { Request, Response } from "express";

export async function logEvent(req: Request, res: Response) {
  try {
    const { event, payload, userId = "cmoldwyqa0000qizwh9sxx50a" } = req.body;
    
    console.log(`[TELEMETRY] User ${userId}: ${event}`, payload);
    
    // For now, we just log to console or a simple table if it existed.
    // In production, this would go to a Telemetry table or Segment/Mixpanel.
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to log event" });
  }
}
