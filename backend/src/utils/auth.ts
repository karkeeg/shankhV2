import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export const createJwtToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

export const verifyJwtToken = (token?: string) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    return payload.userId || null;
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const serializeUser = (user: User) => ({
  id: user.id,
  name: user.name || "",
  email: user.email,
  role: user.role,
  planType: user.planType,
  avatarUrl: user.avatarUrl || null,
});
