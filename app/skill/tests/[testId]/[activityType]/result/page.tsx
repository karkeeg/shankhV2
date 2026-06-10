"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PASS_THRESHOLD_PCT } from "@/lib/thresholds";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, Trophy, Clock, CheckCircle2, AlertCircle,
  XCircle, BarChart2, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { ExcelGrid } from "@/components/exercise/ExcelGrid";
import { CanvasExercise } from "@/components/exercise/CanvasExercise";
import { useAuthStore } from "@/lib/auth-store";
import { skillApi, activitiesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${mins}m ${remaining.toString().padStart(2, "0")}s`;
}

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

// ─── Panel Toggle ─────────────────────────────────────────────────────────────

function PanelToggle({ open, onClick, side }: { open: boolean; onClick: () => void; side: "left" | "right" }) {
  if (open) return null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "self-center z-20 flex-shrink-0",
        "w-8 h-40 bg-white border border-zinc-200 shadow-md",
        "rounded-full flex items-center justify-center",
        "hover:bg-[#E6F0F1] hover:border-[#01696F]/30",
        "transition-all duration-200 active:scale-95 group"
      )}
    >
      {side === "left" ? (
        <ChevronRight size={14} className="text-zinc-500 group-hover:text-[#01696F]" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
            Results
          </span>
          <Trophy size={14} className="text-[#01696F] group-hover:scale-110 transition-transform duration-200" />
        </div>
      )}
    </button>
  );
}

// ─── MCQ Question View (read-only) ────────────────────────────────────────────

function McqQuestionView({ answer, questionIdx, totalQuestions }: { answer: any; questionIdx: number; totalQuestions: number }) {
  const q = answer?.question;
  if (!q) return <p className="text-xs text-zinc-400 font-semibold py-8 text-center">No answer data available.</p>;

  return (
    <div className="flex flex-col p-6 sm:p-10 max-w-3xl mx-auto w-full min-h-full justify-center space-y-8 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          Question {questionIdx + 1} of {totalQuestions}
        </span>
      </div>
      <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 leading-snug tracking-tight">
        {q.questionText}
      </h2>
      <div className="space-y-3">
        {(q.options ?? []).map((opt: any, oi: number) => {
          const isSelected = opt.id === answer.selectedOptionId;
          const isCorrect = opt.isCorrect;
          let cls = "border-zinc-200 bg-white text-zinc-700";
          if (isCorrect) cls = "border-emerald-300 bg-emerald-50 text-emerald-900";
          if (isSelected && !isCorrect) cls = "border-rose-300 bg-rose-50 text-rose-900";
          return (
            <div
              key={opt.id}
              className={cn(
                "w-full text-left p-4 sm:p-5 rounded-2xl border flex items-center justify-between shadow-sm",
                cls
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm border",
                  isCorrect ? "bg-emerald-500 text-white border-transparent"
                    : isSelected ? "bg-rose-500 text-white border-transparent"
                      : "bg-white border-zinc-200 text-zinc-700"
                )}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="text-sm font-semibold tracking-tight">{opt.optionText}</span>
              </div>
              {isSelected && !isCorrect && <XCircle size={18} className="text-rose-500 flex-shrink-0" fill="currentColor" />}
              {isCorrect && <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" fill="currentColor" />}
            </div>
          );
        })}
      </div>
      {q.explanation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wider mb-1.5">💡 Explanation</p>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ─── Quantus Review ───────────────────────────────────────────────────────────

function QuantusReview({ quantusSession }: { quantusSession: any }) {
  const activity = quantusSession?.activity;
  const inputSnapshot: Record<string, string> = quantusSession?.inputSnapshot ?? {};

  if (!activity?.columns?.length) {
    return <p className="text-xs text-zinc-400 font-semibold py-8 text-center">No answer data available.</p>;
  }

  const colsSorted: { colIndex: number; label: string }[] = [...(activity.columns ?? [])].sort(
    (a: any, b: any) => a.colIndex - b.colIndex
  );
  const colLabelMap: Record<number, string> = {};
  for (const c of colsSorted) colLabelMap[c.colIndex] = c.label;
  const colLabels = colsSorted.map(c => c.label);

  const cells: any[] = activity.quantusCells ?? [];
  const rowIndices = [...new Set(cells.map((c: any) => c.rowIndex as number))].sort((a, b) => a - b);

  const firstColIdx = colsSorted[0]?.colIndex ?? 0;
  const rowLabelMap: Record<number, string> = {};
  cells.filter((c: any) => c.colIndex === firstColIdx).forEach((c: any) => {
    rowLabelMap[c.rowIndex] = (c.displayValue || "").trim() || String(c.rowIndex);
  });
  const rowLabels = rowIndices.map(r => rowLabelMap[r] ?? String(r));

  const table: (string | number | null)[][] = rowIndices.map(rIdx =>
    colsSorted.map(col => {
      const cell = cells.find((c: any) => c.rowIndex === rIdx && c.colIndex === col.colIndex);
      if (!cell) return "";
      const rowLabel = rowLabelMap[rIdx] ?? String(rIdx);
      const colLabel = colLabelMap[col.colIndex] ?? String(col.colIndex);
      const k = `${rowLabel}-${colLabel}`;
      if (cell.isEditable) return inputSnapshot[k] ?? "";
      return (cell.displayValue || "").trim();
    })
  );

  const inputs: { row: number; col: number; correctValue: string; placeholder: string }[] = [];
  const feedback: Record<string, boolean> = {};

  rowIndices.forEach((rIdx, rowPos) => {
    colsSorted.forEach((col, colPos) => {
      const cell = cells.find((c: any) => c.rowIndex === rIdx && c.colIndex === col.colIndex);
      if (!cell?.isEditable || !cell.expectedValue) return;
      const rowLabel = rowLabelMap[rIdx] ?? String(rIdx);
      const colLabel = colLabelMap[col.colIndex] ?? String(col.colIndex);
      const k = `${rowLabel}-${colLabel}`;
      inputs.push({ row: rowPos, col: colPos, correctValue: cell.expectedValue, placeholder: "" });
      const userVal = (inputSnapshot[k] ?? "").toString().trim();
      const expVal = cell.expectedValue.toString().trim();
      const numUser = Number(userVal);
      const numExp = Number(expVal);
      const bothNum = !isNaN(numUser) && !isNaN(numExp) && expVal !== "";
      const tol = Math.abs(numExp) > 1 ? Math.abs(numExp) * 0.001 : 0.001;
      feedback[k] = bothNum ? Math.abs(numUser - numExp) <= tol : userVal === expVal;
    });
  });

  return (
    <div className="absolute inset-0 flex flex-col">
      <ExcelGrid
        table={table}
        inputs={inputs}
        userInputs={inputSnapshot}
        setUserInputs={() => {}}
        isValidated={true}
        feedback={feedback}
        colLabels={colLabels}
        rowLabels={rowLabels}
        showProgress={false}
        sheetTabName="Review"
      />
    </div>
  );
}

// ─── Canvas Review ────────────────────────────────────────────────────────────

function CanvasReview({ item }: { item: any }) {
  const [activityData, setActivityData] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (!item.lessonId || !item.canvasData) return;
    setLoadingActivity(true);
    activitiesApi
      .get<any>(item.lessonId)
      .then(d => setActivityData(d))
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
  }, [item.lessonId, item.canvasData]);

  if (!item.canvasData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-400 font-semibold">This activity was not completed.</p>
      </div>
    );
  }

  if (loadingActivity) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-[#01696F]">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-semibold">Loading canvas…</span>
      </div>
    );
  }

  // Reconstruct React Flow graph from stored canvasData + token definitions
  const canvasStep = activityData?.steps?.find((s: any) => s.type === "canvas");
  const tokens: any[] = canvasStep?.data?.tokens ?? [];
  const tokenMap = new Map(tokens.map((t: any) => [t.id, t]));

  const { placedTokens = [], edges: rawEdges = [] } = item.canvasData;

  const COLS = Math.max(1, Math.ceil(Math.sqrt(placedTokens.length)));
  const rfNodes = (placedTokens as string[]).map((tokenId, i) => {
    const tok = tokenMap.get(tokenId);
    return {
      id: `node-${i}`,
      type: "tokenNode",
      position: { x: (i % COLS) * 220, y: Math.floor(i / COLS) * 140 },
      data: {
        tokenId,
        label: tok?.displayText || tok?.label || tok?.content || tokenId,
        shape: tok?.shape || tok?.type || "rectangle",
      },
    };
  });

  // Map tokenId → node id (first occurrence wins)
  const nodeIdByTokenId = new Map<string, string>();
  (placedTokens as string[]).forEach((tid, i) => {
    if (!nodeIdByTokenId.has(tid)) nodeIdByTokenId.set(tid, `node-${i}`);
  });

  const rfEdges = (rawEdges as { from: string; to: string }[])
    .map((e, i) => {
      const src = nodeIdByTokenId.get(e.from);
      const tgt = nodeIdByTokenId.get(e.to);
      if (!src || !tgt) return null;
      return {
        id: `edge-${i}`,
        source: src,
        target: tgt,
        type: "deletable",
        markerEnd: { type: "arrowclosed", color: "#94a3b8", width: 14, height: 14 },
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      };
    })
    .filter(Boolean);

  const graph = { nodes: rfNodes, edges: rfEdges as any[] };

  return (
    <div className="absolute inset-0 flex flex-col">
      <CanvasExercise
        canvasBackgroundText="Review Mode"
        initialElements={graph}
        disabled={true}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const TYPE_TO_SECTION: Record<string, string> = {
  mcq: "mcqs",
  canvas: "framework_drills",
  quantus: "quant_lab",
};

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;
  const activityType = params?.activityType as string;
  const backSection = TYPE_TO_SECTION[activityType] ?? "mcqs";

  const token = useAuthStore((s) => s.token) || Cookies.get("shankh-token");

  const [session, setSession] = useState<any>(null);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Navigation state ─────────────────────────────────────────────────────
  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // ── Panel state ───────────────────────────────────────────────────────────
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  }, []);

  const fetchResult = useCallback(async () => {
    if (!testId || !activityType) return;
    setLoading(true);
    try {
      const [sessionData, testData] = await Promise.all([
        skillApi.testSession<any>(testId, activityType),
        skillApi.test<any>(testId).catch(() => null),
      ]);
      setSession(sessionData.session);
      if (testData) setTestDetails(testData);
    } catch (e) {
      console.error("Failed to load result:", e);
    } finally {
      setLoading(false);
    }
  }, [testId, activityType, token]);

  useEffect(() => { fetchResult(); }, [fetchResult]);

  // Reset question index when item changes
  useEffect(() => { setCurrentQuestionIdx(0); }, [currentItemIdx]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F] gap-2">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold">Loading your results…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-zinc-500">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <span className="text-sm font-semibold">Session not found or not completed.</span>
        <button onClick={() => router.push(`/skill?section=${backSection}`)} className="px-4 py-2 bg-[#01696F] text-white rounded-xl shadow font-bold text-xs">
          Back to Skill Tracks
        </button>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const scorePct = session.scorePct !== null ? Math.round(session.scorePct) : null;
  const isPassed = scorePct !== null && scorePct >= PASS_THRESHOLD_PCT;
  const isExpired = session.status === "expired";

  const testItems: any[] = testDetails?.items?.[activityType as "mcq" | "canvas" | "quantus"] ?? [];
  const responseMap: Record<string, any> = {};
  if (Array.isArray(session.responses)) {
    for (const r of session.responses) responseMap[r.testItemId] = r;
  }

  const resolvedItems = testItems.map((item: any) => {
    const response = responseMap[item.id];
    return {
      id: item.id,
      lessonId: item.lessonId ?? null,
      lessonName: item.lessonName || "Exercise",
      score: response?.scorePct !== null && response?.scorePct !== undefined ? Math.round(response.scorePct) : null,
      completed: !!response,
      mcqAnswers: response?.mcqSession?.answers ?? [],
      quantusSession: response?.quantusSession ?? null,
      canvasData: response?.canvasSession?.canvasData ?? null,
    };
  });

  const currentItem = resolvedItems[currentItemIdx];
  const totalQuestions = activityType === "mcq" ? (currentItem?.mcqAnswers?.length ?? 0) : 0;
  const canPrevQuestion = activityType === "mcq" && currentQuestionIdx > 0;
  const canNextQuestion = activityType === "mcq" && currentQuestionIdx < totalQuestions - 1;
  const canPrevItem = currentItemIdx > 0;
  const canNextItem = currentItemIdx < resolvedItems.length - 1;

  const aiAssessment = isExpired
    ? "Your session expired before all activities were completed. Your partial results have been saved. Review the relevant curriculum lessons and attempt a different test when you're ready."
    : isPassed
      ? "Excellent work. You demonstrated strong conceptual accuracy and consistent execution across all activities. This competency is now certified in your skill profile."
      : "You're making progress but a few activities need attention. Review the lessons linked to your weaker items in Learning mode, then look for another available test to practice on.";

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-row h-screen overflow-hidden font-sans bg-white text-zinc-800 p-2 sm:p-3 gap-0">

      {/* ══════════════════════ LEFT PANEL — ITEM NAVIGATION ══════════════════════ */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
        leftPanelOpen ? "w-60 xl:w-64" : "w-0"
      )}>
        <div className="w-60 xl:w-64 h-full flex flex-col justify-between pr-2">
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-3">

            {/* Logo + back */}
            <div className="flex flex-col items-center gap-3 border-b border-zinc-100 pb-3 pt-1">
              <div className="w-full flex justify-center">
                <div className="h-8 w-28 bg-[#01696F]/10 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-black text-[#01696F] tracking-widest uppercase">Shankh</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/skill?section=${backSection}`)}
                className="w-full py-1.5 bg-[#DFEAEA] text-[#01696F] hover:bg-[#D7E8E9] font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-[#01696F]/10"
              >
                <ChevronLeft size={13} /> Back to Skills
              </button>
            </div>

            {/* Overall score mini-card */}
            <div className={cn(
              "rounded-2xl border px-3 py-2.5 flex items-center gap-3",
              isExpired ? "bg-zinc-50 border-zinc-200"
                : isPassed ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0",
                isExpired ? "bg-zinc-200 text-zinc-600"
                  : isPassed ? "bg-emerald-500 text-white"
                    : "bg-amber-500 text-white"
              )}>
                {scorePct !== null ? `${scorePct}%` : "—"}
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Overall</p>
                <p className={cn(
                  "text-xs font-extrabold",
                  isExpired ? "text-zinc-600" : isPassed ? "text-emerald-700" : "text-amber-700"
                )}>
                  {isExpired ? "Expired" : isPassed ? "Passed ✨" : "Needs Practice"}
                </p>
              </div>
            </div>

            {/* Item list */}
            <div className="flex flex-col gap-1 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 mb-1">
                Activities ({resolvedItems.length})
              </span>
              {resolvedItems.map((item, idx) => {
                const isActive = idx === currentItemIdx;
                const ok = item.score !== null && item.score >= PASS_THRESHOLD_PCT;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentItemIdx(idx)}
                    className={cn(
                      "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150",
                      isActive
                        ? "bg-[#01696F] border-[#01696F] text-white shadow-sm"
                        : "bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 border",
                      isActive ? "bg-white/20 border-white/30 text-white"
                        : item.completed
                          ? ok ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-amber-50 border-amber-200 text-amber-600"
                          : "bg-zinc-50 border-zinc-200 text-zinc-400"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] font-extrabold truncate",
                        isActive ? "text-white" : "text-zinc-800"
                      )}>
                        {item.lessonName}
                      </p>
                      {item.score !== null && (
                        <p className={cn(
                          "text-[10px] font-bold",
                          isActive ? "text-white/80" : ok ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {item.score}%
                        </p>
                      )}
                    </div>
                    {!isActive && item.completed && (
                      ok
                        ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                        : <XCircle size={13} className="text-amber-500 flex-shrink-0" />
                    )}
                    {!isActive && !item.completed && (
                      <AlertCircle size={13} className="text-zinc-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review mode badge */}
          <div className="bg-[#DFEAEA] border border-[#01696F]/10 rounded-2xl p-2.5 flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#01696F] font-bold shadow-sm flex-shrink-0 border border-zinc-200">
              <BarChart2 size={14} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-zinc-800">Review Mode</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Read-only</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Left panel toggle ── */}
      <PanelToggle open={leftPanelOpen} onClick={() => setLeftPanelOpen((o) => !o)} side="left" />

      {/* ══════════════════════ MAIN WORKSPACE ══════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#F0EDE7] shadow-[0px_4px_8px_0px_#0000003D_inset] border border-[#F0EDE7] rounded-2xl overflow-hidden mx-1.5">

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 bg-[#F0EDE7]/60 shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <ActivityTypePill type={activityType} />
            <span className="text-[12px] font-semibold text-[#01696F] bg-[#E6F0F1] px-3 py-1.5 rounded-xl shadow-sm border border-[#01696F]/10 select-none whitespace-nowrap">
              {currentItemIdx + 1} / {resolvedItems.length} items
            </span>
            {activityType === "mcq" && totalQuestions > 1 && (
              <span className="text-[11px] font-bold text-zinc-500">
                · Q{currentQuestionIdx + 1}/{totalQuestions}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* MCQ question prev/next */}
            {activityType === "mcq" && totalQuestions > 1 && (
              <>
                <button
                  onClick={() => setCurrentQuestionIdx((q) => q - 1)}
                  disabled={!canPrevQuestion}
                  className="px-2.5 py-1.5 bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                >
                  <ChevronLeft size={13} /> Prev Q
                </button>
                <button
                  onClick={() => setCurrentQuestionIdx((q) => q + 1)}
                  disabled={!canNextQuestion}
                  className="px-2.5 py-1.5 bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                >
                  Next Q <ChevronRight size={13} />
                </button>
                <div className="w-px h-5 bg-zinc-200 mx-1" />
              </>
            )}

            {/* Item prev/next */}
            <button
              onClick={() => setCurrentItemIdx((i) => i - 1)}
              disabled={!canPrevItem}
              className="px-2.5 py-1.5 bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              onClick={() => setCurrentItemIdx((i) => i + 1)}
              disabled={!canNextItem}
              className="px-3 py-1.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* ── Activity area ── */}
        <div className="flex-1 overflow-auto relative">

          {/* Quantus */}
          {activityType === "quantus" && currentItem && (
            currentItem.quantusSession
              ? <QuantusReview quantusSession={currentItem.quantusSession} />
              : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-zinc-400 font-semibold">This activity was not completed.</p>
                </div>
              )
          )}

          {/* MCQ */}
          {activityType === "mcq" && currentItem && (
            currentItem.mcqAnswers?.length > 0
              ? (
                <McqQuestionView
                  answer={currentItem.mcqAnswers[currentQuestionIdx]}
                  questionIdx={currentQuestionIdx}
                  totalQuestions={totalQuestions}
                />
              )
              : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-zinc-400 font-semibold">This activity was not completed.</p>
                </div>
              )
          )}

          {/* Canvas */}
          {activityType === "canvas" && currentItem && (
            <CanvasReview item={currentItem} />
          )}
        </div>
      </div>

      {/* ── Right panel toggle ── */}
      <PanelToggle open={rightPanelOpen} onClick={() => setRightPanelOpen((o) => !o)} side="right" />

      {/* ══════════════════════ RIGHT PANEL — RESULTS ══════════════════════ */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
        rightPanelOpen ? "w-72 xl:w-80" : "w-0"
      )}>
        <div className="w-72 xl:w-80 h-full flex flex-col pl-2">
          <div className="bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">

            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">
              <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
                <Trophy size={16} className="text-[#01696F]" />
              </div>
              <h3 className="font-black text-zinc-800 text-base tracking-tight">Results</h3>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group"
              >
                <X size={16} className="text-zinc-500 group-hover:text-zinc-800 transition" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-[#F0EDE7]">

              {/* Overall score card */}
              <div className={cn(
                "rounded-2xl border p-4 flex flex-col items-center gap-3 text-center",
                isExpired ? "bg-zinc-50 border-zinc-200"
                  : isPassed ? "bg-emerald-50 border-emerald-200"
                    : "bg-amber-50 border-amber-200"
              )}>
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-md border flex-shrink-0",
                  isExpired ? "bg-zinc-400 text-white border-transparent"
                    : isPassed ? "bg-emerald-500 text-white border-transparent"
                      : "bg-amber-500 text-white border-transparent"
                )}>
                  {isExpired ? <XCircle size={22} /> : isPassed ? <Trophy size={22} /> : <BarChart2 size={22} />}
                </div>
                <div>
                  <p className={cn("text-3xl font-black tracking-tight leading-none", isExpired ? "text-zinc-600" : isPassed ? "text-emerald-700" : "text-amber-700")}>
                    {scorePct !== null ? `${scorePct}%` : "—"}
                  </p>
                  <p className={cn("text-[10px] font-black uppercase tracking-wider mt-1", isExpired ? "text-zinc-500" : isPassed ? "text-emerald-600" : "text-amber-600")}>
                    {isExpired ? "Session expired" : isPassed ? "Competency achieved" : "Needs more practice"}
                  </p>
                </div>
                <div className="flex items-center justify-around w-full pt-2 border-t border-zinc-200/50 gap-2">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-zinc-500 font-bold text-[9px] uppercase tracking-wider">
                      <Clock size={10} /> Time
                    </div>
                    <p className="text-sm font-black text-zinc-800 mt-0.5">{formatTime(session.timeSpentSecs ?? 0)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center text-zinc-500 font-bold text-[9px] uppercase tracking-wider">
                      <CheckCircle2 size={10} /> Done
                    </div>
                    <p className="text-sm font-black text-zinc-800 mt-0.5">{session.completedItems ?? 0}/{session.totalItems ?? "?"}</p>
                  </div>
                </div>
              </div>

              {/* AI assessment */}
              <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">AI Assessment</h4>
                <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">{aiAssessment}</p>
              </div>

              {/* Per-item breakdown */}
              <div className="bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm flex flex-col gap-2">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Item Breakdown</h4>
                {resolvedItems.map((item, idx) => {
                  const ok = item.score !== null && item.score >= PASS_THRESHOLD_PCT;
                  const isActive = idx === currentItemIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentItemIdx(idx)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all text-left",
                        isActive
                          ? "bg-[#01696F]/5 border-[#01696F]/20"
                          : "bg-zinc-50/50 border-zinc-100 hover:border-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0",
                        item.completed
                          ? ok ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                          : "bg-zinc-100 text-zinc-400"
                      )}>
                        {idx + 1}
                      </div>
                      <p className="flex-1 text-[11px] font-semibold text-zinc-700 truncate min-w-0">{item.lessonName}</p>
                      <span className={cn(
                        "text-[10px] font-black flex-shrink-0",
                        item.score === null ? "text-zinc-300"
                          : ok ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {item.score !== null ? `${item.score}%` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-200 bg-white flex-shrink-0">
              <button
                onClick={() => router.push(`/skill?section=${backSection}`)}
                className="w-full py-2.5 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
              >
                Return to skill tracks
                <ArrowLeft size={12} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
