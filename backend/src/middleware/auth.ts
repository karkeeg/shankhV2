import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { verifyJwtToken } from "../utils/auth";

const getDemoUserId = async () => {
  const demoUser = await prisma.user.findUnique({ where: { email: "demo@shankh.com" } });
  return demoUser?.id || null;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || req.headers["x-access-token"] || "";
  const token = String(authHeader).replace(/^Bearer\s+/i, "").trim();

  const userId = verifyJwtToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.userId = userId;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const currentUserId = req.userId;
  const user = currentUserId
    ? await prisma.user.findUnique({ where: { id: currentUserId } })
    : null;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || req.headers["x-access-token"] || "";
  const token = String(authHeader).replace(/^Bearer\s+/i, "").trim();

  const userId = verifyJwtToken(token);
  if (userId) {
    req.userId = userId;
  }
  next();
};

export const getUserIdFromRequest = async (req: Request) => {
  const authHeader = req.headers.authorization || req.headers["x-access-token"] || "";
  const token = String(authHeader).replace(/^Bearer\s+/i, "").trim();
  const userId = verifyJwtToken(token);
  return userId || (await getDemoUserId());
};
