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

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { name, phone, avatarUrl } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });

  return res.json({ data: { user: serializeUser(updatedUser) } });
};

export const changePassword = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old password and new password are required" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isValid = await comparePassword(oldPassword, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Old password is incorrect" });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  return res.json({ data: { success: true } });
};

export const onboard = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { name, username, phone, profession, level, goal, firstTopic } = req.body;

  try {
    if (username) {
      const trimmedUsername = username.trim();
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: { equals: trimmedUsername, mode: "insensitive" },
          id: { not: userId },
        },
      });
      if (existingUsername) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        username: username !== undefined ? username.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        profession: profession !== undefined ? profession : undefined,
        level: level !== undefined ? level : undefined,
        goal: goal !== undefined ? goal : undefined,
        firstTopic: firstTopic !== undefined ? firstTopic : undefined,
        isOnboarded: true,
      },
    });

    return res.json({ data: { user: serializeUser(updatedUser) } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to complete onboarding" });
  }
};
