import { Request, Response } from "express";
import * as authService from "./service.js";

export async function register(req: Request, res: Response) {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const data = await authService.register({ email, name, password });
    res.json({ data });
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(400).json({ error: error.message || "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }
    const data = await authService.login({ email, password });
    res.json({ data });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(401).json({ error: error.message || "Login failed" });
  }
}
