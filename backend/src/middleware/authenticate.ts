import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../modules/auth/service.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
