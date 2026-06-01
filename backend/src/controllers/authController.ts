import { Request, Response } from "express";
import { prisma } from "../prisma";
import { createJwtToken, hashPassword, comparePassword, serializeUser } from "../utils/auth";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = createJwtToken(user.id);
  return res.json({ data: { user: serializeUser(user), token } });
};

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const passwordHash = await hashPassword(password);
  const finalRole = role === "admin" ? "admin" : "learner";
  const user = await prisma.user.create({ data: { name, email, passwordHash, role: finalRole } });
  const token = createJwtToken(user.id);

  return res.status(201).json({ data: { user: serializeUser(user), token } });
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ data: { user: serializeUser(user) } });
};

export const logout = async (_req: Request, res: Response) => {
  return res.json({ data: { success: true } });
};
