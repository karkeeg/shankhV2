import { Request, Response } from "express";
import { prisma } from "../prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Framework library — reusable, fixed canvas diagrams used by case simulations.
//
// `structure` JSON shape:
//   { nodes: [{ id, label, x, y, shape, color, isBlank }], edges: [{ id, sourceId, targetId }] }
//   isBlank=false → locked node (label shown to learner)
//   isBlank=true  → blank input node (label is the EXPECTED value, hidden from learner)
// ─────────────────────────────────────────────────────────────────────────────

type FrameworkNode = { id: string; label?: string; x?: number; y?: number; shape?: string; color?: string; isBlank?: boolean };
type FrameworkStructure = { nodes?: FrameworkNode[]; edges?: any[] };

/** Remove the answer (label) from blank nodes so the learner never receives it. */
export function stripFrameworkAnswers(structure: any): FrameworkStructure {
  const s = (structure ?? {}) as FrameworkStructure;
  return {
    nodes: (s.nodes ?? []).map((n) => (n.isBlank ? { ...n, label: "" } : n)),
    edges: s.edges ?? [],
  };
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function adminListFrameworks(_req: Request, res: Response) {
  const frameworks = await prisma.framework.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ data: frameworks });
}

export async function adminGetFramework(req: Request, res: Response) {
  const { id } = req.params;
  const fw = await prisma.framework.findUnique({ where: { id } });
  if (!fw) return res.status(404).json({ error: "Not found" });
  return res.json({ data: fw });
}

export async function adminCreateFramework(req: Request, res: Response) {
  const { name, description, category, structure, isActive } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const fw = await prisma.framework.create({
    data: {
      name,
      description: description ?? null,
      category: category ?? null,
      structure: structure ?? { nodes: [], edges: [] },
      isActive: isActive ?? true,
    },
  });
  return res.status(201).json({ data: fw });
}

export async function adminUpdateFramework(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, category, structure, isActive } = req.body;
  const fw = await prisma.framework.update({
    where: { id },
    data: { name, description, category, structure, isActive },
  });
  return res.json({ data: fw });
}

export async function adminDeleteFramework(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.framework.delete({ where: { id } });
  return res.json({ data: { ok: true } });
}
