"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { saveQuantusDraft, loadQuantusDraft, clearQuantusDraft, saveCanvasDraft, loadCanvasDraft, clearCanvasDraft } from "@/lib/activityDraft";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Pause,
  ChevronLeft,
  ChevronRight,
  Trophy,
  X,
  Lightbulb,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { skillApi, activitiesApi, attemptsApi, reactionsApi, ApiError } from "@/lib/api";
import { CanvasExercise } from "@/components/exercise/CanvasExercise";
import { ExcelGrid, evaluateExcelFormula } from "@/components/exercise/ExcelGrid";
import { CanvasToolkit } from "@/components/exercise/CanvasToolkit";
import { TimerBar } from "@/components/skill/TimerBar";
import { Logo } from "@/components/layout/Logo";
import { CollapsiblePanel, PanelEdgeRail, PanelReopenTab, useCollapsiblePanel } from "@/components/activity/panels";
import Cookies from "js-cookie";

// ─── Normalization ────────────────────────────────────────────────────────────

function normalizeStep(rawStep: any, activityType: string): any[] {
  const d = rawStep.data ?? {};

  if (activityType === "mcq") {
    return (d.questions ?? []).map((q: any) => ({
      type: "mcq",
      id: q.id,
      activityId: d.id,
      questionText: q.questionText,
      instructions: d.instructions,
      contextText: d.context,
      explanation: q.explanation,
      options: (q.options ?? []).map((o: any, idx: number) => ({
        id: o.id,
        label: o.optionText,
        display: String.fromCharCode(65 + idx),
      })),
    }));
  }

  if (activityType === "canvas") {
    return [
      {
        type: "canvas",
        id: d.id,
        instructions: d.instructions,
        contextText: d.context,
        questionText: d.title,
        assemblyMode: d.assemblyMode || "sequence",
        scoringMode: d.scoringMode || "partial",
        tokens: d.tokens || [],
        draggableElements: d.draggableElements,
      },
    ];
  }

  if (activityType === "quantus") {
    return [
      {
        type: "quantus",
        id: d.id,
        instructions: d.instructions,
        contextText: d.context,
        gridRows: d.gridRows,
        gridCols: d.gridCols,
        gridValues: d.gridValues,
        correctAnswers: d.correctAnswers,
        cellHints: d.cellHints ?? {},
      },
    ];
  }

  return [];
}

// ─── Type meta ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string }> = {
  quantus: { label: "Spreadsheet", color: "bg-sky-100 text-sky-700 border-sky-200" },
  mcq: { label: "Multiple Choice", color: "bg-violet-100 text-violet-700 border-violet-200" },
  canvas: { label: "Framework Drill", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

function ActivityTypePill({ type }: { type: string }) {
  const m = TYPE_META[type] ?? { label: type, color: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", m.color)}>
      {m.label}
    </span>
  );
}

// ─── Confirm overlay ──────────────────────────────────────────────────────────

function ConfirmSubmitOverlay({
  completedItems,
  totalItems,
  onConfirm,
  onReview,
  isSubmitting,
}: {
  completedItems: number;
  totalItems: number;
  onConfirm: () => void;
  onReview: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full mx-4 border border-zinc-100">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Trophy size={28} className="text-emerald-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">All items complete!</h3>
          <p className="text-xs text-zinc-500 font-semibold mt-2 leading-relaxed">
            You've finished all {totalItems} activities in this session. Submit now to lock in your score.
          </p>
        </div>
        <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Completed</span>
          <span className="text-sm font-black text-[#01696F]">{completedItems} / {totalItems} activities</span>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#01696F] hover:bg-[#01696F]/90 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Submitting…</>
            ) : (
              <>Submit & see results<ArrowRight size={13} /></>
            )}
          </button>
          <button
            onClick={onReview}
            disabled={isSubmitting}
            className="w-full py-2.5 text-xs text-zinc-400 font-bold hover:text-zinc-600 transition-colors"
          >
            Review my answers first
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Feedback ──────────────────────────────────────────────────────────

function BottomFeedback({
  feedback,
  onClose,
}: {
  feedback: any;
  onClose: () => void;
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
        </div>
        <button
          onClick={onClose}
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all",
            ok ? "hover:bg-emerald-100 text-emerald-500" : "hover:bg-rose-100 text-rose-400"
          )}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TestSessionPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;
  const activityType = params?.activityType as string;

  const token = useAuthStore((s) => s.token) || Cookies.get("shankh-token");
  const user = useAuthStore((s) => s.user);

  // ── Session & item state ──────────────────────────────────────────────────
  const [session, setSession] = useState<any>(null);
  const [nextItem, setNextItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Activity rendering state ──────────────────────────────────────────────
  const [activityData, setActivityData] = useState<any>(null);
  const [normalizedSteps, setNormalizedSteps] = useState<any[]>([]);
  const [currentStepSubIndex, setCurrentStepSubIndex] = useState(0);

  // ── User input states ─────────────────────────────────────────────────────
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spreadsheetGrid, setSpreadsheetGrid] = useState<Record<string, string>>({});
  const [canvasElements, setCanvasElements] = useState<any>(null);
  // Separate initial snapshot passed to CanvasExercise — decoupled from the
  // live canvasElements so that user edits don't re-trigger initialisation.
  const [initialCanvasElements, setInitialCanvasElements] = useState<any>(null);
  const [excelValidated, setExcelValidated] = useState(false);
  const [excelFeedback, setExcelFeedback] = useState<Record<string, boolean>>({});

  // ── UI state ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Panel state ───────────────────────────────────────────────────────────
  // Left panel: new collapsible + resizable shell with a floating edge rail,
  // persisted per test id. Right panel keeps its previous fixed-width behaviour.
  const {
    open: leftPanelOpen, setOpen: setLeftPanelOpen, toggle: toggleLeft,
    width: leftWidth, resize: resizeLeft,
  } = useCollapsiblePanel(`skill:${testId}:left`, { defaultOpen: true, defaultWidth: 256, min: 180, max: 420 });
  const {
    open: rightPanelOpen, setOpen: setRightPanelOpen, toggle: toggleRight,
    width: rightWidth, resize: resizeRight,
  } = useCollapsiblePanel(`skill:${testId}:right`, { defaultOpen: true, defaultWidth: 320, min: 240, max: 520 });
  const [dragging, setDragging] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"instructions" | "context">("instructions");

  // ── Step counting (MCQ questions each count as 1 step) ────────────────────
  const [totalSteps, setTotalSteps] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);

  // ── Reactions for current test item ──────────────────────────────────────
  const [reactionCounts, setReactionCounts] = useState({ likes: 0, dislikes: 0 });
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);

  // Track latest timeSpentSecs for the confirm overlay's complete call
  const timeSpentRef = useRef(0);

  // ── Mobile: collapse panels on small screens ──────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  }, []);

  // ── Load or start session ─────────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    if (!testId || !activityType) return;
    try {
      let data: any;

      try {
        data = await skillApi.testSession<any>(testId, activityType);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          try {
            const init = await skillApi.startSession<any>(testId, { activityType });
            data = {
              session: init.session,
              completedItemIds: [],
              nextItem: init.items?.[0] ?? null,
            };
          } catch (e2) {
            if (e2 instanceof ApiError && e2.status === 409) {
              // Session already completed — send straight to results
              router.replace(`/skill/tests/${testId}/${activityType}/result`);
              return;
            }
            throw e2;
          }
        } else {
          throw e;
        }
      }

      setSession(data.session);
      timeSpentRef.current = data.session.timeSpentSecs ?? 0;

      if (data.session.status === "completed" || data.session.status === "expired") {
        router.push(`/skill/tests/${testId}/${activityType}/result`);
        return;
      }

      if (!data.nextItem) {
        setShowConfirm(true);
        setLoading(false);
        return;
      }

      setNextItem(data.nextItem);

      const raw = await activitiesApi.get<any>(data.nextItem.lessonId);

      const targetStep = raw.steps.find((s: any) => s.type === activityType);
      if (!targetStep) throw new Error("Activity type not found in lesson");

      const norm = normalizeStep(targetStep, activityType);
      setNormalizedSteps(norm);
      setActivityData(raw);
      setCurrentStepSubIndex(0);

      // Each MCQ question counts as 1 step; canvas/quantus = 1 step per item
      const stepsPerItem = activityType === "mcq" ? norm.length : 1;
      setTotalSteps(data.session.totalItems * stepsPerItem);
      setCompletedSteps(data.session.completedItems * stepsPerItem);

      // Fetch reactions for the new lesson item
      if (token && data.nextItem?.lessonId) {
        reactionsApi
          .lesson<any>(data.nextItem.lessonId)
          .then((rj) => {
            if (rj) {
              setReactionCounts({ likes: rj.likes, dislikes: rj.dislikes });
              setUserReaction(rj.userReaction);
            }
          })
          .catch(() => {});
      }

      setSelectedOption(null);
      setExcelValidated(false);
      setExcelFeedback({});
      // Load local draft first; fall back to server-provided initial values.
      // Use data.nextItem directly — nextItem state is stale at this point.
      const qDraft = activityType === "quantus" ? loadQuantusDraft(data.nextItem.id) : null;
      setSpreadsheetGrid(qDraft ?? targetStep.data?.gridValues ?? {});
      const cDraft = activityType === "canvas" ? loadCanvasDraft(data.nextItem.id) : null;
      const initElements = cDraft ?? [];
      setCanvasElements(initElements);
      setInitialCanvasElements(initElements);
      setFeedback(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [testId, activityType, token]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ── Persist Quantus draft locally ─────────────────────────────────────────
  useEffect(() => {
    if (!nextItem || activityType !== "quantus") return;
    if (Object.keys(spreadsheetGrid).length === 0) return;
    const t = setTimeout(() => saveQuantusDraft(nextItem.id, spreadsheetGrid), 600);
    return () => clearTimeout(t);
  }, [spreadsheetGrid, nextItem, activityType]);

  // ── Persist Canvas draft locally ──────────────────────────────────────────
  useEffect(() => {
    if (!nextItem || activityType !== "canvas") return;
    if (!canvasElements?.nodes?.length && !canvasElements?.edges?.length) return;
    const t = setTimeout(() => saveCanvasDraft(nextItem.id, canvasElements), 400);
    return () => clearTimeout(t);
  }, [canvasElements, nextItem, activityType]);

  // ── Timer handlers ────────────────────────────────────────────────────────
  const handleTimerTick = useCallback((secs: number) => {
    timeSpentRef.current = secs;
  }, []);

  const handleTimerExpired = async () => {
    if (!session) return;
    try {
      await skillApi.completeSession(session.id, { timeSpentSecs: session.timeLimitMins * 60 });
      router.push(`/skill/tests/${testId}/${activityType}/result`);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Confirm & complete ────────────────────────────────────────────────────
  const handleConfirmComplete = async () => {
    if (!session) return;
    setCompleting(true);
    try {
      await skillApi.completeSession(session.id, { timeSpentSecs: timeSpentRef.current });
      router.push(`/skill/tests/${testId}/${activityType}/result`);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const TYPE_TO_SECTION: Record<string, string> = {
    mcq: "mcqs",
    canvas: "framework_drills",
    quantus: "quant_lab",
  };

  const handlePauseExit = async () => {
    if (session) {
      try {
        await skillApi.updateSession(session.id, { timeSpentSecs: timeSpentRef.current });
      } catch { }
    }
    router.push(`/skill?section=${TYPE_TO_SECTION[activityType] ?? "mcqs"}`);
  };

  // ── Validation helpers ────────────────────────────────────────────────────
  const validateExcel = (step: any): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    if (!step?.gridRows || !step?.gridCols) return result;
    // Key must match ExcelGrid getCellKey — label-based
    const key = (r: number, c: number) => `${step.gridRows[r]}-${step.gridCols[c]}`;
    step.gridRows.forEach((_: string, rIdx: number) => {
      step.gridCols.forEach((_c: string, cIdx: number) => {
        if (cIdx === 0) return;
        const k = key(rIdx, cIdx);
        let n = 0;
        try {
          n = Number(evaluateExcelFormula(spreadsheetGrid[k] ?? "", spreadsheetGrid, [], key));
        } catch {
          n = Number(spreadsheetGrid[k]);
        }
        const expected = Number(step.correctAnswers?.[k]);
        const diff = Math.abs(n - expected);
        const tol = Math.abs(expected) > 1 ? Math.abs(expected) * 0.001 : 0.001;
        result[k] = diff <= tol;
      });
    });
    return result;
  };

  const extractCanvasGraph = (_step: any) => {
    // canvasElements is now a React Flow { nodes, edges } graph
    const rfData = canvasElements as any;
    if (!rfData?.nodes) return { placedTokens: [], edges: [] };
    const nodeMap = new Map<string, string>(
      (rfData.nodes as any[]).map((n: any) => [n.id, n.data?.tokenId as string])
    );
    const placedTokens = (rfData.nodes as any[])
      .map((n: any) => n.data?.tokenId as string)
      .filter(Boolean);
    const edges = (rfData.edges as any[] ?? [])
      .map((e: any) => {
        const from = nodeMap.get(e.source);
        const to   = nodeMap.get(e.target);
        return from && to ? { from, to } : null;
      })
      .filter(Boolean);
    return { placedTokens, edges };
  };

  // ── Check & submit ────────────────────────────────────────────────────────
  const handleCheckSubmit = async () => {
    if (!session || !nextItem || !normalizedSteps.length) return;
    const step = normalizedSteps[currentStepSubIndex];
    setSubmitting(true);
    setFeedback(null);

    const gradePayload: Record<string, any> = { lessonId: nextItem.lessonId, activityType };

    if (activityType === "mcq") {
      if (!selectedOption) {
        setFeedback({ isError: true, message: "Please select an option first!" });
        setSubmitting(false);
        return;
      }
      gradePayload.answers = [{ questionId: step.id || "", selectedOptionId: selectedOption }];
    } else if (activityType === "quantus") {
      const res = validateExcel(step);
      const correct = Object.values(res).filter(Boolean).length;
      const total = Object.values(res).length;
      gradePayload.inputSnapshot = spreadsheetGrid;
      gradePayload.score = correct;
      gradePayload.total = total;
    } else if (activityType === "canvas") {
      const graph = extractCanvasGraph(step);
      if (graph.placedTokens.length === 0) {
        setFeedback({ isError: true, message: "Drag some tokens onto the canvas first!" });
        setSubmitting(false);
        return;
      }
      gradePayload.canvasData = graph;
    }

    try {
      const grade = await attemptsApi.session<any>(activityType, gradePayload);

      const attemptId = grade.id;
      const scorePct = grade.accuracy ?? grade.scorePct ?? 100;

      // Per-cell feedback for quantus
      if (activityType === "quantus") {
        const cellMap: Record<string, boolean> = {};
        const correctAnswers: Record<string, string> = step.correctAnswers ?? {};
        // Keys are already label-based after backend + frontend normalisation
        Object.entries(correctAnswers).forEach(([k, expected]) => {
          const userVal = (spreadsheetGrid[k] ?? "").trim();
          const numUser = Number(userVal);
          const numExp = Number(expected as string);
          const bothNum = !isNaN(numUser) && !isNaN(numExp) && String(expected) !== "";
          const diff = Math.abs(numUser - numExp);
          const tol = Math.abs(numExp) > 1 ? Math.abs(numExp) * 0.001 : 0.001;
          cellMap[k] = bothNum ? diff <= tol : userVal === String(expected).trim();
        });
        setExcelFeedback(cellMap);
        setExcelValidated(true);
      }

      if (activityType === "mcq" && currentStepSubIndex < normalizedSteps.length - 1) {
        setCompletedSteps((prev) => prev + 1);
        setCurrentStepSubIndex((prev) => prev + 1);
        setSelectedOption(null);
        setFeedback({
          isError: false,
          message: `Question ${currentStepSubIndex + 1} recorded. Next question →`,
        });
        setSubmitting(false);
        return;
      }

      const submit = await skillApi.submitSession<any>(session.id, {
        testItemId: nextItem.id,
        activityType,
        existingSessionId: attemptId,
        scorePct,
      });

      const { sessionProgress, allComplete } = submit;

      setSession((prev: any) => ({
        ...prev,
        completedItems: sessionProgress.completedItems,
        totalItems: sessionProgress.totalItems,
      }));

      // Count this final step as done
      setCompletedSteps((prev) => prev + 1);

      // Clear local draft — activity submitted to server
      if (nextItem) {
        clearQuantusDraft(nextItem.id);
        clearCanvasDraft(nextItem.id);
      }

      if (allComplete) {
        setFeedback(null);
        setShowConfirm(true);
      } else {
        setFeedback({ isError: false, message: "Activity recorded! Loading next activity…" });
        setTimeout(() => loadSession(), 1200);
      }
    } catch (e: any) {
      setFeedback({ isError: true, message: e?.message || "Error submitting answer." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reactions ─────────────────────────────────────────────────────────────
  const handleReaction = async (reaction: "like" | "dislike") => {
    if (!token || !nextItem?.lessonId) return;
    try {
      const rj = await reactionsApi.react<any>(nextItem.lessonId, { reaction, source: "test" });
      if (rj) {
        setReactionCounts({ likes: rj.likes, dislikes: rj.dislikes });
        setUserReaction(rj.userReaction);
      }
    } catch { }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F] gap-2">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold">Loading test session…</span>
      </div>
    );
  }

  const step = normalizedSteps[currentStepSubIndex];

  const mcqLabel =
    activityType === "mcq" && normalizedSteps.length > 1
      ? `Question ${currentStepSubIndex + 1} of ${normalizedSteps.length}`
      : null;

  const completedItems = session?.completedItems ?? 0;
  const totalItems = session?.totalItems ?? 0;
  // Use fine-grained step counts (each MCQ question = 1 step) for display
  const displayCompleted = totalSteps > 0 ? completedSteps : completedItems;
  const displayTotal = totalSteps > 0 ? totalSteps : totalItems;
  const progressPct = displayTotal > 0 ? Math.round((displayCompleted / displayTotal) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-row h-screen overflow-hidden font-sans bg-white text-zinc-800 p-2 sm:p-3 gap-0">

      {/* Far-left edge rail — collapse / expand the left panel */}
      <PanelEdgeRail side="left" open={leftPanelOpen} onToggle={toggleLeft} label="test panel" />

      {/* ══════════════════════ LEFT PANEL ══════════════════════ */}
      <CollapsiblePanel
        side="left"
        open={leftPanelOpen}
        width={leftWidth}
        dragging={dragging}
        resizable
        onResize={resizeLeft}
        onDragState={setDragging}
        innerClassName="h-full flex flex-col justify-between pr-2"
      >
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">

            {/* Logo + back */}
            <div className="flex flex-col items-center gap-3 border-b border-zinc-100 pb-3 pt-1">
              <div className="w-full flex justify-center">
                <Logo variant="full" width={110} height={32} className="object-contain" style={{ width: "auto", height: "auto" }} />
              </div>
              <button
                onClick={handlePauseExit}
                className="w-full py-1.5 bg-[#DFEAEA] text-[#01696F] hover:bg-[#D7E8E9] font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-[#01696F]/10"
              >
                <ChevronLeft size={13} /> Pause & Exit
              </button>
            </div>

            

            {/* Progress */}
            <div className="flex flex-col gap-1.5 px-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progress</span>
                <span className="text-[10px] font-black text-[#01696F]">{displayCompleted}/{displayTotal}</span>
              </div>
              <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                <div
                  className="h-full bg-[#01696F] rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Activity type */}
            {step && (
              <div className="flex items-center justify-between px-1">
                <ActivityTypePill type={step.type} />
                {mcqLabel && (
                  <span className="text-[10px] font-bold text-zinc-400">{mcqLabel}</span>
                )}
              </div>
            )}

            {/* Instructions / Context tabs */}
            <div className="flex bg-[#F0EDE7] p-1 rounded-full w-full border border-zinc-200/50 shadow-sm">
              {(["instructions", "context"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveLeftTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all duration-200 capitalize",
                    activeLeftTab === tab
                      ? "bg-[#28251D] text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
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
                  {activityData?.lessonName || "Skill Test"}
                </h3>
                <span className="px-2 py-0.5 bg-[#01696F]/10 text-[#01696F] text-[9px] font-black rounded-full uppercase tracking-wider flex-shrink-0">
                  {activityType}
                </span>
              </div>

              {activeLeftTab === "instructions" ? (
                <div className="animate-fade-in">
                  <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">
                    Instructions
                  </span>
                  <p className="text-xs text-zinc-700 leading-relaxed font-semibold whitespace-pre-line">
                    {step?.instructions || step?.questionText || "Complete the activity and submit your answer."}
                  </p>
                </div>
              ) : (
                step?.contextText && (
                  <div className="animate-fade-in">
                    <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1">
                      Context & Scenario
                    </span>
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line">
                      {step.contextText}
                    </p>
                  </div>
                )
              )}

              {activityType === "canvas" && step?.draggableElements && (
                <CanvasToolkit draggableElements={step.draggableElements} />
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
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Test Session</p>
            </div>
            {nextItem && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleReaction("like")}
                  className={cn(
                    "flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-90",
                    userReaction === "like" ? "bg-[#01696F] text-white" : "text-zinc-500 hover:bg-white/60"
                  )}
                >
                  <ThumbsUp size={10} /> {reactionCounts.likes}
                </button>
                <button
                  onClick={() => handleReaction("dislike")}
                  className={cn(
                    "flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-90",
                    userReaction === "dislike" ? "bg-rose-500 text-white" : "text-zinc-500 hover:bg-white/60"
                  )}
                >
                  <ThumbsDown size={10} /> {reactionCounts.dislikes}
                </button>
              </div>
            )}
          </div>
      </CollapsiblePanel>

      {/* ══════════════════════ MAIN WORKSPACE ══════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden mx-1.5">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">

          {/* Left controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePauseExit}
              className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              <Pause size={11} className="flex-shrink-0" />
              <span className="hidden sm:inline">Pause</span>
            </button>

            {/* Session progress indicator */}
            <span className="text-[12px] font-semibold text-[#01696F] bg-[#E6F0F1] px-3 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none flex-shrink-0 whitespace-nowrap">
              {displayCompleted} / {displayTotal} done
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCheckSubmit}
              disabled={submitting || showConfirm}
              className="px-3 sm:px-4 py-2 bg-[#00A389] text-white hover:bg-[#00A389]/90 disabled:opacity-50 font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
            >
              {submitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span className="hidden sm:inline">Checking…</span></>
              ) : (
                <><span className="hidden sm:inline">Submit Answer</span><span className="sm:hidden">Submit</span><ArrowRight size={13} /></>
              )}
            </button>
          </div>
        </div>

        {/* ── Activity area ── */}
        <div className="flex-1 overflow-auto relative">

          {/* Confirm overlay */}
          {showConfirm && (
            <ConfirmSubmitOverlay
              completedItems={displayCompleted}
              totalItems={displayTotal}
              onConfirm={handleConfirmComplete}
              onReview={() => setShowConfirm(false)}
              isSubmitting={completing}
            />
          )}

          {/* Quantus */}
          {activityType === "quantus" && step && (
            <div className="absolute inset-0 flex flex-col">
              <ExcelGrid
                table={
                  step.gridRows?.map((row: string) =>
                    step.gridCols?.map((col: string) =>
                      step.gridValues?.[`${row}-${col}`] ?? ""
                    )
                  ) || []
                }
                inputs={
                  step.gridRows?.flatMap((row: string, rIdx: number) =>
                    step.gridCols
                      ?.map((col: string, cIdx: number) => {
                        if (cIdx === 0) return null;
                        const k = `${row}-${col}`;
                        if (step.correctAnswers?.[k] === undefined) return null;
                        return {
                          row: rIdx,
                          col: cIdx,
                          correctValue: step.correctAnswers[k] || "",
                          placeholder: "",
                          formula: step.cellHints?.[k] || undefined,
                        };
                      })
                      .filter(Boolean)
                  ) || []
                }
                userInputs={spreadsheetGrid}
                setUserInputs={setSpreadsheetGrid}
                isValidated={excelValidated}
                feedback={excelFeedback}
                sheetTabName="Test model"
                showToolbar={true}
                colLabels={step.gridCols || []}
                rowLabels={step.gridRows || []}
                showProgress={!excelValidated}
              />
            </div>
          )}

          {/* Canvas */}
          {activityType === "canvas" && step && (
            <div className="absolute inset-0 flex flex-col">
              <CanvasExercise
                canvasBackgroundText={step.questionText || "Framework Drill"}
                onElementsChange={setCanvasElements}
                initialElements={initialCanvasElements}
                tokens={step.tokens || []}
                assemblyMode={step.assemblyMode}
              />
            </div>
          )}

          {/* MCQ */}
          {activityType === "mcq" && step && (
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
                      onClick={() => setSelectedOption(opt.id)}
                      className={cn(
                        "w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm active:scale-[0.99] group",
                        isSelected
                          ? "bg-[#01696F] border-transparent text-white font-bold"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 text-zinc-700 bg-white"
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

          {/* Bottom feedback */}
          <BottomFeedback feedback={feedback} onClose={() => setFeedback(null)} />
        </div>
      </div>

      {/* Right panel reopen tab (previous style) */}
      <PanelReopenTab
        open={rightPanelOpen}
        onOpen={() => setRightPanelOpen(true)}
        label="Session"
        icon={<Trophy size={14} className="text-[#01696F] group-hover:scale-110 transition-transform duration-200" />}
      />

      {/* ══════════════════════ RIGHT PANEL — SESSION INFO ══════════════════════ */}
      <CollapsiblePanel
        side="right"
        open={rightPanelOpen}
        width={rightWidth}
        dragging={dragging}
        resizable
        onResize={resizeRight}
        onDragState={setDragging}
        title="Session"
        icon={<Trophy size={16} className="text-[#01696F]" />}
        onClose={() => setRightPanelOpen(false)}
        innerClassName="h-full flex flex-col pl-2"
      >
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-[#F0EDE7]">

              {/* Timer card */}
              {session && (
                <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Timer</h4>
                  <TimerBar
                    sessionId={session.id}
                    timeLimitMins={session.timeLimitMins}
                    initialTimeSpentSecs={session.timeSpentSecs ?? 0}
                    onExpire={handleTimerExpired}
                    onTick={handleTimerTick}
                  />
                </div>
              )}

              {/* Session progress card */}
              <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm flex flex-col gap-2">
                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Session Progress</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-semibold">Activities done</span>
                  <span className="text-sm font-black text-[#01696F]">{displayCompleted} / {displayTotal}</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                  <div
                    className="h-full bg-[#01696F] rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Current activity card */}
              {step && (
                <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    Current Activity
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    <ActivityTypePill type={step.type} />
                    <p className="text-[11px] text-zinc-600 font-medium leading-relaxed mt-1">
                      {step.instructions || step.questionText || "Complete the activity."}
                    </p>
                  </div>
                </div>
              )}

              {/* Tips card */}
              <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb size={12} className="text-amber-500" fill="currentColor" />
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Tips</h4>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                  Complete each activity and submit to advance. Your progress is saved automatically.
                  Use Pause to exit without losing your work.
                </p>
              </div>
            </div>
      </CollapsiblePanel>
    </div>
  );
}