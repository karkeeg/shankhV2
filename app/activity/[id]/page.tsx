"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { PASS_THRESHOLD_PCT } from "@/lib/thresholds";
import { saveQuantusDraft, loadQuantusDraft, clearQuantusDraft, saveCanvasDraft, loadCanvasDraft, clearCanvasDraft } from "@/lib/activityDraft";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import logo from "@/public/ShankhFull.png";
import {
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { useAuthStore } from "@/lib/auth-store";
import { CanvasExercise } from "@/components/exercise/CanvasExercise";
import { ExcelGrid, evaluateExcelFormula } from "@/components/exercise/ExcelGrid";
import { CanvasToolkit } from "@/components/exercise/CanvasToolkit";
import { CanvasWorkspace, CanvasWorkspaceHandle } from "@/components/canvas/CanvasWorkspace";
import { CanvasPalette, tokensToItems } from "@/components/canvas/CanvasPalette";
import type { GradeResult, CanvasSnapshot, PaletteItem, SolutionSnapshot } from "@/components/canvas/types";

// ─── Shuffle Utilities ────────────────────────────────────────────────────────

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fully mixed: every step (each MCQ question, canvas, excel) is an independent
// card and can land anywhere. Incomplete steps are shuffled to the front so
// unfinished work surfaces first; completed ones trail.
function buildShuffledOrder(steps: any[]): number[] {
  const incomplete: number[] = [];
  const complete: number[] = [];
  steps.forEach((s, idx) => (s.completed ? complete : incomplete).push(idx));
  return [...fisherYates(incomplete), ...fisherYates(complete)];
}

function loadPersistedOrder(id: string): number[] | null {
  try { const r = localStorage.getItem(`shankh:order:${id}`); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function savePersistedOrder(id: string, o: number[]) {
  try { localStorage.setItem(`shankh:order:${id}`, JSON.stringify(o)); } catch { }
}
function loadPersistedPosition(id: string): number | null {
  try { const r = localStorage.getItem(`shankh:pos:${id}`); return r !== null ? +r : null; }
  catch { return null; }
}
function savePersistedPosition(id: string, p: number) {
  try { localStorage.setItem(`shankh:pos:${id}`, String(p)); } catch { }
}

// ─── Normalization ──────────────────────────────────────────────────────────
// The API returns steps as { type, orderIndex, data: {...} }. MCQ steps hold
// multiple questions. We flatten everything into a single flat list of cards
// the UI renders against — one card per MCQ question, one per canvas/excel.

function normalizeQuantusData(d: any) {
  // If the backend has already provided the pre-built flat format, use it directly.
  // cellHints may also be pre-built; if not, extract from quantusCells if present.
  if (Array.isArray(d.gridRows) && Array.isArray(d.gridCols)) {
    let cellHints: Record<string, string> = d.cellHints ?? {};
    // Back-fill hints from quantusCells when the pre-built format doesn't include them
    if (!d.cellHints && d.quantusCells && d.columns) {
      const sortedCols = [...d.columns].sort((a: any, b: any) => a.colIndex - b.colIndex);
      const colLabelMap: Record<number, string> = {};
      sortedCols.forEach((c: any) => { colLabelMap[c.colIndex] = c.label; });
      const firstColIdx: number = sortedCols[0]?.colIndex ?? 0;
      const rowLabelMap: Record<number, string> = {};
      (d.quantusCells as any[])
        .filter((c) => c.colIndex === firstColIdx)
        .forEach((c) => { rowLabelMap[c.rowIndex] = (c.displayValue || "").trim() || String(c.rowIndex); });
      (d.quantusCells as any[]).forEach((c) => {
        const hint = (c.hintText || c.formula || "").trim();
        if (!hint) return;
        const rowLabel = rowLabelMap[c.rowIndex] ?? String(c.rowIndex);
        const colLabel = colLabelMap[c.colIndex] ?? String(c.colIndex);
        cellHints[`${rowLabel}-${colLabel}`] = hint;
      });
    }
    return {
      gridRows: d.gridRows as string[],
      gridCols: d.gridCols as string[],
      gridValues: (d.gridValues ?? {}) as Record<string, string>,
      correctAnswers: (d.correctAnswers ?? {}) as Record<string, string>,
      cellHints,
    };
  }

  // Legacy path: raw quantusCells + columns from the database model
  if (d.quantusCells && d.columns) {
    const sortedCols = [...d.columns].sort((a: any, b: any) => a.colIndex - b.colIndex);
    const gridCols = sortedCols.map((c: any) => c.label as string);
    const colLabelMap: Record<number, string> = {};
    sortedCols.forEach((c: any) => { colLabelMap[c.colIndex] = c.label; });

    const rowIndices: number[] = Array.from(
      new Set((d.quantusCells as any[]).map((c) => c.rowIndex as number))
    ).sort((a, b) => a - b);

    // Row labels come from the first-column (colIndex === sortedCols[0].colIndex) cell values
    const firstColIdx: number = sortedCols[0]?.colIndex ?? 0;
    const rowLabelMap: Record<number, string> = {};
    (d.quantusCells as any[])
      .filter((c) => c.colIndex === firstColIdx)
      .forEach((c) => {
        rowLabelMap[c.rowIndex] = (c.displayValue || c.formula || "").trim() || String(c.rowIndex);
      });

    const gridRows = rowIndices.map((idx) => rowLabelMap[idx] ?? String(idx));

    const gridValues: Record<string, string> = {};
    const correctAnswers: Record<string, string> = {};
    const cellHints: Record<string, string> = {};

    (d.quantusCells as any[]).forEach((c) => {
      const rowLabel = rowLabelMap[c.rowIndex] ?? String(c.rowIndex);
      const colLabel = colLabelMap[c.colIndex] ?? String(c.colIndex);
      const k = `${rowLabel}-${colLabel}`;
      const exp = (c.expectedValue ?? "").toString().trim();
      const val = (c.displayValue || c.formula || "").toString().trim();
      if (exp !== "") {
        correctAnswers[k] = exp;
      } else if (val !== "") {
        gridValues[k] = val;
      }
      const hint = (c.hintText || c.formula || "").toString().trim();
      if (hint) cellHints[k] = hint;
    });

    return { gridRows, gridCols, gridValues, correctAnswers, cellHints };
  }

  return { gridRows: [], gridCols: [], gridValues: {}, correctAnswers: {} };
}

function normalizeSteps(rawSteps: any[]): any[] {
  return (rawSteps ?? []).flatMap((s: any) => {
    const d = s.data ?? {};

    if (s.type === "mcq") {
      const draftState = s.draft as { selectedOptionId?: string } | null;
      return (d.questions ?? []).map((q: any) => {
        const matchingAnswer = s.submittedAnswers?.find((a: any) => a.questionId === q.id);
        return {
          type: "mcq",
          id: q.id,
          activityId: d.id,
          questionText: q.questionText,
          instructions: d.instructions,
          contextText: d.context,
          explanation: q.explanation,
          options: (q.options ?? []).map((o: any, idx: number) => ({
            id: o.id,                                // real UUID — selection + submit
            label: o.optionText,                     // answer text
            display: String.fromCharCode(65 + idx),  // A, B, C, D
          })),
          completed: matchingAnswer ? matchingAnswer.isCorrect === true : false,
          submittedOptionId: matchingAnswer?.selectedOptionId || draftState?.selectedOptionId || null,
        };
      });
    }

    if (s.type === "canvas") {
      // s.submittedCanvasData from UserCanvasSession is a graph object ({ placedTokens, edges }),
      // NOT an array of Excalidraw elements. Only the draft (saved from frontend) is an array.
      const draftData = s.draft;
      const canvasInitial = Array.isArray(draftData) ? draftData : [];
      return [{
        type: "canvas",
        id: d.id,
        instructions: d.instructions,
        contextText: d.context,
        questionText: d.title,
        assemblyMode: d.assemblyMode || "sequence",
        scoringMode: d.scoringMode || "partial",
        tokens: d.tokens || [],
        draggableElements: d.draggableElements,
        completed: s.completedByUser === true,
        submittedCanvasData: canvasInitial,
      }];
    }

    if (s.type === "quantus") {
      const qData = normalizeQuantusData(d);
      return [{
        type: "quantus",
        id: d.id,
        instructions: d.instructions,
        contextText: d.context,
        gridRows: qData.gridRows,
        gridCols: qData.gridCols,
        gridValues: qData.gridValues,
        correctAnswers: qData.correctAnswers,
        cellHints: qData.cellHints ?? {},
        completed: s.completedByUser === true,
        submittedGrid: s.submittedGrid || s.draft || null,
      }];
    }

    return [];
  });
}

// ─── Case activity normalizer ────────────────────────────────────────────────
// Converts CaseActivity[] (from /api/v1/cases/:id) into the same flat step
// format as normalizeSteps so the rest of the page is source-agnostic.

function normalizeCaseSteps(caseActivities: any[]): any[] {
  return caseActivities.flatMap((activity: any) => {
    const d = activity.activityData ?? {};
    const response = activity.response ?? null;
    const isCompleted = !!response;

    if (activity.activityType === "mcq") {
      return (d.questions ?? []).map((q: any, qi: number) => ({
        type: "mcq",
        id: q.id,
        activityId: activity.id,
        questionText: q.questionText,
        instructions: d.instructions,
        contextText: d.context,
        explanation: q.explanation,
        options: (q.options ?? []).map((o: any, oi: number) => ({
          id: o.id,
          label: o.optionText,
          display: String.fromCharCode(65 + oi),
        })),
        completed: isCompleted,
        submittedOptionId: null,
        _isCaseActivity: true,
        _caseActivityId: activity.id,
        _isFirstQuestion: qi === 0,
        _totalQuestions: (d.questions ?? []).length,
        _questionIndex: qi,
      }));
    }

    if (activity.activityType === "canvas") {
      // Convert paletteItems → tokens + draggableElements so CanvasExercise
      // and CanvasToolkit work identically to lesson canvas activities.
      const palette = d.paletteItems ?? [];
      const tokens = palette.map((p: any) => ({
        id: p.id,
        content: p.label,
        type: p.shape ?? "rectangle",
        tokenRole: "operand",
      }));
      const draggableElements = palette.length > 0 ? [{
        category: "Nodes",
        items: palette.map((p: any) => ({
          id: p.id,
          label: p.label,
          content: p.label,
          type: p.shape ?? "rectangle",
        })),
      }] : [];
      return [{
        type: "canvas",
        id: activity.id,
        instructions: d.instructions,
        contextText: d.context,
        questionText: d.title || "Framework",
        assemblyMode: d.assemblyMode || "graph",
        scoringMode: d.scoringMode || "partial",
        tokens,
        draggableElements,
        completed: isCompleted,
        submittedCanvasData: [],
        _isCaseActivity: true,
        _caseActivityId: activity.id,
      }];
    }

    if (activity.activityType === "quantus") {
      const qData = normalizeQuantusData(d);
      return [{
        type: "quantus",
        id: activity.id,
        instructions: d.instructions,
        contextText: d.context,
        gridRows: qData.gridRows,
        gridCols: qData.gridCols,
        gridValues: qData.gridValues,
        correctAnswers: qData.correctAnswers,
        completed: isCompleted,
        submittedGrid: response?.responseData?.inputSnapshot ?? null,
        _isCaseActivity: true,
        _caseActivityId: activity.id,
      }];
    }

    return [];
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────




const TYPE_META: Record<string, { label: string; color: string }> = {
  quantus: { label: "Spreadsheet", color: "bg-sky-100 text-sky-700 border-sky-200" },
  mcq: { label: "Multiple Choice", color: "bg-violet-100 text-violet-700 border-violet-200" },
  canvas: { label: "Framework Drill", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

// ─── Small reusable pieces ────────────────────────────────────────────────────

function ActivityTypePill({ type }: { type: string }) {
  const m = TYPE_META[type] ?? { label: type, color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", m.color)}>
      {m.label}
    </span>
  );
}

function ShuffleToast({ visible }: { visible: boolean }) {
  return (
    <div className={cn(
      "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2",
      "bg-[#28251D] text-white text-xs font-bold rounded-full shadow-xl border border-white/10",
      "transition-all duration-500 pointer-events-none",
      visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
    )}>
      <Shuffle size={13} className="text-[#00A389]" />
      Activities shuffled
    </div>
  );
}

function PanelToggle({
  open,
  onClick,
  side,
}: {
  open: boolean;
  onClick: () => void;
  side: "left" | "right";
}) {
  // 👇 hide toggle when panel is open
  if (open) return null;

  const isLeft = side === "left";
  return (
    <button
      onClick={onClick}
      aria-label={open ? "Collapse panel" : "Expand panel"}
      className={cn(
        "self-center z-20 flex-shrink-0",
        "w-8 h-40 bg-white border border-zinc-200 shadow-md",
        "rounded-full flex items-center justify-center",
        "hover:bg-[#E6F0F1] hover:border-[#01696F]/30",
        "transition-all duration-200 active:scale-95 group"
      )}
    >
      {/* LEFT SIDE */}
      {isLeft ? (
        open ? (
          // when OPEN → show collapse button
          <ChevronLeft
            size={14}
            className="text-zinc-500 group-hover:text-[#01696F]"
          />
        ) : (
          // when CLOSED → show expand button
          <ChevronRight
            size={14}
            className="text-zinc-500 group-hover:text-[#01696F]"
          />
        )
      ) : (
        // RIGHT SIDE (AI Coach)
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
            AI Coach
          </span>

          <Image
            src="/AiAssistance.svg"
            alt="AI Coach"
            width={22}
            height={22}
            className="group-hover:scale-110 transition-transform duration-200"
          />
        </div>
      )}
    </button>
  );
}


function BottomFeedback({
  feedback,
  onClose,
  onNext,
  onNextLesson,
  isLastPosition,
  allDone,
}: {
  feedback: any;
  onClose: () => void;
  onNext: () => void;
  onNextLesson: () => void;
  isLastPosition: boolean;
  allDone: boolean;
}) {
  if (!feedback) return null;
  const ok = !feedback.isError;
  return (
    <div className={cn(
      "absolute bottom-4 left-1/2 -translate-x-1/2 z-30",
      "w-[min(480px,calc(100%-2rem))] rounded-2xl shadow-2xl border",
      "animate-fade-in-up overflow-hidden",
      ok ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
    )}>
      <div className={cn("h-1 w-full", ok ? "bg-emerald-500" : "bg-rose-500")} />
      <div className="px-5 py-4 flex items-start gap-3">
        <div className={cn(
          "mt-0.5 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm",
          ok ? "bg-emerald-100" : "bg-rose-100"
        )}>
          {ok
            ? <CheckCircle2 size={18} className="text-emerald-600" fill="currentColor" />
            : <XCircle size={18} className="text-rose-500" fill="currentColor" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-bold", ok ? "text-emerald-800" : "text-rose-800")}>
            {feedback.message}
          </p>
          {ok && feedback.metrics?.conceptAccuracy !== undefined && (
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700/80">
              <span>Accuracy {Math.round(feedback.metrics.conceptAccuracy)}%</span>
              <span>Recall {Math.round(feedback.metrics.recallStrength)}%</span>
              <span>Application {Math.round(feedback.metrics.applicationScore)}%</span>
            </div>
          )}
          {ok && (
            <div className="mt-3">
              {allDone ? (
                <button
                  onClick={onNextLesson}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow"
                >
                  🎉 Next Lesson <ArrowRight size={12} />
                </button>
              ) : !isLastPosition ? (
                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow"
                >
                  Next Activity <ArrowRight size={12} />
                </button>
              ) : null}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all",
            ok ? "hover:bg-emerald-100 text-emerald-500" : "hover:bg-rose-100 text-rose-400"
          )}
        >
          <ChevronLeft size={14} className="rotate-[-90deg]" />
        </button>
      </div>
    </div>
  );
}

function HintsPopup({
  hints,
  unlocked,
  onUnlockNext,
  onClose,
  anchorRef,
}: {
  hints: string[];
  unlocked: number;
  onUnlockNext: () => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={popupRef}
      className={cn(
        "absolute left-0 top-full mt-3 z-[9999]",
        "w-48 rounded-2xl",
        "bg-white/70 backdrop-blur-2xl",
        "border border-white/30",
        "shadow-[0_20px_60px_rgba(0,0,0,0.12)]",
        "animate-fade-in-up"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-semibold text-zinc-800">Smart Hints</span>
            <span className="text-[9px] text-zinc-400">{unlocked}/{hints.length}</span>
          </div>
        </div>

        {unlocked < hints.length && (
          <button
            onClick={onUnlockNext}
            className={cn(
              "relative w-6 h-6 rounded-full",
              "bg-amber-100 shadow-md",
              "flex items-center justify-center",
              "animate-bounce hover:scale-110 transition"
            )}
          >
            <Lightbulb size={12} className="text-amber-600" fill="currentColor" />
            <span className="absolute inset-0 rounded-full animate-ping bg-amber-300/40" />
          </button>
        )}
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full hover:bg-black/5 flex items-center justify-center"
        >
          <X size={12} className="text-zinc-500" />
        </button>
      </div>

      <div className="p-2 flex flex-col gap-2 max-h-64 overflow-y-auto">
        {hints.slice(0, unlocked).map((hint, idx) => (
          <div
            key={idx}
            className="rounded-xl px-3 py-2 bg-white/70 border border-black/5 text-[11px] text-zinc-700 animate-fade-in"
          >
            <span className="block text-[9px] font-semibold text-amber-500 mb-1">Hint {idx + 1}</span>
            {hint}
          </div>
        ))}
        {unlocked === hints.length && (
          <div className="text-center text-[10px] text-zinc-400 py-2">All hints unlocked ✨</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function UnifiedActivityPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromSkill = searchParams?.get("from") === "skill";
  const fromCase = searchParams?.get("source") === "case";
  const id = (params?.id as string) || "les-1-1";

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Shuffle / navigation ────────────────────────────────────────────────────
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const [orderPosition, setOrderPosition] = useState(0);
  const [showShuffleToast, setShowShuffleToast] = useState(false);
  const currentStepIdx = shuffledOrder[orderPosition] ?? 0;

  // ── Panel visibility ────────────────────────────────────────────────────────
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [activeLeftTab, setActiveLeftTab] = useState<"instructions" | "context">("instructions");
  const [hintPopupOpen, setHintPopupOpen] = useState(false);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const [hintsUnlocked, setHintsUnlocked] = useState(1);
  const [feedback, setFeedback] = useState<any>(null);

  // ── Answer state ────────────────────────────────────────────────────────────
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spreadsheetGrid, setSpreadsheetGrid] = useState<Record<string, string>>({});
  const [canvasElements, setCanvasElements] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ── Case mode: buffer MCQ answers until all questions in one activity are done
  const [caseMcqBuffer, setCaseMcqBuffer] = useState<Record<string, string>>({});

  // ── Canvas state ─────────────────────────────────────────────────────────────
  const canvasRef = useRef<CanvasWorkspaceHandle>(null);
  const [canvasPlacedIds, setCanvasPlacedIds] = useState<Set<string>>(new Set());
  const [canvasGradeResult, setCanvasGradeResult] = useState<GradeResult | null>(null);
  const [showCanvasBreakdown, setShowCanvasBreakdown] = useState(false);

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  // ── Reactions ────────────────────────────────────────────────────────────────
  const [reactionCounts, setReactionCounts] = useState({ likes: 0, dislikes: 0 });
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);

  // ── Mobile: collapse panels by default on small screens ─────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  }, []);

  // ── Load activity ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    headers.Authorization = `Bearer ${token}`;

    setLoading(true);

    // ── Case simulation mode ──────────────────────────────────────────────────
    if (fromCase) {
      Promise.all([
        fetch(`${backendUrl}/api/v1/cases/${id}`, { headers }).then(r => r.json()),
        fetch(`${backendUrl}/api/v1/cases/${id}/session`, { method: "POST", headers }).then(r => r.json()),
      ])
        .then(([detail]) => {
          const raw = detail.data;
          if (!raw) throw new Error("Case not found");
          const steps = normalizeCaseSteps(raw.caseActivities ?? []);
          const actData = {
            id: raw.id,
            title: raw.title,
            difficulty: raw.difficulty,
            moduleSlug: null,
            caseNotes: raw.description,
            hints: [],
            steps,
            _isCase: true,
          };
          setActivity(actData);
          // Case activities preserve admin order — no shuffle
          const order = steps.map((_: any, i: number) => i);
          setShuffledOrder(order);
          setOrderPosition(0);
          setHintsUnlocked(1);
          setSelectedOption(null);
          setCaseMcqBuffer({});
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
      return;
    }

    // ── Lesson mode (existing) ─────────────────────────────────────────────────
    fetch(`${backendUrl}/api/v1/activities/${id}`, { headers })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.text().catch(() => "");
          throw new Error(`Activity fetch failed: ${r.status} ${r.statusText} — ${body.slice(0, 200)}`);
        }
        return r.json();
      })
      .then((data) => {
        const raw = data.data || data;
        const steps = normalizeSteps(raw.steps);

        const actData = {
          id: raw.lessonId,
          title: raw.lessonName,
          difficulty: raw.difficulty,
          moduleSlug: raw.moduleSlug,
          caseNotes: raw.subtopicName,
          hints: raw.hints ?? [],
          steps,
        };

        setActivity(actData);

        sessionStorage.setItem("shankh:lastLesson", JSON.stringify({
          id: actData.id,
          title: actData.title,
          moduleSlug: actData.moduleSlug,
          moduleName: actData.moduleSlug === "finance" ? "Finance" : actData.moduleSlug === "strategy" ? "Strategy" : "Operations",
          subtopicName: actData.caseNotes || "Core Concepts",
        }));

        // Always generate a fresh shuffle on every visit so Canvas, Quantus,
        // and MCQ cards can appear in any order — no type is pinned to the front.
        const order = buildShuffledOrder(steps);
        const pos = 0;
        savePersistedOrder(id, order);
        savePersistedPosition(id, 0);
        setShowShuffleToast(true);
        setTimeout(() => setShowShuffleToast(false), 2800);

        setShuffledOrder(order);
        setOrderPosition(pos);
        setHintsUnlocked(1);
        setSelectedOption(null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, token, fromCase]);

  // Persist position as the user navigates.
  useEffect(() => {
    if (id && shuffledOrder.length > 0) savePersistedPosition(id, orderPosition);
  }, [id, orderPosition, shuffledOrder]);

  // ── Fetch reactions for the current lesson ───────────────────────────────────
  useEffect(() => {
    if (!token || !id) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    fetch(`${backendUrl}/api/v1/reactions/lessons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) {
          setReactionCounts({ likes: data.data.likes, dislikes: data.data.dislikes });
          setUserReaction(data.data.userReaction);
        }
      })
      .catch(() => {});
  }, [id, token]);

  const handleReaction = async (reaction: "like" | "dislike") => {
    if (!token) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    try {
      const res = await fetch(`${backendUrl}/api/v1/reactions/lessons/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction }),
      });
      const data = await res.json();
      if (data?.data) {
        setReactionCounts({ likes: data.data.likes, dislikes: data.data.dislikes });
        setUserReaction(data.data.userReaction);
      }
    } catch { }
  };

  // ── Re-shuffle ──────────────────────────────────────────────────────────────
  const handleReshuffle = useCallback(() => {
    if (!activity?.steps) return;
    const newOrder = buildShuffledOrder(activity.steps);
    setShuffledOrder(newOrder);
    setOrderPosition(0);
    savePersistedOrder(id, newOrder);
    savePersistedPosition(id, 0);
    setShowShuffleToast(true);
    setTimeout(() => setShowShuffleToast(false), 2800);
    setFeedback(null);
  }, [activity, id]);

  const step = activity?.steps?.[currentStepIdx];

  // ── Excel helpers ────────────────────────────────────────────────────────────
  const excelTable = React.useMemo(() => {
    if (!step?.gridRows || !step?.gridCols) return [];
    return step.gridRows.map((row: string) =>
      step.gridCols.map((col: string) => step.gridValues?.[`${row}-${col}`] ?? "")
    );
  }, [step]);

  const excelInputs = React.useMemo(() => {
    if (!step?.gridRows || !step?.gridCols) return [];
    const list: any[] = [];
    step.gridRows.forEach((row: string, rIdx: number) => {
      step.gridCols.forEach((col: string, cIdx: number) => {
        if (cIdx === 0) return;
        const k = `${row}-${col}`;
        if (step.correctAnswers?.[k] !== undefined) {
          list.push({
            row: rIdx,
            col: cIdx,
            correctValue: step.correctAnswers[k],
            placeholder: "",
            formula: step.cellHints?.[k] || undefined,
          });
        }
      });
    });
    return list;
  }, [step]);

  const excelFeedback = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    if (feedback && step?.gridRows && step?.gridCols) {
      step.gridRows.forEach((row: string, rIdx: number) =>
        step.gridCols.forEach((col: string, cIdx: number) => {
          // Use label-based key — must match ExcelGrid's getCellKey
          const k = `${row}-${col}`;
          const userVal = spreadsheetGrid[k]?.toString().trim() ?? "";
          const correctVal = step.correctAnswers?.[k]?.toString().trim() ?? "";
          if (!correctVal) return; // skip non-answer cells
          const numUser = Number(userVal);
          const numCorrect = Number(correctVal);
          const bothNumeric = !isNaN(numUser) && !isNaN(numCorrect) && correctVal !== "";
          if (bothNumeric) {
            const diff = Math.abs(numUser - numCorrect);
            const tol = Math.abs(numCorrect) > 1 ? Math.abs(numCorrect) * 0.001 : 0.001;
            map[k] = diff <= tol;
          } else {
            map[k] = userVal === correctVal;
          }
        })
      );
    }
    return map;
  }, [feedback, step, spreadsheetGrid]);

  // ── Sync when step changes (load draft or fall back to server state) ──────────
  useEffect(() => {
    if (!step) return;
    setSelectedOption(null);
    setFeedback(null);
    if (step.type === "quantus") {
      const draft = !step.completed ? loadQuantusDraft(step.id) : null;
      setSpreadsheetGrid(draft ?? step.submittedGrid ?? step.gridValues ?? {});
    } else if (step.type === "mcq") {
      if (step.submittedOptionId) setSelectedOption(step.submittedOptionId);
    } else if (step.type === "canvas") {
      // Draft for canvas is loaded via initialElements — reset elements to trigger re-mount
      const draft = !step.completed ? loadCanvasDraft(step.id) : null;
      setCanvasElements(draft ? (draft as any) : (step.submittedCanvasData || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIdx]);

  // ── Save Quantus draft locally whenever grid changes ─────────────────────────
  useEffect(() => {
    if (!step || step.type !== "quantus" || step.completed) return;
    if (Object.keys(spreadsheetGrid).length === 0) return;
    const t = setTimeout(() => saveQuantusDraft(step.id, spreadsheetGrid), 600);
    return () => clearTimeout(t);
  }, [spreadsheetGrid, step]);

  // ── Save Canvas draft locally whenever elements change ────────────────────────
  useEffect(() => {
    if (!step || step.type !== "canvas" || step.completed) return;
    if (canvasElements.length === 0) return;
    const t = setTimeout(() => saveCanvasDraft(step.id, canvasElements as any), 400);
    return () => clearTimeout(t);
  }, [canvasElements, step]);

  // ── Autosave to Database ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!step || step.completed) return;
    const delay = step.type === "canvas" ? 500 : 1000;
    const t = setTimeout(async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      let draftState: any = null;
      let activityId = step.id;

      if (step.type === "quantus" && Object.keys(spreadsheetGrid).length > 0) {
        draftState = spreadsheetGrid;
      } else if (step.type === "canvas" && canvasElements.length > 0) {
        draftState = canvasElements;
      } else if (step.type === "mcq" && selectedOption) {
        draftState = { selectedOptionId: selectedOption };
        activityId = step.activityId;
      }

      if (!draftState || !activityId) return;

      try {
        await fetch(`${backendUrl}/api/v1/draft/me/activities/${step.type}/${activityId}/draft`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ draft_state: draftState }),
        });
      } catch (err) {
        console.error("Autosave draft failed:", err);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [spreadsheetGrid, canvasElements, selectedOption, step, token]);

  // ── Validation ────────────────────────────────────────────────────────────────
  // Key function MUST match ExcelGrid's getCellKey — label-based when row/colLabels present
  const excelKey = (r: number, c: number): string => {
    if (step?.gridRows && step?.gridCols) {
      return `${step.gridRows[r]}-${step.gridCols[c]}`;
    }
    return `${r}-${c}`;
  };

  const validateExcel = () => {
    const result: Record<string, boolean> = {};
    excelInputs.forEach(({ row, col }) => {
      const k = excelKey(row, col);
      let n = 0;
      try { n = Number(evaluateExcelFormula(spreadsheetGrid[k] ?? "", spreadsheetGrid, [], excelKey)); }
      catch { n = Number(spreadsheetGrid[k]); }
      const expected = Number(step.correctAnswers?.[k]);
      // Relative tolerance for large numbers, absolute tolerance for small
      const diff = Math.abs(n - expected);
      const tol = Math.abs(expected) > 1 ? Math.abs(expected) * 0.001 : 0.001;
      result[k] = diff <= tol;
    });
    return result;
  };

  /**
   * Extract the structural representation from the current Excalidraw canvas.
   * Returns { placedTokens: string[], edges: { from, to, slot? }[] }
   */
  const extractCanvasGraph = () => {
    // Collect all placed token shapes (ignore zones, text labels, etc.)
    const tokenElements = canvasElements.filter(
      (el) => el.customData?.originalId && !el.customData?.isZone && el.type !== "text"
    );
    const placedTokens = tokenElements.map((el) => el.customData!.originalId as string);

    // Collect arrows and resolve their connections
    const arrows = canvasElements.filter((el) => el.type === "arrow");
    const edges: { from: string; to: string; slot?: string }[] = [];

    for (const arrow of arrows) {
      const startBinding = (arrow as any).startBinding;
      const endBinding = (arrow as any).endBinding;
      if (!startBinding?.elementId || !endBinding?.elementId) continue;

      // Resolve Excalidraw element IDs → original token IDs
      const fromEl = canvasElements.find((el) => el.id === startBinding.elementId);
      const toEl = canvasElements.find((el) => el.id === endBinding.elementId);
      if (!fromEl?.customData?.originalId || !toEl?.customData?.originalId) continue;

      const fromId = fromEl.customData.originalId as string;
      const toId = toEl.customData.originalId as string;

      // Infer slot from geometric position for sequence mode
      // (left operand is to the left of the operator, right is to the right)
      let slot: string | undefined;
      if (step.assemblyMode === "sequence" || step.assemblyMode === "graph") {
        const toToken = (step.tokens || []).find((t: any) => t.id === toId);
        if (toToken && (toToken.tokenRole === "operator" || toToken.tokenRole === "relation")) {
          // The from-element's center X relative to the to-element determines slot
          const fromCx = (fromEl.x ?? 0) + (fromEl.width ?? 0) / 2;
          const toCx = (toEl.x ?? 0) + (toEl.width ?? 0) / 2;
          slot = fromCx < toCx ? "left" : "right";
        }
      }

      edges.push({ from: fromId, to: toId, ...(slot ? { slot } : {}) });
    }

    // For sequence mode without explicit arrows, infer adjacency from left-to-right order
    if (step.assemblyMode === "sequence" && edges.length === 0 && tokenElements.length > 1) {
      const sorted = [...tokenElements].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
      for (let i = 0; i < sorted.length - 1; i++) {
        const fromId = sorted[i].customData!.originalId as string;
        const toId = sorted[i + 1].customData!.originalId as string;
        // Infer slot based on target token role
        const toToken = (step.tokens || []).find((t: any) => t.id === toId);
        let slot: string | undefined;
        if (toToken && (toToken.tokenRole === "operator" || toToken.tokenRole === "relation")) {
          slot = "left"; // first operand connecting to operator
        }
        const fromToken = (step.tokens || []).find((t: any) => t.id === fromId);
        if (fromToken && (fromToken.tokenRole === "operator" || fromToken.tokenRole === "relation")) {
          slot = "right"; // operator connecting to right operand
        }
        edges.push({ from: fromId, to: toId, ...(slot ? { slot } : {}) });
      }
    }

    return { placedTokens, edges };
  };

  // ── Reset — allows re-answering even on completed steps ───────────────────────
  const handleReset = () => {
    if (!step) return;
    if (step.type === "quantus") setSpreadsheetGrid(step.gridValues || {});
    else if (step.type === "mcq") setSelectedOption(null);
    else if (step.type === "canvas") setCanvasElements([]);
    setFeedback(null);
    if (activity?.steps) {
      const updated = [...activity.steps];
      updated[currentStepIdx] = { ...updated[currentStepIdx], completed: false };
      setActivity({ ...activity, steps: updated });
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────────
  const handlePrevStep = () => { if (orderPosition > 0) setOrderPosition(p => p - 1); };
  const handleNextStep = () => { if (orderPosition < shuffledOrder.length - 1) setOrderPosition(p => p + 1); };

  const handleClose = () => {
    if (fromCase) {
      router.push(`/case-simulations/${id}`);
    } else if (fromSkill) {
      router.back();
    } else {
      router.push(activity?.moduleSlug ? `/learning/${activity.moduleSlug}` : "/learning/finance");
    }
  };
  const handleNextLesson = () => {
    if (fromCase) {
      router.push("/skill?section=case_simulations");
    } else if (activity?.nextLessonId) {
      router.push(`/activity/${activity.nextLessonId}`);
    } else if (activity?.moduleSlug) {
      router.push(`/learning/${activity.moduleSlug}`);
    } else {
      router.push("/learning/finance");
    }
  };

  // ── Unified canvas submit (lesson + case) ─────────────────────────────────────
  const handleCanvasSubmit = async (snapshot: CanvasSnapshot): Promise<GradeResult | null> => {
    if (!step) return null;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    if (step._isCaseActivity) {
      try {
        const res = await fetch(`${backendUrl}/api/v1/cases/${id}/activities/${step._caseActivityId}/submit`, {
          method: "POST", headers,
          body: JSON.stringify({ responseData: { edges: snapshot.edges.map(e => ({ sourceId: e.sourceId, targetId: e.targetId })) } }),
        });
        const rj = await res.json();
        if (!res.ok) return null;
        const { scorePct, gradeBreakdown, allComplete } = rj.data;
        if (activity?.steps) {
          const updated = [...activity.steps];
          updated[currentStepIdx] = { ...updated[currentStepIdx], completed: scorePct >= 60 };
          setActivity({ ...activity, steps: updated });
        }
        if (allComplete) setTimeout(() => router.push(`/case-simulations/${id}`), 2500);
        return gradeBreakdown ?? { scorePct, correct: [], wrong: [], missing: [] };
      } catch { return null; }
    }

    // Lesson canvas — POST to the standard session endpoint
    try {
      const res = await fetch(`${backendUrl}/api/v1/attempts/session/canvas`, {
        method: "POST", headers,
        body: JSON.stringify({
          lessonId: id, activityType: "canvas",
          canvasData: {
            placedTokens: snapshot.nodes.map(n => n.id),
            edges: snapshot.edges.map(e => ({ from: e.sourceId, to: e.targetId })),
          },
        }),
      });
      const rj = await res.json();
      if (!res.ok) throw new Error(rj?.error || "Submission failed");
      const accuracy: number = rj.data?.accuracy ?? rj.data?.scorePct ?? 100;
      const isCorrect = accuracy >= PASS_THRESHOLD_PCT;
      if (activity?.steps) {
        const updated = [...activity.steps];
        updated[currentStepIdx] = { ...updated[currentStepIdx], completed: isCorrect };
        setActivity({ ...activity, steps: updated });
      }
      clearCanvasDraft(step?.id ?? "");
      setFeedback({
        isError: !isCorrect,
        message: isCorrect ? "Excellent! Correct answer." : "Not quite — try again!",
        metrics: rj.data || {},
      });
      return { scorePct: accuracy, correct: [], wrong: [], missing: [] };
    } catch (e: any) {
      setFeedback({ isError: true, message: e?.message || "Network error." });
      return null;
    }
  };

  // ── Check answer ──────────────────────────────────────────────────────────────
  const handleCheckAnswer = async () => {
    if (!step) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    setSubmitting(true);
    setFeedback(null);

    // ── Case activity submit path ────────────────────────────────────────────────
    if (step._isCaseActivity) {
      // Canvas is handled below via the unified path
      if (step.type === "canvas") {
        const snapshot = canvasRef.current?.getSnapshot();
        if (!snapshot || snapshot.nodes.length === 0) {
          setFeedback({ isError: true, message: "Place some nodes on the canvas first!" });
          setSubmitting(false);
          return;
        }
        const result = await handleCanvasSubmit(snapshot);
        if (result) { setCanvasGradeResult(result); setShowCanvasBreakdown(false); }
        setSubmitting(false);
        return;
      }

      let responseData: any = {};

      if (step.type === "mcq") {
        if (!selectedOption) {
          setFeedback({ isError: true, message: "Please select an option first!" });
          setSubmitting(false);
          return;
        }
        // Collect this answer into the buffer
        const newBuffer = { ...caseMcqBuffer, [step.id]: selectedOption };
        setCaseMcqBuffer(newBuffer);

        // Check if next step belongs to the same case activity (more questions pending)
        const nextOrderPos = orderPosition + 1;
        const nextStepIdx = shuffledOrder[nextOrderPos] ?? -1;
        const nextStep = nextStepIdx >= 0 ? activity?.steps?.[nextStepIdx] : null;
        const moreQuestionsInActivity = nextStep?._caseActivityId === step._caseActivityId;

        if (moreQuestionsInActivity) {
          // Just advance — don't submit yet
          setFeedback({ isError: false, message: `Question ${step._questionIndex + 1} recorded. Next →` });
          setOrderPosition(p => p + 1);
          setSelectedOption(null);
          setSubmitting(false);
          return;
        }
        // Last question of this MCQ activity — submit all collected answers
        responseData = { answers: Object.entries(newBuffer).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })) };
        setCaseMcqBuffer({});

      } else if (step.type === "quantus") {
        responseData = { inputSnapshot: spreadsheetGrid };
      }

      try {
        const res = await fetch(`${backendUrl}/api/v1/cases/${id}/activities/${step._caseActivityId}/submit`, {
          method: "POST", headers,
          body: JSON.stringify({ responseData }),
        });
        const rj = await res.json();
        if (!res.ok) throw new Error(rj?.error || "Submit failed");
        const { scorePct, allComplete } = rj.data;
        const isCorrect = (scorePct ?? 0) >= 60;
        if (activity?.steps) {
          const updated = [...activity.steps];
          updated[currentStepIdx] = { ...updated[currentStepIdx], completed: isCorrect };
          setActivity({ ...activity, steps: updated });
        }
        setFeedback({
          isError: !isCorrect,
          message: isCorrect ? `Correct! Score: ${Math.round(scorePct)}%` : `Score: ${Math.round(scorePct)}% — try again!`,
          metrics: { conceptAccuracy: scorePct, recallStrength: scorePct, applicationScore: scorePct },
        });
        if (allComplete) setTimeout(() => router.push(`/case-simulations/${id}`), 2500);
      } catch (e: any) {
        setFeedback({ isError: true, message: e?.message || "Error submitting." });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── Lesson submit path (existing) ────────────────────────────────────────────
    // Base payload — backend controllers require lessonId + activityType
    const payload: Record<string, unknown> = { lessonId: id, activityType: step.type };

    if (step.type === "mcq") {
      if (!selectedOption) {
        setFeedback({ isError: true, message: "Please select an option first!" });
        setSubmitting(false);
        return;
      }
      payload.answers = [{ questionId: step.id || "", selectedOptionId: selectedOption }];

    } else if (step.type === "quantus") {
      const res = validateExcel();
      const correct = Object.values(res).filter(Boolean).length;
      const total = Object.values(res).length;
      const allCorrect = correct === total && total > 0;
      setFeedback({
        isError: !allCorrect,
        message: allCorrect ? "Excellent! All cells are correct." : "Some cells are incorrect — check your formulas.",
        metrics: { excelResult: res },
      });
      if (!allCorrect) { setSubmitting(false); return; }
      payload.inputSnapshot = spreadsheetGrid;
      payload.score = correct;
      payload.total = total;

    } else if (step.type === "canvas") {
      // extractCanvasGraph reads Excalidraw state for both lesson + case canvas
      const graph = extractCanvasGraph();
      if (graph.placedTokens.length === 0) {
        setFeedback({ isError: true, message: "Drag some tokens onto the canvas first!" });
        setSubmitting(false);
        return;
      }

      if (step._isCaseActivity) {
        // Post to case activity endpoint
        try {
          const res = await fetch(`${backendUrl}/api/v1/cases/${id}/activities/${step._caseActivityId}/submit`, {
            method: "POST", headers,
            body: JSON.stringify({ responseData: { canvasData: graph } }),
          });
          const rj = await res.json();
          if (!res.ok) throw new Error(rj?.error || "Submit failed");
          const { scorePct, allComplete } = rj.data;
          const isCorrect = (scorePct ?? 0) >= 60;
          if (activity?.steps) {
            const updated = [...activity.steps];
            updated[currentStepIdx] = {
              ...updated[currentStepIdx], completed: isCorrect,
              submittedCanvasData: canvasElements,
            };
            setActivity({ ...activity, steps: updated });
          }
          setFeedback({
            isError: !isCorrect,
            message: isCorrect ? "Excellent! Correct answer." : "Not quite — try again!",
            metrics: rj.data || {},
          });
          if (allComplete) setTimeout(() => router.push(`/case-simulations/${id}`), 2500);
        } catch (e: any) {
          setFeedback({ isError: true, message: e?.message || "Error submitting." });
        } finally {
          setSubmitting(false);
        }
        return;
      }

      // Lesson canvas → standard session endpoint
      payload.canvasData = graph;
    }

    try {
      // Single direct POST to the typed session endpoint — no separate "create attempt" step needed
      const sr = await fetch(`${backendUrl}/api/v1/attempts/session/${step.type}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const sj = await sr.json();
      if (!sr.ok) throw new Error(sj?.error || "Submission failed");

      // Mark the step completed locally (accuracy >= 70 is "correct" by backend rules)
      const accuracy: number = sj.data?.accuracy ?? sj.data?.scorePct ?? 100;
      const isCorrect = accuracy >= PASS_THRESHOLD_PCT;

      if (activity?.steps) {
        const updated = [...activity.steps];
        updated[currentStepIdx] = {
          ...updated[currentStepIdx],
          completed: isCorrect,
          submittedOptionId: step.type === "mcq" ? selectedOption : updated[currentStepIdx].submittedOptionId,
          submittedGrid: step.type === "quantus" ? spreadsheetGrid : updated[currentStepIdx].submittedGrid,
          submittedCanvasData: step.type === "canvas" ? canvasElements : updated[currentStepIdx].submittedCanvasData,
        };
        setActivity({ ...activity, steps: updated });
      }
      // Clear local draft on any submit (pass or fail — user got feedback)
      if (step.type === "quantus") clearQuantusDraft(step.id);
      if (step.type === "canvas") clearCanvasDraft(step.id);

      setFeedback({
        isError: !isCorrect,
        message: isCorrect ? "Excellent! Correct answer." : "Not quite — try again!",
        metrics: sj.data || {},
      });
    } catch (e: any) {
      setFeedback({ isError: true, message: e?.message || "Network error." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Progress ──────────────────────────────────────────────────────────────────
  const totalSteps = shuffledOrder.length;
  const completedCount = activity?.steps?.filter((s: any) => s.completed).length ?? 0;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const allDone = completedCount === totalSteps && totalSteps > 0;
  const isLastPosition = orderPosition >= totalSteps - 1;

  // ── Loading / error ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F] gap-2">
      <Loader2 className="w-10 h-10 animate-spin" />
      <span className="text-sm font-semibold">Loading activity...</span>
    </div>
  );
  if (!activity || !step) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] text-zinc-600 gap-4">
      <span className="font-semibold text-lg">Failed to load activity.</span>
      <button onClick={() => router.push("/learning/finance")} className="px-4 py-2 bg-[#01696F] text-white rounded-xl shadow">
        Return to Dashboard
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-row h-screen overflow-hidden font-sans bg-white text-zinc-800 p-2 sm:p-3 gap-0">
      <ShuffleToast visible={showShuffleToast} />

      {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
        leftPanelOpen ? "w-60 xl:w-64" : "w-0"
      )}>
        <div className="w-60 xl:w-64 h-full flex flex-col justify-between pr-2">
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">

            {/* Logo + back */}
            <div className="flex flex-col items-center gap-3 border-b border-zinc-100 pb-3 pt-1">
              <div className="w-full flex justify-center">
                <Image src={logo} alt="Shankh" width={110} height={32} className="object-contain" style={{ width: "auto", height: "auto" }} />
              </div>
              <button
                onClick={handleClose}
                className="w-full py-1.5 bg-[#DFEAEA] text-[#01696F] hover:bg-[#D7E8E9] font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-[#01696F]/10"
              >
                {fromCase ? "← Back to Case" : fromSkill ? "← Back to Test" : "← Back to content"}
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
                    onClick={handleNextLesson}
                    className="w-full py-2 bg-[#01696F] hover:bg-[#01696F]/90 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {fromCase ? "Finish Case" : "Next Lesson"} <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Activity type + position */}
            <div className="flex items-center justify-between px-1">
              <ActivityTypePill type={step.type} />
              <span className="text-[10px] font-bold text-zinc-400">{orderPosition + 1}/{totalSteps}</span>
            </div>

            {/* Instruction / Context tabs */}
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
                <h3 className="font-extrabold text-zinc-900 text-xs leading-tight tracking-tight">{activity.title}</h3>
                <DifficultyBadge difficulty={activity.difficulty} />
              </div>
              {activeLeftTab === "instructions" ? (
                <div className="animate-fade-in">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">Instructions</span>
                  <p className="text-xs text-zinc-700 leading-relaxed font-semibold whitespace-pre-line">{step.instructions}</p>
                </div>
              ) : step.contextText && (
                <div className="animate-fade-in">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">Context & Scenario</span>
                  <p className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line">{step.contextText}</p>
                </div>
              )}
              {/* Canvas toolkit for ALL canvas activities (lesson + case) */}
              {step.type === "canvas" && (
                <CanvasToolkit draggableElements={step.draggableElements || []} />
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
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Free Plan</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleReaction("like")}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95",
                  userReaction === "like"
                    ? "bg-[#01696F] text-white"
                    : "text-zinc-500 hover:bg-white/60"
                )}
              >
                <ThumbsUp size={10} /> {reactionCounts.likes}
              </button>
              <button
                onClick={() => handleReaction("dislike")}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95",
                  userReaction === "dislike"
                    ? "bg-rose-500 text-white"
                    : "text-zinc-500 hover:bg-white/60"
                )}
              >
                <ThumbsDown size={10} /> {reactionCounts.dislikes}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Left panel toggle ── */}
      <PanelToggle open={leftPanelOpen} onClick={() => setLeftPanelOpen(o => !o)} side="left" />

      {/* ══════════════════════ MAIN WORKSPACE ══════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden mx-1.5">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">

          {/* Left controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              <RefreshCw size={11} /> Reset
            </button>

            <button
              onClick={handlePrevStep}
              disabled={orderPosition === 0}
              className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
            >
              <ArrowLeft size={13} /> <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="text-[12px] font-semibold text-[#01696F] bg-[#E6F0F1] px-3 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none flex-shrink-0 whitespace-nowrap">
              {orderPosition + 1} / {totalSteps}
            </span>

            {allDone && isLastPosition ? (
              <button
                onClick={handleNextLesson}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 ring-2 ring-emerald-300 flex-shrink-0"
              >
                <span className="hidden sm:inline">Next Lesson</span>
                <span className="sm:hidden">Lesson</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                disabled={isLastPosition && !allDone}
                className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:pointer-events-none font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
              >
                <span className="hidden sm:inline">Next</span> <ArrowRight size={13} />
              </button>
            )}

            {!fromCase && (
              <button
                onClick={handleReshuffle}
                className="px-2.5 py-1.5 text-[#01696F] hover:bg-[#E6F0F1] font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 border border-[#01696F]/20 flex-shrink-0"
                title="Re-shuffle activities"
              >
                <Shuffle size={12} /> <span className="hidden md:inline">Shuffle</span>
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                ref={hintButtonRef}
                onClick={() => setHintPopupOpen(o => !o)}
                className={cn(
                  "px-3 py-1.5 font-bold text-xs bg-[#01696F]/10 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 border",
                  hintPopupOpen ? "bg-[#01696F] text-white" : "text-[#01696F] hover:bg-[#E6F0F1] border-transparent"
                )}
              >
                <Lightbulb size={13} fill="currentColor" className={cn("text-[#01696F]", hintPopupOpen && "text-white")} />
                <span className="hidden sm:inline">Hint</span>
                {activity?.hints?.length > 0 && (
                  <span className={cn("w-4 h-4 rounded-full bg-[#01696F]/20 text-[#01696F] text-[12px] font-black flex items-center justify-center", hintPopupOpen ? "bg-white text-gray-800" : "")}>
                    {Math.min(hintsUnlocked, activity.hints.length)}
                  </span>
                )}
              </button>

              {hintPopupOpen && activity?.hints?.length > 0 && (
                <HintsPopup
                  hints={activity.hints}
                  unlocked={hintsUnlocked}
                  onUnlockNext={() => { if (hintsUnlocked < activity.hints.length) setHintsUnlocked(h => h + 1); }}
                  onClose={() => setHintPopupOpen(false)}
                  anchorRef={hintButtonRef}
                />
              )}
            </div>

            <button
              onClick={handleCheckAnswer}
              disabled={submitting || step.completed}
              className="px-3 sm:px-4 py-2 bg-[#00A389] text-white hover:bg-[#00A389]/90 disabled:opacity-50 font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              {submitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> <span className="hidden sm:inline">Checking…</span></>
              ) : step.completed ? (
                <><CheckCircle2 size={13} /> <span className="hidden sm:inline">Done</span></>
              ) : (
                <><span className="hidden sm:inline">Check Answer</span><span className="sm:hidden">Check</span></>
              )}
            </button>
          </div>
        </div>

        {/* ── Completed activity banner ── */}
        {step.completed && !allDone && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-emerald-50 border-b border-emerald-100 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" fill="currentColor" />
              <span className="text-xs font-bold text-emerald-700 truncate">
                Activity complete{step.score !== undefined ? ` — best: ${step.score}%` : ""}
              </span>
            </div>
            <button
              onClick={handleNextStep}
              disabled={isLastPosition}
              className="px-3 py-1 text-[#01696F] bg-white border border-[#01696F]/20 hover:bg-[#E6F0F1] font-bold text-[10px] rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 flex-shrink-0"
            >
              Next <ArrowRight size={11} />
            </button>
          </div>
        )}

        {/* ── All done banner ── */}
        {allDone && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-emerald-600 border-b border-emerald-700 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-white shrink-0" fill="currentColor" />
              <span className="text-xs font-bold text-white">
                {fromCase ? "🎉 Case complete — all activities done!" : "🎉 Lesson complete — you've finished all activities!"}
              </span>
            </div>
            <button
              onClick={handleNextLesson}
              className="px-4 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm flex-shrink-0"
            >
              {fromCase ? "Finish Case" : "Next Lesson"} <ArrowRight size={11} />
            </button>
          </div>
        )}

        {/* ── Activity area (with bottom feedback overlay) ── */}
        <div className="flex-1 overflow-auto relative">

          {step.type === "quantus" && (
            <div className="absolute inset-0 flex flex-col">
              <ExcelGrid
                table={excelTable}
                inputs={excelInputs}
                userInputs={spreadsheetGrid}
                setUserInputs={setSpreadsheetGrid}
                isValidated={feedback !== null}
                feedback={excelFeedback}
                sheetTabName="Model assumptions"
                showToolbar={true}
                colLabels={step.gridCols}
                rowLabels={step.gridRows}
                showProgress={!step.completed}
              />
            </div>
          )}

          {/* ── Canvas: same Excalidraw drag-and-drop for ALL canvas activities ── */}
          {step.type === "canvas" && (
            <div className="absolute inset-0 flex flex-col">
              <CanvasExercise
                canvasBackgroundText={step.questionText || (step.assemblyMode === "graph" ? "Graph Editor" : "Equation Builder")}
                onElementsChange={setCanvasElements}
                initialElements={step.submittedCanvasData || []}
                assemblyMode={step.assemblyMode}
              />
            </div>
          )}

          {step.type === "mcq" && (
            <div className="flex flex-col p-6 sm:p-10 justify-center max-w-3xl mx-auto space-y-8 animate-fade-in w-full min-h-full">
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">
                {step.questionText}
              </h2>
              <div className="space-y-3">
                {step.options?.map((opt: any) => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !step.completed && setSelectedOption(opt.id)}
                      className={cn(
                        "w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm active:scale-[0.99] group",
                        isSelected ? "bg-[#01696F] border-transparent text-white font-bold" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700 bg-white",
                        step.completed && "pointer-events-none opacity-80"
                      )}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm transition-all",
                          isSelected ? "bg-white text-[#01696F]" : "bg-white border border-zinc-200 text-zinc-700"
                        )}>
                          {opt.display}
                        </span>
                        <span className="text-sm font-semibold tracking-tight">{opt.label}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-white flex-shrink-0" fill="currentColor" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Bottom-center feedback ── */}
          <BottomFeedback
            feedback={feedback}
            onClose={() => setFeedback(null)}
            onNext={handleNextStep}
            onNextLesson={handleNextLesson}
            isLastPosition={isLastPosition}
            allDone={allDone}
          />
        </div>
      </div>

      {/* ── Right panel toggle ── */}

      <PanelToggle open={rightPanelOpen} onClick={() => setRightPanelOpen(o => !o)} side="right" />


      {/* ══════════════════════ RIGHT PANEL — AI COACH ══════════════════════ */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
          rightPanelOpen ? "w-72 xl:w-80" : "w-0"
        )}
      >
        <div className="w-72 xl:w-80 h-full flex flex-col pl-2">
          <div className="bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">

            {/* ───────────── Header ───────────── */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">

              <Image
                src="/AiAssistance.svg"
                alt="AI Coach"
                width={32}
                height={32}
              />

              <h3 className="font-black text-zinc-800 text-base tracking-tight">
                AI Coach
              </h3>

              {/* Close Button */}
              <button
                onClick={() => setRightPanelOpen(false)}
                aria-label="Close AI Coach"
                className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group"
              >
                <X
                  size={16}
                  className="text-zinc-500 group-hover:text-zinc-800 transition"
                />
              </button>
            </div>

            {/* ───────────── Body ───────────── */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-[#F0EDE7]">

              {/* Default state */}
              {!feedback && (
                <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Complete the activity and I'll give you instant feedback here.
                    Use the <strong className="text-amber-600">Hint</strong> button above
                    if you get stuck — hints appear right there so you can keep your eyes on the work.
                  </p>
                </div>
              )}


              {/* Case Notes */}
              {activity.caseNotes && (
                <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                    Case Notes
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                    {activity.caseNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}