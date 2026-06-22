
import { Request, Response } from "express";
import { prisma } from "../prisma";
import { v4 as uuidv4 } from "uuid";
import { stripFrameworkAnswers } from "./frameworkController";

type ResolvedFramework = { id: string; name: string; description: string | null; category: string | null; structure: any };

// Resolve the frameworks a case offers, WITH answers intact. Each case OWNS its
// framework copy: the `frameworkSnapshots` stored on the activity is the single
// source of truth, so later edits to the master library never change a case.
// Used by BOTH the learner-hydrate path and the grade path so they always agree.
function resolveCaseFrameworks(d: any): ResolvedFramework[] {
  const ids: string[] = d.frameworkIds ?? [];
  const snapshots: Record<string, any> = d.frameworkSnapshots ?? {};
  // Preserve the admin-defined order; tolerate a missing snapshot entry.
  return ids
    .map((id) => snapshots[id])
    .filter(Boolean)
    .map((s) => ({ id: s.id, name: s.name, description: s.description ?? null, category: s.category ?? null, structure: s.structure }));
}

// Hydrate a framework-mode canvas activity for the LEARNER: offer the WHOLE active
// framework library as options (exactly one is correct, never leaked) so the learner
// must recognise the right framework for the case. The correct framework is served
// from the case's frozen snapshot (so what the learner sees == what grading uses);
// every other library framework is served from its live copy. Answers always stripped.
async function hydrateFrameworkActivityForLearner(activity: any): Promise<any> {
  const d = activity.activityData as any;
  if (activity.activityType !== "canvas" || d?.mode !== "framework") return activity;

  const { correctFrameworkId, frameworkSnapshots, frameworkIds, ...safe } = d; // drop answer key + raw copies
  const snapshots: Record<string, any> = frameworkSnapshots ?? {};

  const library = await prisma.framework.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const toOption = (src: { id: string; name: string; description: string | null; category: string | null; structure: any }) => ({
    id: src.id,
    name: src.name,
    description: src.description ?? null,
    category: src.category ?? null,
    structure: stripFrameworkAnswers(src.structure), // hide blank answers from the learner
  });

  // Prefer the frozen snapshot for the correct framework; live copy for the rest.
  const frameworks = library.map((f) =>
    f.id === correctFrameworkId && snapshots[f.id] ? toOption(snapshots[f.id]) : toOption(f)
  );

  // Safety net: if the correct framework was de-activated/deleted from the library,
  // still surface it from the snapshot so the case remains answerable.
  if (correctFrameworkId && snapshots[correctFrameworkId] && !frameworks.some((f) => f.id === correctFrameworkId)) {
    frameworks.push(toOption(snapshots[correctFrameworkId]));
  }

  return { ...activity, activityData: { ...safe, frameworks } };
}

// ─── User-facing ──────────────────────────────────────────────────────────────

// GET /api/v1/cases  — list published simulations
export async function listCases(req: Request, res: Response) {
  const userId = (req as any).userId as string;

  const cases = await prisma.caseSimulation.findMany({
    where: { isPublished: true },
    orderBy: { orderIndex: "asc" },
    include: {
      _count: { select: { caseStudies: true, caseActivities: true } },
      caseSessions: userId ? { where: { userId }, select: { status: true, studiesRead: true, completedCount: true, totalActivities: true, score: true } } : false,
    },
  });

  return res.json({
    data: cases.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      studyCount: c._count.caseStudies,
      activityCount: c._count.caseActivities,
      session: (c.caseSessions as any[])?.[0] ?? null,
    })),
  });
}

// GET /api/v1/cases/:id  — full detail with studies + activities
export async function getCaseDetail(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId as string;

  const sim = await prisma.caseSimulation.findFirst({
    where: { id, isPublished: true },
    include: {
      caseStudies: { orderBy: { orderIndex: "asc" } },
      caseActivities: { orderBy: { orderIndex: "asc" } },
      caseSessions: userId ? { where: { userId } } : false,
    },
  });
  if (!sim) return res.status(404).json({ error: "Not found" });

  const session = (sim.caseSessions as any[])?.[0] ?? null;

  // Attach submitted responses to activities
  let responses: any[] = [];
  if (session) {
    responses = await prisma.caseActivityResponse.findMany({ where: { sessionId: session.id } });
  }

  const caseActivities = await Promise.all(
    sim.caseActivities.map(async (a) => {
      const hydrated = await hydrateFrameworkActivityForLearner(a);
      return { ...hydrated, response: responses.find((r) => r.caseActivityId === a.id) ?? null };
    })
  );

  return res.json({
    data: {
      id: sim.id,
      title: sim.title,
      description: sim.description,
      difficulty: sim.difficulty,
      caseStudies: sim.caseStudies,
      caseActivities,
      session,
    },
  });
}

// POST /api/v1/cases/:id/session  — get or create user session
export async function getOrCreateSession(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId as string;

  const sim = await prisma.caseSimulation.findFirst({ where: { id, isPublished: true }, include: { _count: { select: { caseActivities: true } } } });
  if (!sim) return res.status(404).json({ error: "Not found" });

  try {
    const session = await prisma.userCaseSession.upsert({
      where: { userId_caseSimulationId: { userId, caseSimulationId: id } },
      create: { userId, caseSimulationId: id, totalActivities: sim._count.caseActivities },
      update: {},
    });
    return res.json({ data: session });
  } catch (err: any) {
    // P2002 = race condition (duplicate concurrent request) — fetch the row that won
    if (err.code === "P2002") {
      const existing = await prisma.userCaseSession.findUnique({
        where: { userId_caseSimulationId: { userId, caseSimulationId: id } },
      });
      if (existing) return res.json({ data: existing });
    }
    throw err;
  }
}

// POST /api/v1/cases/:id/session/mark-read  — mark studies as read, move to testing
export async function markStudiesRead(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId as string;

  const session = await prisma.userCaseSession.findUnique({ where: { userId_caseSimulationId: { userId, caseSimulationId: id } } });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const updated = await prisma.userCaseSession.update({
    where: { id: session.id },
    data: { studiesRead: true, status: "testing" },
  });
  return res.json({ data: updated });
}

// POST /api/v1/cases/:id/activities/:activityId/draft
// Persist an in-progress response (layout + typed values) WITHOUT grading or
// counting it toward completion. Lets the learner save the canvas and resume
// later. No-op if the activity was already finally submitted.
export async function saveCaseActivityDraft(req: Request, res: Response) {
  const { id, activityId } = req.params;
  const userId = (req as any).userId as string;
  const { responseData, recommendationText } = req.body;

  const session = await prisma.userCaseSession.findUnique({ where: { userId_caseSimulationId: { userId, caseSimulationId: id } } });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const existing = await prisma.caseActivityResponse.findUnique({
    where: { sessionId_caseActivityId: { sessionId: session.id, caseActivityId: activityId } },
  });
  // Already graded/submitted → keep the final answer untouched.
  if (existing && !existing.isDraft) return res.json({ data: { response: existing, draft: false } });

  // Only overwrite the recommendation when the client actually sends one, so a
  // canvas-only autosave doesn't wipe text the learner typed earlier (or vice versa).
  const recPatch = recommendationText !== undefined ? { recommendationText } : {};

  const response = await prisma.caseActivityResponse.upsert({
    where: { sessionId_caseActivityId: { sessionId: session.id, caseActivityId: activityId } },
    create: { sessionId: session.id, caseActivityId: activityId, responseData, recommendationText: recommendationText ?? null, scorePct: null, isDraft: true },
    update: { responseData, ...recPatch, isDraft: true },
  });
  return res.json({ data: { response, draft: true } });
}

// POST /api/v1/cases/:id/activities/:activityId/submit
export async function submitCaseActivity(req: Request, res: Response) {
  const { id, activityId } = req.params;
  const userId = (req as any).userId as string;
  const { responseData, recommendationText } = req.body;

  const session = await prisma.userCaseSession.findUnique({ where: { userId_caseSimulationId: { userId, caseSimulationId: id } } });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const activity = await prisma.caseActivity.findFirst({ where: { id: activityId, caseSimulationId: id } });
  if (!activity) return res.status(404).json({ error: "Activity not found" });

  // Grade — canvas activities return full breakdown, others just a score.
  // The recommendation text is qualitative and does not affect the score.
  const gradeInfo = await gradeActivityFull(activity, responseData);
  const { scorePct } = gradeInfo;

  // Preserve any draft recommendation if this final submit omits the field.
  const recPatch = recommendationText !== undefined ? { recommendationText } : {};

  const response = await prisma.caseActivityResponse.upsert({
    where: { sessionId_caseActivityId: { sessionId: session.id, caseActivityId: activityId } },
    create: { sessionId: session.id, caseActivityId: activityId, responseData, recommendationText: recommendationText ?? null, scorePct, isDraft: false },
    update: { responseData, ...recPatch, scorePct, isDraft: false },
  });

  // Recalculate session progress — drafts don't count as completed.
  const allResponses = await prisma.caseActivityResponse.findMany({ where: { sessionId: session.id } });
  const graded = allResponses.filter((r) => !r.isDraft);
  const completedCount = graded.length;
  const avgScore = graded.reduce((s, r) => s + (r.scorePct ?? 0), 0) / (graded.length || 1);
  const isComplete = completedCount >= session.totalActivities;

  await prisma.userCaseSession.update({
    where: { id: session.id },
    data: {
      completedCount,
      score: avgScore,
      status: isComplete ? "completed" : "testing",
      completedAt: isComplete ? new Date() : null,
    },
  });

  return res.json({ data: { response, scorePct, gradeBreakdown: gradeInfo, completedCount, totalActivities: session.totalActivities, allComplete: isComplete } });
}

function gradeCanvasEdges(
  userEdges: { sourceId: string; targetId: string }[],
  solutionEdges: { sourceId: string; targetId: string }[]
) {
  const eKey = (e: { sourceId: string; targetId: string }) => `${e.sourceId}→${e.targetId}`;
  const solutionSet = new Set(solutionEdges.map(eKey));
  const userSet     = new Set(userEdges.map(eKey));
  const correct = [...userSet].filter(k => solutionSet.has(k));
  const wrong   = [...userSet].filter(k => !solutionSet.has(k));
  const missing = [...solutionSet].filter(k => !userSet.has(k));
  const scorePct = solutionEdges.length > 0
    ? Math.round((correct.length / solutionEdges.length) * 100)
    : 100;
  return { scorePct, correct, wrong, missing };
}

// Framework-mode canvas: learner picks one framework and fills its blank nodes.
// Wrong framework pick → 0 (the filled blanks belong to a different diagram).
// Correct pick → % of blank nodes whose typed value matches the expected label.
async function gradeFramework(d: any, responseData: any): Promise<{ scorePct: number; [k: string]: any }> {
  const selectedFrameworkId: string | undefined = responseData.selectedFrameworkId;
  const filledValues: Record<string, string> = responseData.filledValues ?? {};

  if (!selectedFrameworkId) return { scorePct: 0, wrongFramework: true };
  if (selectedFrameworkId !== d.correctFrameworkId) {
    return { scorePct: 0, wrongFramework: true, selectedFrameworkId };
  }

  // Grade against the case's OWN framework copy — the exact structure the learner saw.
  const resolved = resolveCaseFrameworks(d);
  const fw = resolved.find((f) => f.id === selectedFrameworkId);
  const nodes: any[] = fw?.structure?.nodes ?? [];
  const blanks = nodes.filter((n) => n.isBlank);
  if (!blanks.length) return { scorePct: 100, correct: [], wrong: [], missing: [] };

  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
  const correct: string[] = [];
  const wrong: string[] = [];
  const missing: string[] = [];
  const expected: Record<string, string> = {};
  for (const n of blanks) {
    expected[n.id] = n.label;
    const typed = filledValues[n.id];
    if (typed === undefined || norm(typed) === "") missing.push(n.id);
    else if (norm(typed) === norm(n.label)) correct.push(n.id);
    else wrong.push(n.id);
  }
  // `expected` is returned only in the submit grade breakdown (post-submission review).
  return { scorePct: Math.round((correct.length / blanks.length) * 100), correct, wrong, missing, expected };
}

async function gradeActivityFull(activity: any, responseData: any): Promise<{ scorePct: number; [k: string]: any }> {
  const d = activity.activityData as any;

  if (activity.activityType === "mcq") {
    const questions: any[] = d.questions ?? [];
    const answers: { questionId: string; selectedOptionId: string }[] = responseData.answers ?? [];
    if (!answers.length) return { scorePct: 0 };
    let correct = 0;
    for (const q of questions) {
      const correctOpt = (q.options ?? []).find((o: any) => o.isCorrect);
      const submitted = answers.find((a) => a.questionId === q.id);
      if (correctOpt && submitted?.selectedOptionId === correctOpt.id) correct++;
    }
    return { scorePct: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0 };
  }

  if (activity.activityType === "quantus") {
    const correctAnswers: Record<string, string> = d.correctAnswers ?? {};
    const submitted: Record<string, string> = responseData.inputSnapshot ?? {};
    const keys = Object.keys(correctAnswers);
    if (!keys.length) return { scorePct: 100 };
    const correct = keys.filter((k) => String(submitted[k] ?? "").trim() === String(correctAnswers[k]).trim()).length;
    return { scorePct: Math.round((correct / keys.length) * 100) };
  }

  if (activity.activityType === "canvas") {
    // Framework mode — pick the correct framework + fill blank nodes.
    if (d.mode === "framework") return gradeFramework(d, responseData);

    const solution = d.solutionSnapshot as { edges: { sourceId: string; targetId: string }[] } | null;
    if (!solution?.edges?.length) return { scorePct: 100 };

    // Accept both submission formats:
    // - Activity-page canvas path: responseData.canvasData.edges = [{ from, to }]
    // - Direct edge path: responseData.edges = [{ sourceId, targetId }]
    let userEdges: { sourceId: string; targetId: string }[] = [];
    if (responseData.edges?.length) {
      userEdges = responseData.edges;
    } else if (responseData.canvasData?.edges?.length) {
      userEdges = responseData.canvasData.edges.map((e: any) => ({
        sourceId: e.from ?? e.sourceId,
        targetId: e.to ?? e.targetId,
      }));
    }

    return gradeCanvasEdges(userEdges, solution.edges);
  }

  return { scorePct: 0 };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminListCases(req: Request, res: Response) {
  const cases = await prisma.caseSimulation.findMany({
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { caseStudies: true, caseActivities: true } } },
  });
  return res.json({ data: cases });
}

export async function adminCreateCase(req: Request, res: Response) {
  const { title, description, difficulty, isPublished, orderIndex } = req.body;
  const sim = await prisma.caseSimulation.create({
    data: { title, description, difficulty: difficulty ?? "medium", isPublished: isPublished ?? false, orderIndex: orderIndex ?? 0 },
  });
  return res.status(201).json({ data: sim });
}

export async function adminUpdateCase(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, difficulty, isPublished, orderIndex } = req.body;
  const sim = await prisma.caseSimulation.update({
    where: { id },
    data: { title, description, difficulty, isPublished, orderIndex },
  });
  return res.json({ data: sim });
}

export async function adminDeleteCase(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.caseSimulation.delete({ where: { id } });
  return res.json({ data: { ok: true } });
}

export async function adminGetCase(req: Request, res: Response) {
  const { id } = req.params;
  const sim = await prisma.caseSimulation.findUnique({
    where: { id },
    include: {
      caseStudies: { orderBy: { orderIndex: "asc" } },
      caseActivities: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!sim) return res.status(404).json({ error: "Not found" });
  return res.json({ data: sim });
}

// ─── Case Studies admin ───────────────────────────────────────────────────────

export async function adminAddStudy(req: Request, res: Response) {
  const { id } = req.params;
  const { title, content, orderIndex } = req.body;
  const study = await prisma.caseStudy.create({
    data: { caseSimulationId: id, title, content, orderIndex: orderIndex ?? 0 },
  });
  return res.status(201).json({ data: study });
}

export async function adminUpdateStudy(req: Request, res: Response) {
  const { studyId } = req.params;
  const { title, content, orderIndex } = req.body;
  const study = await prisma.caseStudy.update({ where: { id: studyId }, data: { title, content, orderIndex } });
  return res.json({ data: study });
}

export async function adminDeleteStudy(req: Request, res: Response) {
  const { studyId } = req.params;
  await prisma.caseStudy.delete({ where: { id: studyId } });
  return res.json({ data: { ok: true } });
}

// ─── Case Activities admin ────────────────────────────────────────────────────

export async function adminAddActivity(req: Request, res: Response) {
  const { id } = req.params;
  const { activityType, activityData, orderIndex } = req.body;

  // Auto-generate IDs for MCQ questions/options if missing
  if (activityType === "mcq" && activityData?.questions) {
    activityData.questions = activityData.questions.map((q: any) => ({
      id: q.id || uuidv4(),
      ...q,
      options: (q.options ?? []).map((o: any) => ({ id: o.id || uuidv4(), ...o })),
    }));
  }

  const activity = await prisma.caseActivity.create({
    data: { caseSimulationId: id, activityType, activityData, orderIndex: orderIndex ?? 0 },
  });
  return res.status(201).json({ data: activity });
}

export async function adminUpdateActivity(req: Request, res: Response) {
  const { activityId } = req.params;
  const { activityData, orderIndex } = req.body;

  if (activityData?.questions) {
    activityData.questions = activityData.questions.map((q: any) => ({
      id: q.id || uuidv4(),
      ...q,
      options: (q.options ?? []).map((o: any) => ({ id: o.id || uuidv4(), ...o })),
    }));
  }

  const activity = await prisma.caseActivity.update({
    where: { id: activityId },
    data: { activityData, orderIndex },
  });
  return res.json({ data: activity });
}

export async function adminDeleteActivity(req: Request, res: Response) {
  const { activityId } = req.params;
  await prisma.caseActivity.delete({ where: { id: activityId } });
  return res.json({ data: { ok: true } });
}
