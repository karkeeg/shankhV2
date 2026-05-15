import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";

function getSecret() {
  return process.env.JWT_SECRET || "shankh-v2-dev-secret-change-me";
}

const JWT_EXPIRES_IN = "7d";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export async function register(data: {
  email: string;
  name: string;
  password: string;
}) {
  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("A user with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: "user",
    },
  });

  // Generate JWT
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}

export async function login(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, getSecret()) as AuthPayload;
}
