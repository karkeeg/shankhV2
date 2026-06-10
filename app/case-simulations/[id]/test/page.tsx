"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { casesApi } from "@/lib/api";
import {
  Loader2, ArrowLeft, ArrowRight, CheckCircle2,
  XCircle, ChevronLeft, ChevronRight, Trophy, X, RefreshCw, BookOpen,
  Minimize2, Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExcelGrid } from "@/components/exercise/ExcelGrid";
import { CanvasExercise } from "@/components/exercise/CanvasExercise";
import { CanvasToolkit } from "@/components/exercise/CanvasToolkit";
import { ScratchpadLauncher, ScratchpadPanel } from "@/components/scratchpad/Scratchpad";
import { scratchpadKey } from "@/lib/scratchpad";
import { CollapsiblePanel, PanelEdgeRail, PanelReopenTab, Resizer, useCollapsiblePanel, clamp } from "@/components/activity/panels";
import type { DragCategory, DragItem } from "@/types/exercise";
import { Logo } from "@/components/layout/Logo";
import { CaseStudiesModal } from "@/components/case/CaseStudiesModal";

const TYPE_META: Record<string, { label: string; color: string }> = {
  quantus: { label: "Spreadsheet", color: "bg-sky-100 text-sky-700 border-sky-200" },
  mcq: { label: "Multiple Choice", color: "bg-violet-100 text-violet-700 border-violet-200" },
  canvas: { label: "Framework Drill", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

// ─── MCQ Answer Review ────────────────────────────────────────────────────────

function CaseMcqReview({ questions, submittedAnswers }: {
  questions: any[];
  submittedAnswers: { questionId: string; selectedOptionId: string }[];
}) {
  const ansMap: Record<string, string> = {};
  for (const a of submittedAnswers) ansMap[a.questionId] = a.selectedOptionId;

  return (
    <div className="flex flex-col gap-5 p-6 sm:p-8 max-w-3xl mx-auto w-full">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">Answer Review</p>
      {questions.map((q: any, qi: number) => {
        const selectedId = ansMap[q.id];
        return (
          <div key={q.id} className="flex flex-col gap-2">
            <p className="text-sm font-extrabold text-zinc-900 leading-snug">Q{qi + 1}. {q.questionText}</p>
            <div className="flex flex-col gap-1.5">
              {(q.options ?? []).map((opt: any, oi: number) => {
                const isSelected = opt.id === selectedId;
                const isCorrect = opt.isCorrect;
                let style = "bg-zinc-50 border-zinc-200 text-zinc-600";
                if (isCorrect) style = "bg-[#01696F]/10 border-[#01696F]/30 text-[#01696F]";
                if (isSelected && !isCorrect) style = "bg-rose-50 border-rose-300 text-rose-800";
                return (
                  <div key={opt.id} className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold", style)}>
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border",
                      isCorrect ? "bg-[#01696F] text-white border-transparent"
                        : isSelected ? "bg-rose-500 text-white border-transparent"
                          : "bg-white border-zinc-300 text-zinc-500"
                    )}>{String.fromCharCode(65 + oi)}</span>
                    <span className="flex-1">{opt.optionText}</span>
                    {isSelected && !isCorrect && <XCircle size={14} className="text-rose-500 shrink-0" fill="currentColor" />}
                    {isCorrect && <CheckCircle2 size={14} className="text-[#01696F] shrink-0" fill="currentColor" />}
                  </div>
                );
              })}
            </div>
            {q.explanation && (
              <p className="text-[10px] text-zinc-500 font-medium bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100 leading-relaxed">
                💡 {q.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Single MCQ Question Review (shuffled mode) ───────────────────────────────

function SingleMcqReview({ question, selectedOptionId }: { question: any; selectedOptionId?: string }) {
  return (
    <div className="flex flex-col gap-4 p-6 sm:p-10 max-w-3xl mx-auto w-full min-h-full justify-center animate-fade-in">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">Answer Review</p>
      <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">{question.questionText}</h2>
      <div className="flex flex-col gap-2">
        {(question.options ?? []).map((opt: any, oi: number) => {
          const isSelected = opt.id === selectedOptionId;
          const isCorrect = opt.isCorrect;
          let style = "bg-zinc-50 border-zinc-200 text-zinc-600";
          if (isCorrect) style = "bg-[#01696F]/10 border-[#01696F]/30 text-[#01696F]";
          if (isSelected && !isCorrect) style = "bg-rose-50 border-rose-300 text-rose-800";
          return (
            <div key={opt.id} className={cn("flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-sm", style)}>
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 border",
                isCorrect ? "bg-[#01696F] text-white border-transparent" : isSelected ? "bg-rose-500 text-white border-transparent" : "bg-white border-zinc-300 text-zinc-500"
              )}>{String.fromCharCode(65 + oi)}</span>
              <span className="flex-1">{opt.optionText}</span>
              {isSelected && !isCorrect && <XCircle size={16} className="text-rose-500 shrink-0" fill="currentColor" />}
              {isCorrect && <CheckCircle2 size={16} className="text-[#01696F] shrink-0" fill="currentColor" />}
            </div>
          );
        })}
      </div>
      {question.explanation && (
        <p className="text-xs text-zinc-500 font-medium bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100 leading-relaxed">
          💡 {question.explanation}
        </p>
      )}
    </div>
  );
}

// ─── Quantus Answer Review ────────────────────────────────────────────────────

function CaseQuantusReview({ actData, submittedSnapshot }: {
  actData: any;
  submittedSnapshot: Record<string, string>;
}) {
  const { gridRows, gridCols, correctAnswers } = actData;
  if (!gridRows?.length || !gridCols?.length) return null;
  return (
    <div className="p-4 overflow-x-auto">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60 mb-3">Answer Review</p>
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="p-1.5 border border-zinc-200 bg-zinc-100 text-left font-black text-zinc-500" />
            {gridCols.map((col: string) => (
              <th key={col} className="p-1.5 border border-zinc-200 bg-zinc-100 text-center font-black text-zinc-600">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gridRows.map((row: string, rIdx: number) => (
            <tr key={row}>
              <td className="p-1.5 border border-zinc-200 bg-zinc-50 font-bold text-zinc-600">{row}</td>
              {gridCols.map((col: string, cIdx: number) => {
                if (cIdx === 0) return null;
                const k = `${row}-${col}`;
                const userVal = submittedSnapshot[`${rIdx}-${cIdx}`] ?? submittedSnapshot[k] ?? "";
                const correctVal = correctAnswers?.[k] ?? "";
                const hasAnswer = correctVal !== "" && correctVal !== undefined;
                if (!hasAnswer) return <td key={col} className="p-1.5 border border-zinc-200 text-center text-zinc-500">{userVal || ""}</td>;
                const isCorrect = String(userVal).trim() === String(correctVal).trim();
                return (
                  <td key={col} className={cn("p-1.5 border text-center font-bold", isCorrect ? "bg-[#01696F]/10 border-[#01696F]/20 text-[#01696F]" : "bg-rose-50 border-rose-200 text-rose-700")}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{userVal || "—"}</span>
                      {!isCorrect && <span className="text-[9px] text-emerald-600 font-black">✓ {correctVal}</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TypePill({ type }: { type: string }) {
  const m = TYPE_META[type] ?? { label: type, color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  return <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", m.color)}>{m.label}</span>;
}

function Feedback({ feedback, onClose }: { feedback: any; onClose: () => void }) {
  if (!feedback) return null;
  const ok = !feedback.isError;
  return (
    <div className={cn(
      "absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(480px,calc(100%-2rem))] rounded-2xl shadow-2xl border animate-fade-in-up overflow-hidden",
      ok ? "bg-[#01696F]/10 border-[#01696F]/20" : "bg-rose-50 border-rose-200"
    )}>
      <div className={cn("h-1 w-full", ok ? "bg-emerald-500" : "bg-rose-500")} />
      <div className="px-5 py-4 flex items-start gap-3">
        <div className={cn("mt-0.5 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center", ok ? "bg-emerald-100" : "bg-rose-100")}>
          {ok ? <CheckCircle2 size={18} className="text-emerald-600" fill="currentColor" /> : <XCircle size={18} className="text-rose-500" fill="currentColor" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-bold", ok ? "text-emerald-800" : "text-rose-800")}>{feedback.message}</p>
          {ok && feedback.scorePct !== undefined && (
            <p className="text-[10px] text-emerald-600 font-extrabold mt-1">Score: {Math.round(feedback.scorePct)}%</p>
          )}
        </div>
        <button onClick={onClose} className={cn("w-7 h-7 rounded-full flex items-center justify-center", ok ? "hover:bg-emerald-100 text-emerald-500" : "hover:bg-rose-100 text-rose-400")}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Shuffle + Normalize ──────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Flattens case activities into individual steps:
 *   MCQ activity with N questions → N separate "mcq-question" steps
 *   Canvas / Quantus → one step each
 * Returns the steps shuffled, with already-completed steps at the end.
 */
function buildSteps(rawActivities: any[], doneStepIds: Set<string>): any[] {
  const flat: any[] = [];
  for (const a of rawActivities) {
    if (a.activityType === "mcq") {
      const questions: any[] = a.activityData?.questions ?? [];
      questions.forEach((q: any, qi: number) => {
        flat.push({
          id: `${a.id}-q${qi}`,
          activityId: a.id,
          stepType: "mcq-question" as const,
          question: q,
          allQuestions: questions,
          questionIndex: qi,
          activityData: a.activityData,
          response: a.response ?? null,
        });
      });
    } else {
      flat.push({
        id: a.id,
        activityId: a.id,
        stepType: a.activityType as "canvas" | "quantus",
        activityData: a.activityData,
        response: a.response ?? null,
      });
    }
  }
  const incomplete = shuffleArray(flat.filter(s => !doneStepIds.has(s.id)));
  const complete = flat.filter(s => doneStepIds.has(s.id));
  return [...incomplete, ...complete];
}

// ─── Extract token-based graph from a React Flow canvas ───────────────────────
// CanvasExercise emits React Flow { nodes, edges } where node IDs are instance
// IDs and the underlying token lives at node.data.tokenId. The case grader
// compares token-id edges, so we map instance IDs → token IDs here. Mirrors the
// extractCanvasGraph helper used by the learning + skill activity pages.

function extractCanvasGraph(canvasElements: any): { placedTokens: string[]; edges: { from: string; to: string }[] } {
  if (!canvasElements?.nodes) return { placedTokens: [], edges: [] };
  const nodeMap = new Map<string, string>(
    (canvasElements.nodes as any[]).map((n: any) => [n.id, n.data?.tokenId as string])
  );
  const placedTokens = (canvasElements.nodes as any[])
    .map((n: any) => n.data?.tokenId as string)
    .filter(Boolean);
  const edges = ((canvasElements.edges as any[]) ?? [])
    .map((e: any) => {
      const from = nodeMap.get(e.source);
      const to = nodeMap.get(e.target);
      return from && to ? { from, to } : null;
    })
    .filter(Boolean) as { from: string; to: string }[];
  return { placedTokens, edges };
}

// Panel resizing helpers (`Resizer`, `clamp`) now live in
// `@/components/activity/panels` and are shared across the activity screens.

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CaseTestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<any[]>([]);          // normalized + shuffled
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spreadsheetGrid, setSpreadsheetGrid] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  // Step-level completion (each MCQ question is its own step)
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  // Activity-level completion (what's submitted to the backend)
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number>>({});
  // Buffer MCQ answers per activityId; submit when all questions answered
  const [mcqBuffer, setMcqBuffer] = useState<Record<string, Record<string, string>>>({});
  const [showStudies, setShowStudies] = useState(false);
  const [studiesRead, setStudiesRead] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);   // whiteboard scratchpad panel
  const [centerOpen, setCenterOpen] = useState(true);  // main question workspace

  // Resizable panel widths (px) — VS Code-style draggable splitters
  const [boardWidth, setBoardWidth] = useState(460);

  // Left + right side panels: collapse state + width, persisted per case id.
  const {
    open: leftOpen, toggle: toggleLeft,
    width: leftWidth, resize: resizeLeft,
  } = useCollapsiblePanel(`case:${id}:left`, { defaultOpen: true, defaultWidth: 248, min: 180, max: 420 });
  const {
    open: rightOpen, setOpen: setRightOpen, toggle: toggleRight,
    width: activitiesWidth, resize: resizeRight,
  } = useCollapsiblePanel(`case:${id}:right`, { defaultOpen: false, defaultWidth: 312, min: 240, max: 520 });
  const [dragging, setDragging] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"instructions" | "context">("instructions");

  // Canvas state — React Flow graph emitted by CanvasExercise (same as learning)
  const [canvasElements, setCanvasElements] = useState<any>(null);
  const [canvasResetNonce, setCanvasResetNonce] = useState(0);

  useEffect(() => {
    if (!token) return;
    casesApi.startSession(id)
      .catch(() => {})
      .finally(() => {
        casesApi.detail<any>(id)
          .then((data) => {
            if (!data) return;
            setCaseData(data);

            const sess = data.session;
            const alreadyRead = sess?.studiesRead === true;
            setStudiesRead(alreadyRead);

            const rawActivities: any[] = data.caseActivities ?? [];

            // Build initial completion sets from existing responses
            const doneStepIds = new Set<string>();
            const doneActIds = new Set<string>();
            const sc: Record<string, number> = {};
            const initialBuffer: Record<string, Record<string, string>> = {};

            for (const a of rawActivities) {
              if (a.response) {
                doneActIds.add(a.id);
                sc[a.id] = a.response.scorePct ?? 0;
                if (a.activityType === "mcq") {
                  (a.activityData?.questions ?? []).forEach((_: any, qi: number) => doneStepIds.add(`${a.id}-q${qi}`));
                  const ansMap: Record<string, string> = {};
                  for (const ans of (a.response.responseData?.answers ?? [])) ansMap[ans.questionId] = ans.selectedOptionId;
                  initialBuffer[a.id] = ansMap;
                } else {
                  doneStepIds.add(a.id);
                }
              }
            }

            setCompletedStepIds(doneStepIds);
            setCompletedActivityIds(doneActIds);
            setScores(sc);
            setMcqBuffer(initialBuffer);
            setSteps(buildSteps(rawActivities, doneStepIds));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      });
  }, [id, token]);

  // ── Derived step values ────────────────────────────────────────────────────

  const step = steps[currentIdx];
  const actData = step?.activityData ?? {};
  const isStepDone = step ? completedStepIds.has(step.id) : false;
  const isActivityDone = step ? completedActivityIds.has(step.activityId) : false;
  const totalSteps = steps.length;
  const completedCount = completedStepIds.size;
  const allDone = totalSteps > 0 && completedCount >= totalSteps;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const isCanvasActive = step?.stepType === "canvas";
  const isCanvasSubmitted = isCanvasActive && isStepDone;

  // Reset UI state when navigating to a different step
  useEffect(() => {
    setSelectedOption(null);
    setFeedback(null);
    setCanvasElements(null);
    if (step?.stepType === "quantus") setSpreadsheetGrid(actData?.gridValues ?? {});
  }, [currentIdx]);

  // ── Canvas: palette → drag toolkit + review reconstruction ──────────────────
  // Mirror normalizeCaseSteps in the learning page: convert the stored
  // paletteItems (or legacy tokens) into the DragCategory[] shape CanvasToolkit
  // expects, so the case canvas behaves identically to lesson/skill canvases.

  const canvasPalette: { id: string; label: string; shape: string; color?: string }[] = useMemo(() => {
    if (actData?.paletteItems?.length) {
      return actData.paletteItems.map((p: any) => ({
        id: p.id, label: p.label, shape: p.shape ?? "rectangle", color: p.color,
      }));
    }
    return (actData?.tokens ?? []).map((t: any) => ({
      id: t.id, label: t.content || t.label || t.id, shape: t.type ?? "rectangle",
    }));
  }, [step]);

  const canvasDraggableElements = useMemo<DragCategory[]>(() => {
    if (!canvasPalette.length) return [];
    return [{
      category: "Nodes",
      items: canvasPalette.map((p): DragItem => ({
        id: p.id, label: p.label, content: p.label, type: (p.shape ?? "rectangle") as DragItem["type"],
      })),
    }];
  }, [canvasPalette]);

  // Review graph (disabled CanvasExercise after submission). Prefer the live
  // graph just submitted this session, then a stored React Flow snapshot, then
  // a reconstruction from solution node positions + submitted token edges.
  const canvasReviewElements = useMemo<any>(() => {
    if (!isCanvasActive || !isStepDone) return null;
    if (canvasElements?.nodes?.length) return canvasElements;

    const respData = step?.response?.responseData ?? {};
    if (respData.rf?.nodes?.length) return respData.rf;

    let tokenEdges: { sourceId: string; targetId: string }[] = [];
    if (respData.edges?.length) {
      tokenEdges = respData.edges;
    } else if (respData.canvasData?.edges?.length) {
      tokenEdges = respData.canvasData.edges.map((e: any) => ({
        sourceId: e.from ?? e.sourceId, targetId: e.to ?? e.targetId,
      }));
    }
    if (!tokenEdges.length || !canvasPalette.length) return null;

    const positions: { id: string; x: number; y: number }[] = actData?.solutionSnapshot?.nodePositions ?? [];
    const usedTokenIds = new Set<string>();
    tokenEdges.forEach((e) => { usedTokenIds.add(e.sourceId); usedTokenIds.add(e.targetId); });

    const nodes = canvasPalette
      .filter((item) => usedTokenIds.has(item.id))
      .map((item, idx) => {
        const pos = positions.find((p) => p.id === item.id);
        return {
          id: item.id,
          type: "tokenNode",
          position: { x: pos?.x ?? (60 + (idx % 4) * 190), y: pos?.y ?? (60 + Math.floor(idx / 4) * 110) },
          data: { tokenId: item.id, label: item.label, shape: item.shape ?? "rectangle" },
        };
      });
    const edges = tokenEdges.map((e, i) => ({
      id: `r-${i}`,
      source: e.sourceId,
      target: e.targetId,
      type: "deletable",
      markerEnd: { type: "arrowclosed", color: "#94a3b8", width: 14, height: 14 },
      style: { stroke: "#94a3b8", strokeWidth: 2 },
    }));
    return { nodes, edges };
  }, [isCanvasActive, isStepDone, canvasElements, step, canvasPalette]);

  // ── Excel helpers ──────────────────────────────────────────────────────────

  const excelTable = useMemo(() => {
    if (!Array.isArray(actData?.gridRows) || !Array.isArray(actData?.gridCols)) return [];
    return actData.gridRows.map((row: string) =>
      actData.gridCols.map((col: string) => actData.gridValues?.[`${row}-${col}`] ?? "")
    );
  }, [step]);

  const excelInputs = useMemo(() => {
    if (!Array.isArray(actData?.gridRows) || !Array.isArray(actData?.gridCols)) return [];
    const list: any[] = [];
    actData.gridRows.forEach((row: string, rIdx: number) => {
      actData.gridCols.forEach((col: string, cIdx: number) => {
        if (cIdx === 0) return;
        const k = `${row}-${col}`;
        if (actData.correctAnswers?.[k] !== undefined)
          list.push({ row: rIdx, col: cIdx, correctValue: actData.correctAnswers[k], placeholder: "", formula: actData.cellHints?.[k] || undefined });
      });
    });
    return list;
  }, [step]);

  // ── Submit: MCQ question (single, buffered) ────────────────────────────────

  const handleMcqAnswer = async () => {
    if (!step || step.stepType !== "mcq-question" || isStepDone) return;
    if (!selectedOption) { setFeedback({ isError: true, message: "Select an option first!" }); return; }

    const actId = step.activityId;
    const qId = step.question.id;

    const newBuffer: Record<string, Record<string, string>> = {
      ...mcqBuffer,
      [actId]: { ...(mcqBuffer[actId] ?? {}), [qId]: selectedOption! },
    };
    setMcqBuffer(newBuffer);
    setCompletedStepIds(prev => new Set([...prev, step.id]));

    // Show immediate correctness feedback
    const isCorrect = (step.question.options ?? []).find((o: any) => o.id === selectedOption)?.isCorrect ?? false;
    setFeedback({ isError: false, message: isCorrect ? "Correct! ✓" : "Recorded." });

    // If ALL questions of this MCQ activity are now buffered → submit to backend
    const allQs: any[] = step.allQuestions ?? [];
    const allAnswered = allQs.every((q: any) => newBuffer[actId]?.[q.id]);
    if (allAnswered) {
      setSubmitting(true);
      try {
        const answers = allQs.map((q: any) => ({ questionId: q.id, selectedOptionId: newBuffer[actId][q.id] }));
        const { scorePct, allComplete } = await casesApi.submitActivity<any>(id, actId, { responseData: { answers } });
        setCompletedActivityIds(prev => new Set([...prev, actId]));
        setScores(prev => ({ ...prev, [actId]: scorePct }));
        if (allComplete) setTimeout(() => router.push("/skill?section=case_simulations"), 2500);
      } catch { }
      finally { setSubmitting(false); }
    }

    // Auto-advance after brief feedback
    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      if (currentIdx < steps.length - 1) setCurrentIdx(p => p + 1);
    }, 900);
  };

  // ── Submit: Quantus ────────────────────────────────────────────────────────

  const handleQuantusSubmit = async () => {
    if (!step || step.stepType !== "quantus" || isStepDone) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const { scorePct, allComplete } = await casesApi.submitActivity<any>(id, step.activityId, { responseData: { inputSnapshot: spreadsheetGrid } });
      setCompletedStepIds(prev => new Set([...prev, step.id]));
      setCompletedActivityIds(prev => new Set([...prev, step.activityId]));
      setScores(prev => ({ ...prev, [step.activityId]: scorePct }));
      setFeedback({ isError: false, message: scorePct >= 60 ? `Score: ${Math.round(scorePct)}% ✓` : `Recorded. Score: ${Math.round(scorePct)}%`, scorePct });
      if (allComplete) setTimeout(() => router.push("/skill?section=case_simulations"), 2500);
    } catch (e: any) {
      setFeedback({ isError: true, message: e?.message || "Error submitting." });
    } finally { setSubmitting(false); }
  };

  // ── Submit: Canvas ─────────────────────────────────────────────────────────

  const handleCanvasSubmit = async () => {
    if (!step || step.stepType !== "canvas" || isStepDone) return;
    const graph = extractCanvasGraph(canvasElements);
    if (graph.placedTokens.length === 0) {
      setFeedback({ isError: true, message: "Drag some nodes onto the canvas first!" });
      return;
    }
    if (graph.edges.length === 0) {
      setFeedback({ isError: true, message: "Connect at least two nodes before submitting!" });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      // canvasData feeds the grader ({from,to} token edges); rf preserves the
      // full React Flow layout so the canvas can be reloaded in review mode.
      const { scorePct, allComplete } = await casesApi.submitActivity<any>(id, step.activityId, { responseData: { canvasData: graph, rf: canvasElements } });
      setCompletedStepIds(prev => new Set([...prev, step.id]));
      setCompletedActivityIds(prev => new Set([...prev, step.activityId]));
      setScores(prev => ({ ...prev, [step.activityId]: scorePct }));
      setFeedback({
        isError: false,
        message: scorePct >= 60 ? `Score: ${Math.round(scorePct)}% ✓` : `Recorded. Score: ${Math.round(scorePct)}%`,
        scorePct,
      });
      if (allComplete) setTimeout(() => router.push("/skill?section=case_simulations"), 2500);
    } catch (e: any) {
      setFeedback({ isError: true, message: e?.message || "Error submitting." });
    } finally { setSubmitting(false); }
  };

  const handleReset = () => {
    setFeedback(null);
    if (step?.stepType === "canvas") {
      setCanvasElements(null);
      setCanvasResetNonce(n => n + 1); // force CanvasExercise to remount blank
    } else if (step?.stepType === "mcq-question") {
      setSelectedOption(null);
    } else if (step?.stepType === "quantus") {
      setSpreadsheetGrid(actData?.gridValues ?? {});
    }
  };

  // ── Loading / empty states ─────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F]">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

  // Guard: studies not yet read (direct URL access before going through the modal on skill page)
  if (caseData && !studiesRead) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] gap-4 text-zinc-600 p-8 text-center">
      <BookOpen size={40} className="text-[#01696F] opacity-40" />
      <p className="font-extrabold text-lg text-zinc-800">Read the case studies first</p>
      <p className="text-sm text-zinc-500 max-w-sm">You need to read through the case studies before starting the activities.</p>
      <button
        onClick={() => router.push("/skill?section=case_simulations")}
        className="px-6 py-2.5 bg-[#01696F] text-white text-sm font-black rounded-2xl hover:bg-[#01696F]/90 shadow-sm transition-all active:scale-95"
      >
        ← Back to Cases
      </button>
    </div>
  );

  if (!caseData || steps.length === 0) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] gap-4 text-zinc-600">
      <p className="font-semibold">No activities in this case simulation.</p>
      <button onClick={() => router.push("/skill?section=case_simulations")} className="text-[#01696F] underline text-sm">Back</button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-row h-screen overflow-hidden font-sans bg-white text-zinc-800 p-2 sm:p-3 gap-0">

      {/* Far-left edge rail — collapse / expand the left panel */}
      <PanelEdgeRail side="left" open={leftOpen} onToggle={toggleLeft} label="case panel" />

      {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
      <CollapsiblePanel
        side="left"
        open={leftOpen}
        width={leftWidth}
        dragging={dragging}
        resizable
        onResize={resizeLeft}
        onDragState={setDragging}
        innerClassName="h-full flex flex-col justify-between pr-2"
      >
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">

            {/* Logo + navigation buttons */}
            <div className="flex flex-col items-center gap-2 border-b border-zinc-100 pb-3 pt-1">
              <div className="w-full flex justify-center">
                <Logo variant="full" width={110} height={32} className="object-contain" style={{ width: "auto", height: "auto" }} />
              </div>
              <button
                onClick={() => router.push("/skill?section=case_simulations")}
                className="w-full py-1.5 bg-[#DFEAEA] text-[#01696F] hover:bg-[#D7E8E9] font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-[#01696F]/10"
              >
                ← Back to Cases
              </button>
              <button
                onClick={() => setShowStudies(true)}
                className="w-full py-1.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-zinc-200"
              >
                📖 Review Studies
              </button>
            </div>

            {/* Progress */}
            <div className="flex flex-col gap-1.5 px-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progress</span>
                <span className="text-[10px] font-black text-[#01696F]">{completedCount}/{totalSteps}</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                <div className="h-full bg-[#01696F] rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
              {allDone && (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <p className="text-[10px] text-emerald-600 font-bold text-center">🎉 All activities complete!</p>
                  <button
                    onClick={() => router.push("/skill?section=case_simulations")}
                    className="w-full py-2 bg-[#01696F] hover:bg-[#01696F]/90 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Finish Case <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Activity type pill + position */}
            <div className="flex items-center justify-between px-1">
              {step && <TypePill type={step.stepType === "mcq-question" ? "mcq" : step.stepType} />}
              <span className="text-[10px] font-bold text-zinc-400">{currentIdx + 1}/{totalSteps}</span>
            </div>

            {/* Instructions / Context tabs */}
            <div className="flex bg-[#F0EDE7] p-1 rounded-full w-full border border-zinc-200/50 shadow-sm">
              {(["instructions", "context"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveLeftTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all duration-200 capitalize",
                    activeLeftTab === tab ? "bg-[#28251D] text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content card */}
            <div className="bg-[#FAF7F2] shadow-[0_2px_4px_0_#0000001F_inset] border border-[#F0EDE7] rounded-2xl p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
              <div className="flex items-start justify-between gap-2 border-b border-zinc-200/50 pb-2">
                <h3 className="font-extrabold text-zinc-900 text-xs leading-tight tracking-tight">
                  {caseData?.title || "Case Simulation"}
                </h3>
                {step && (
                  <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest shrink-0",
                    TYPE_META[step.stepType === "mcq-question" ? "mcq" : step.stepType]?.color ?? "bg-zinc-100 text-zinc-600 border-zinc-200")}>
                    {step.stepType === "mcq-question" ? "mcq" : step.stepType}
                  </span>
                )}
              </div>

              {activeLeftTab === "instructions" ? (
                <div className="animate-fade-in">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">Instructions</span>
                  <p className="text-xs text-zinc-700 leading-relaxed font-semibold whitespace-pre-line">
                    {actData?.instructions || "Complete the activity and submit your answer."}
                  </p>
                </div>
              ) : actData?.context ? (
                <div className="animate-fade-in">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">Context & Scenario</span>
                  <p className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line">{actData.context}</p>
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400 font-medium italic">No context provided.</p>
              )}

              {/* Canvas modeling toolkit inside content card — active mode only.
                  Same drag-and-drop toolkit used by the learning + skill pages. */}
              {isCanvasActive && !isCanvasSubmitted && (
                <CanvasToolkit draggableElements={canvasDraggableElements} />
              )}

              {/* Submitted note (after submission) */}
              {isCanvasActive && isCanvasSubmitted && (
                <div className="border-t border-zinc-200/50 pt-2">
                  <p className="text-[10px] font-semibold text-zinc-500 leading-relaxed">
                    ✓ Submitted{scores[step.activityId] !== undefined ? ` — score ${Math.round(scores[step.activityId])}%` : ""}. Your framework is shown on the canvas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User profile card */}
          <div className="bg-[#DFEAEA] border border-[#01696F]/10 rounded-2xl p-2.5 flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#01696F] font-bold shadow-sm flex-shrink-0 border border-zinc-200 text-xs">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-zinc-800 truncate">{user?.name ?? "Guest"}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Case Simulation</p>
            </div>
          </div>
      </CollapsiblePanel>

      {/* Center restore toggle — shown when the question workspace is minimized */}
      {!centerOpen && (
        <button
          onClick={() => setCenterOpen(true)}
          className="self-center z-20 flex-shrink-0 w-8 h-40 mx-1 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
              Question
            </span>
            <Maximize2 size={14} className="text-[#01696F] group-hover:scale-110 transition-transform duration-200" />
          </div>
        </button>
      )}

      {/* ══════════════════════ MAIN WORKSPACE ══════════════════════ */}
      <div className={cn(
        "min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden",
        !dragging && "transition-all duration-300 ease-in-out",
        centerOpen ? "flex-1 mx-1.5" : "w-0 flex-none mx-0 border-0"
      )}>

        {/* Toolbar — matches lesson activity page */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">

          {/* Left controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReset}
              disabled={isStepDone}
              className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              <RefreshCw size={11} /> Reset
            </button>

            <button
              onClick={() => { setCurrentIdx(p => Math.max(0, p - 1)); setFeedback(null); }}
              disabled={currentIdx === 0}
              className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
            >
              <ArrowLeft size={13} /> <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="text-[12px] font-semibold text-[#01696F] bg-[#E6F0F1] px-3 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none flex-shrink-0 whitespace-nowrap">
              {currentIdx + 1} / {totalSteps}
            </span>

            {allDone && currentIdx === totalSteps - 1 ? (
              <button
                onClick={() => router.push("/skill?section=case_simulations")}
                className="px-3 py-1.5 bg-[#01696F] hover:bg-[#01696F]/90 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 ring-2 ring-[#01696F]/30 flex-shrink-0"
              >
                <span className="hidden sm:inline">Finish Case</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={() => { setCurrentIdx(p => Math.min(totalSteps - 1, p + 1)); setFeedback(null); }}
                disabled={currentIdx >= totalSteps - 1}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">Next</span> <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setCenterOpen(false)}
              title="Minimize question — give the scratchpad more room"
              className="px-2.5 py-2 bg-white text-zinc-500 hover:text-[#01696F] border border-zinc-200 hover:border-[#01696F]/30 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              <Minimize2 size={13} /> 
            </button>
            <button
              onClick={
                isCanvasActive ? (isCanvasSubmitted ? undefined : handleCanvasSubmit)
                  : step?.stepType === "mcq-question" ? handleMcqAnswer
                    : handleQuantusSubmit
              }
              disabled={submitting || isStepDone}
              className="px-3 sm:px-4 py-2 bg-[#00A389] text-white hover:bg-[#00A389]/90 disabled:opacity-50 font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              {submitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">Checking…</span></>
              ) : isStepDone ? (
                <><CheckCircle2 size={13} /><span className="hidden sm:inline">Done</span></>
              ) : (
                <><span className="hidden sm:inline">Check Answer</span><span className="sm:hidden">Check</span></>
              )}
            </button>
          </div>
        </div>

        {/* Completed banner */}
        {isStepDone && !allDone && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[#01696F]/10 border-b border-[#01696F]/15 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" fill="currentColor" />
              <span className="text-xs font-bold text-emerald-700 truncate">
                {step?.stepType === "mcq-question"
                  ? `Q${(step?.questionIndex ?? 0) + 1} recorded${isActivityDone && scores[step?.activityId] !== undefined ? ` — MCQ score: ${Math.round(scores[step.activityId])}%` : ""}`
                  : `Activity complete${scores[step?.activityId] !== undefined ? ` — score: ${Math.round(scores[step.activityId])}%` : ""}`
                }
              </span>
            </div>
            <button
              onClick={() => { setCurrentIdx(p => Math.min(totalSteps - 1, p + 1)); setFeedback(null); }}
              disabled={currentIdx >= totalSteps - 1}
              className="px-3 py-1 text-[#01696F] bg-white border border-[#01696F]/20 hover:bg-[#E6F0F1] font-bold text-[10px] rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 flex-shrink-0"
            >
              Next <ArrowRight size={11} />
            </button>
          </div>
        )}

        {/* All done banner */}
        {allDone && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[#01696F] border-b border-[#01696F]/80 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-white shrink-0" fill="currentColor" />
              <span className="text-xs font-bold text-white">🎉 Case complete — all activities done!</span>
            </div>
            <button
              onClick={() => router.push("/skill?section=case_simulations")}
              className="px-4 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm flex-shrink-0"
            >
              Finish Case <ArrowRight size={11} />
            </button>
          </div>
        )}

        {/* Activity area */}
        <div className="flex-1 overflow-auto relative">

          {/* ── MCQ question (individual, shuffled) ── */}
          {step?.stepType === "mcq-question" && (
            isStepDone ? (
              <SingleMcqReview
                question={step.question}
                selectedOptionId={
                  mcqBuffer[step.activityId]?.[step.question.id] ??
                  step.response?.responseData?.answers?.find((a: any) => a.questionId === step.question.id)?.selectedOptionId
                }
              />
            ) : (
              <div className="flex flex-col p-6 sm:p-10 justify-center max-w-3xl mx-auto space-y-8 animate-fade-in w-full min-h-full">
                
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">
                  {step.question.questionText}
                </h2>
                <div className="space-y-3">
                  {(step.question.options ?? []).map((opt: any, oi: number) => {
                    const isSel = selectedOption === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setSelectedOption(opt.id)}
                        className={cn("w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm active:scale-[0.99]",
                          isSel ? "bg-[#01696F] border-transparent text-white font-bold" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700 bg-white"
                        )}>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-sm",
                            isSel ? "bg-white text-[#01696F]" : "bg-white border border-zinc-200 text-zinc-700"
                          )}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="text-sm font-semibold tracking-tight">{opt.optionText}</span>
                        </div>
                        {isSel && <CheckCircle2 size={18} className="text-white shrink-0" fill="currentColor" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* ── Quantus ── */}
          {step?.stepType === "quantus" && (
            isStepDone && step.response?.responseData?.inputSnapshot ? (
              <div className="overflow-y-auto">
                <CaseQuantusReview
                  actData={actData}
                  submittedSnapshot={step.response.responseData.inputSnapshot}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col">
                <ExcelGrid
                  table={excelTable}
                  inputs={excelInputs}
                  userInputs={spreadsheetGrid}
                  setUserInputs={setSpreadsheetGrid}
                  isValidated={false}
                  feedback={{}}
                  sheetTabName="Case Model"
                  showToolbar
                  colLabels={actData.gridCols ?? []}
                  rowLabels={actData.gridRows ?? []}
                />
              </div>
            )
          )}

          {/* ── Canvas — same React Flow editor as learning + skill ── */}
          {isCanvasActive && (
            <div className="absolute inset-0 flex flex-col">
              {isCanvasSubmitted ? (
                <CanvasExercise
                  key={`canvas-review-${step.id}`}
                  canvasBackgroundText={actData?.title || "Framework"}
                  initialElements={canvasReviewElements}
                  disabled
                />
              ) : (
                <CanvasExercise
                  key={`canvas-active-${step.id}-${canvasResetNonce}`}
                  canvasBackgroundText={actData?.title || "Framework Drill"}
                  onElementsChange={setCanvasElements}
                  initialElements={[]}
                  assemblyMode={actData?.assemblyMode || "graph"}
                />
              )}
            </div>
          )}

          {/* Floating scratchpad launcher + idle guide nudge (top-right) */}
          <ScratchpadLauncher open={boardOpen} onOpen={() => setBoardOpen(true)} />

          <Feedback feedback={feedback} onClose={() => setFeedback(null)} />
        </div>
      </div>

      {/* Scratchpad splitter */}
      {boardOpen && centerOpen && (
        <Resizer
          onDragState={setDragging}
          onResize={(d) => setBoardWidth((w) => clamp(w - d, 300, 900))}
        />
      )}

      {/* ══════════════════════ RIGHT PANEL — Scratchpad (Whiteboard) ══════════════════════ */}
      <div
        className={cn(
          "overflow-hidden",
          !dragging && "transition-all duration-300 ease-in-out",
          boardOpen && !centerOpen ? "flex-1 min-w-0" : "flex-shrink-0"
        )}
        style={boardOpen && !centerOpen ? undefined : { width: boardOpen ? boardWidth : 0 }}
      >
        <div className="h-full flex flex-col pl-2" style={{ width: centerOpen ? boardWidth : "100%" }}>
          <ScratchpadPanel
            storageKey={scratchpadKey(user?.id ? `user-${user.id}` : `case-${id}`)}
            refreshKey={`${leftOpen ? leftWidth : 0}-${centerOpen}-${boardOpen ? boardWidth : 0}-${rightOpen ? activitiesWidth : 0}`}
            onClose={() => setBoardOpen(false)}
          />
        </div>
      </div>

      {/* Right panel reopen tab (previous style) */}
      <PanelReopenTab
        open={rightOpen}
        onOpen={() => setRightOpen(true)}
        label="AI Coach"
        icon={<Image src="/AiAssistance.svg" alt="AI Coach" width={22} height={22} className="group-hover:scale-110 transition-transform duration-200" />}
      />

      {/* ══════════════════════ RIGHT PANEL — AI COACH ══════════════════════ */}
      <CollapsiblePanel
        side="right"
        open={rightOpen}
        width={activitiesWidth}
        dragging={dragging}
        resizable
        onResize={resizeRight}
        onDragState={setDragging}
        title="AI Coach"
        icon={<Image src="/AiAssistance.svg" alt="AI Coach" width={18} height={18} />}
        onClose={() => setRightOpen(false)}
        innerClassName="h-full flex flex-col pl-2"
      >
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-[#F0EDE7]">

              {/* Live feedback / coaching */}
              {feedback ? (
                <div className={cn(
                  "rounded-2xl p-4 border shadow-sm animate-fade-in",
                  feedback.isError ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
                )}>
                  <h4 className={cn(
                    "text-[9px] font-black uppercase tracking-widest mb-1.5",
                    feedback.isError ? "text-rose-500" : "text-emerald-600"
                  )}>Feedback</h4>
                  <p className={cn(
                    "text-xs font-semibold leading-relaxed",
                    feedback.isError ? "text-rose-700" : "text-emerald-700"
                  )}>{feedback.message}</p>
                  {!feedback.isError && feedback.scorePct !== undefined && (
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-1.5">Score: {Math.round(feedback.scorePct)}%</p>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Complete the activity and I&apos;ll give you instant feedback here. Submit your
                    answer and I&apos;ll let you know how you did — and where to focus next.
                  </p>
                </div>
              )}

              {/* Progress card */}
              <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm flex flex-col gap-2">
                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Overall Progress</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-semibold">Completed</span>
                  <span className="text-sm font-black text-[#01696F]">{completedCount} / {totalSteps}</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div className="h-full bg-[#01696F] rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
      </CollapsiblePanel>

      {/* Case studies review modal — always review mode inside the test page */}
      <CaseStudiesModal
        studies={caseData?.caseStudies ?? []}
        caseTitle={caseData?.title ?? ""}
        isOpen={showStudies}
        onClose={() => setShowStudies(false)}
      />
    </div>
  );
}
