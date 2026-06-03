"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Pause,
  ChevronLeft,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { CanvasExercise } from "@/components/exercise/CanvasExercise";
import { ExcelGrid, evaluateExcelFormula } from "@/components/exercise/ExcelGrid";
import { CanvasToolkit } from "@/components/exercise/CanvasToolkit";
import { TimerBar } from "@/components/skill/TimerBar";
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
      },
    ];
  }

  return [];
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl">
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full mx-4 border border-zinc-100">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Trophy size={28} className="text-emerald-600" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">
            All items complete!
          </h3>
          <p className="text-xs text-zinc-500 font-semibold mt-2 leading-relaxed">
            You've finished all {totalItems} activities in this session.
            Submit now to lock in your score and see the results.
          </p>
        </div>

        <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Completed
          </span>
          <span className="text-sm font-black text-[#01696F]">
            {completedItems} / {totalItems} activities
          </span>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#01696F] hover:bg-[#01696F]/90 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Submit & see results
                <ArrowRight size={13} />
              </>
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TestSessionPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;
  const activityType = params?.activityType as string;

  const token = useAuthStore((s) => s.token) || Cookies.get("shankh-token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

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
  const [canvasElements, setCanvasElements] = useState<any[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Track latest timeSpentSecs for the confirm overlay's complete call
  const timeSpentRef = useRef(0);

  // ── Load or start session ─────────────────────────────────────────────────
  const loadSession = useCallback(async () => {
    if (!testId || !activityType) return;
    try {
      // 1. Try to resume
      let res = await fetch(
        `${backendUrl}/api/v1/skill/tests/${testId}/sessions/${activityType}`,
        { headers }
      );

      let data: any;

      if (res.status === 404) {
        // 2. Start fresh
        res = await fetch(
          `${backendUrl}/api/v1/skill/tests/${testId}/sessions`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ activityType }),
          }
        );
        if (!res.ok) throw new Error("Failed to start session");
        const init = await res.json();
        data = {
          session: init.data.session,
          completedItemIds: [],
          nextItem: init.data.items?.[0] ?? null,
        };
      } else {
        if (!res.ok) throw new Error("Failed to resume session");
        data = (await res.json()).data;
      }

      setSession(data.session);
      timeSpentRef.current = data.session.timeSpentSecs ?? 0;

      // Redirect if already finished
      if (
        data.session.status === "completed" ||
        data.session.status === "expired"
      ) {
        router.push(`/skill/tests/${testId}/${activityType}/result`);
        return;
      }

      if (!data.nextItem) {
        // All items done — show confirm
        setShowConfirm(true);
        setLoading(false);
        return;
      }

      setNextItem(data.nextItem);

      // 3. Load the activity content for the next item
      const actRes = await fetch(
        `${backendUrl}/api/v1/activities/${data.nextItem.lessonId}`,
        { headers }
      );
      if (!actRes.ok) throw new Error("Failed to load activity");
      const actJson = await actRes.json();
      const raw = actJson.data;

      const targetStep = raw.steps.find((s: any) => s.type === activityType);
      if (!targetStep) throw new Error("Activity type not found in lesson");

      const norm = normalizeStep(targetStep, activityType);
      setNormalizedSteps(norm);
      setActivityData(raw);
      setCurrentStepSubIndex(0);

      // Reset inputs
      setSelectedOption(null);
      setSpreadsheetGrid(targetStep.data?.gridValues || {});
      setCanvasElements([]);
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

  // ── Timer handlers ────────────────────────────────────────────────────────

  const handleTimerTick = useCallback((secs: number) => {
    timeSpentRef.current = secs;
  }, []);

  const handleTimerExpired = async () => {
    if (!session) return;
    try {
      await fetch(
        `${backendUrl}/api/v1/skill/sessions/${session.id}/complete`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            timeSpentSecs: session.timeLimitMins * 60,
          }),
        }
      );
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
      await fetch(
        `${backendUrl}/api/v1/skill/sessions/${session.id}/complete`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ timeSpentSecs: timeSpentRef.current }),
        }
      );
      router.push(`/skill/tests/${testId}/${activityType}/result`);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const handlePauseExit = async () => {
    // Save timer state before leaving
    if (session) {
      try {
        await fetch(
          `${backendUrl}/api/v1/skill/sessions/${session.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ timeSpentSecs: timeSpentRef.current }),
          }
        );
      } catch { }
    }
    router.push("/skill");
  };

  // ── Validation helpers ────────────────────────────────────────────────────

  const validateExcel = (step: any): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    if (!step?.gridRows || !step?.gridCols) return result;
    const key = (r: number, c: number) => `${r}-${c}`;
    step.gridRows.forEach((_: string, rIdx: number) => {
      step.gridCols.forEach((_c: string, cIdx: number) => {
        if (cIdx === 0) return;
        const k = key(rIdx, cIdx);
        let n = 0;
        try {
          n = Number(
            evaluateExcelFormula(spreadsheetGrid[k] ?? "", spreadsheetGrid, [], key)
          );
        } catch {
          n = Number(spreadsheetGrid[k]);
        }
        result[k] = Math.abs(n - Number(step.correctAnswers?.[k])) < 0.0001;
      });
    });
    return result;
  };

  const extractCanvasGraph = (step: any) => {
    const tokenElements = canvasElements.filter(
      (el) => el.customData?.originalId && !el.customData?.isZone && el.type !== "text"
    );
    const placedTokens = tokenElements.map((el) => el.customData!.originalId as string);
    const arrows = canvasElements.filter((el) => el.type === "arrow");
    const edges: any[] = [];

    for (const arrow of arrows) {
      const sb = (arrow as any).startBinding;
      const eb = (arrow as any).endBinding;
      if (!sb?.elementId || !eb?.elementId) continue;
      const fromEl = canvasElements.find((el) => el.id === sb.elementId);
      const toEl = canvasElements.find((el) => el.id === eb.elementId);
      if (!fromEl?.customData?.originalId || !toEl?.customData?.originalId) continue;
      const fromId = fromEl.customData.originalId as string;
      const toId = toEl.customData.originalId as string;
      let slot: string | undefined;
      const toToken = (step.tokens || []).find((t: any) => t.id === toId);
      if (toToken && (toToken.tokenRole === "operator" || toToken.tokenRole === "relation")) {
        const fromCx = (fromEl.x ?? 0) + (fromEl.width ?? 0) / 2;
        const toCx = (toEl.x ?? 0) + (toEl.width ?? 0) / 2;
        slot = fromCx < toCx ? "left" : "right";
      }
      edges.push({ from: fromId, to: toId, ...(slot ? { slot } : {}) });
    }
    return { placedTokens, edges };
  };

  // ── Check & submit ────────────────────────────────────────────────────────

  const handleCheckSubmit = async () => {
    if (!session || !nextItem || !normalizedSteps.length) return;
    const step = normalizedSteps[currentStepSubIndex];
    setSubmitting(true);
    setFeedback(null);

    const gradePayload: Record<string, any> = {
      lessonId: nextItem.lessonId,
      activityType,
    };

    if (activityType === "mcq") {
      if (!selectedOption) {
        setFeedback({ isError: true, message: "Please select an option first!" });
        setSubmitting(false);
        return;
      }
      gradePayload.answers = [
        { questionId: step.id || "", selectedOptionId: selectedOption },
      ];
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
      // Step 1: Grade via normal cascade
      const gradeRes = await fetch(
        `${backendUrl}/api/v1/attempts/session/${activityType}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(gradePayload),
        }
      );
      const gradeJson = await gradeRes.json();
      if (!gradeRes.ok) throw new Error(gradeJson?.error || "Grading failed");

      const attemptId = gradeJson.data.id;
      const scorePct = gradeJson.data.accuracy ?? gradeJson.data.scorePct ?? 100;

      // For MCQ with multiple questions, step through them first
      if (activityType === "mcq" && currentStepSubIndex < normalizedSteps.length - 1) {
        setCurrentStepSubIndex((prev) => prev + 1);
        setSelectedOption(null);
        setFeedback({
          isError: false,
          message: `Question ${currentStepSubIndex + 1} recorded. Next question →`,
        });
        setSubmitting(false);
        return;
      }

      // Step 2: Link to skill test session
      const submitRes = await fetch(
        `${backendUrl}/api/v1/skill/sessions/${session.id}/submit`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            testItemId: nextItem.id,
            activityType,
            existingSessionId: attemptId,
            scorePct,
          }),
        }
      );
      const submitJson = await submitRes.json();
      if (!submitRes.ok) throw new Error("Failed to submit to session");

      const { sessionProgress, allComplete } = submitJson.data;

      // Update local session progress counters
      setSession((prev: any) => ({
        ...prev,
        completedItems: sessionProgress.completedItems,
        totalItems: sessionProgress.totalItems,
      }));

      if (allComplete) {
        // Show confirmation screen instead of auto-completing
        setFeedback(null);
        setShowConfirm(true);
      } else {
        setFeedback({
          isError: false,
          message: "Activity recorded! Loading next activity…",
        });
        setTimeout(() => loadSession(), 1200);
      }
    } catch (e: any) {
      setFeedback({ isError: true, message: e?.message || "Error submitting answer." });
    } finally {
      setSubmitting(false);
    }
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

  // ── MCQ question counter label ────────────────────────────────────────────
  const mcqLabel =
    activityType === "mcq" && normalizedSteps.length > 1
      ? `Question ${currentStepSubIndex + 1} of ${normalizedSteps.length}`
      : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F0EDE7] p-3 sm:p-4 gap-3 sm:gap-4 font-sans">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePauseExit}
            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm active:scale-95 text-[#01696F]"
            title="Pause & exit"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#01696F] tracking-tight leading-none">
              {activityData?.lessonName || "Skill Test"}
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
              {activityType.toUpperCase()} session
              {session && (
                <span className="ml-2 text-[#01696F]">
                  · {session.completedItems ?? 0} / {session.totalItems ?? "?"} done
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="w-full sm:flex-1 sm:max-w-lg">
          {session && (
            <TimerBar
              sessionId={session.id}
              timeLimitMins={session.timeLimitMins}
              initialTimeSpentSecs={session.timeSpentSecs ?? 0}
              onExpire={handleTimerExpired}
              onTick={handleTimerTick}
            />
          )}
        </div>
      </header>

      {/* ── Workspace ── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 sm:gap-4">

        {/* Left: instructions */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 bg-white border border-zinc-200 rounded-3xl p-5 flex flex-col gap-4 shadow-sm overflow-y-auto">
          <div className="flex flex-col gap-3">
            {mcqLabel && (
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-violet-100 bg-violet-50 text-violet-700 self-start">
                {mcqLabel}
              </span>
            )}

            <div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100 bg-emerald-50 text-emerald-700">
                Instructions
              </span>
              <h3 className="font-extrabold text-sm text-zinc-800 leading-snug tracking-tight mt-2.5">
                {step?.questionText || "Activity guidelines"}
              </h3>
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <span className="text-[9px] uppercase font-black tracking-widest text-[#01696F]/70 block mb-1.5">
                Context
              </span>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium whitespace-pre-line">
                {step?.instructions || step?.contextText || "Complete the activity and submit your answer."}
              </p>
            </div>

            {activityType === "canvas" && step?.draggableElements && (
              <CanvasToolkit draggableElements={step.draggableElements} />
            )}
          </div>

          {/* Progress footer */}
          <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Session progress
            </span>
            <span className="text-[10px] font-black text-[#01696F]">
              {session?.completedItems ?? 0} / {session?.totalItems ?? "?"} done
            </span>
          </div>
        </div>

        {/* Center: activity workspace */}
        <div className="flex-1 min-w-0 bg-[#FAF7F2] border border-zinc-200 rounded-3xl flex flex-col overflow-hidden shadow-inner relative">

          {/* Confirm overlay */}
          {showConfirm && (
            <ConfirmSubmitOverlay
              completedItems={session?.completedItems ?? 0}
              totalItems={session?.totalItems ?? 0}
              onConfirm={handleConfirmComplete}
              onReview={() => setShowConfirm(false)}
              isSubmitting={completing}
            />
          )}

          {/* Activity area */}
          <div className="flex-1 overflow-auto relative">

            {/* Quantus */}
            {activityType === "quantus" && step && (
              <div className="absolute inset-0 flex flex-col">
                <ExcelGrid
                  table={
                    step.gridRows?.map((row: string, rIdx: number) =>
                      step.gridCols?.map((col: string, cIdx: number) =>
                        step.gridValues?.[`${rIdx}-${cIdx}`] || ""
                      )
                    ) || []
                  }
                  inputs={
                    step.gridRows?.flatMap((_: string, rIdx: number) =>
                      step.gridCols
                        ?.map((_c: string, cIdx: number) => {
                          if (cIdx === 0) return null;
                          return {
                            row: rIdx,
                            col: cIdx,
                            correctValue:
                              step.correctAnswers?.[`${step.gridRows[rIdx]}-${step.gridCols[cIdx]}`] || "",
                            placeholder: "",
                          };
                        })
                        .filter(Boolean)
                    ) || []
                  }
                  userInputs={spreadsheetGrid}
                  setUserInputs={setSpreadsheetGrid}
                  isValidated={feedback !== null}
                  feedback={{}}
                  sheetTabName="Test model"
                  showToolbar={true}
                  colLabels={step.gridCols || []}
                  rowLabels={step.gridRows || []}
                />
              </div>
            )}

            {/* Canvas */}
            {activityType === "canvas" && step && (
              <div className="absolute inset-0 flex flex-col">
                <CanvasExercise
                  canvasBackgroundText={step.questionText || "Framework Drill"}
                  onElementsChange={setCanvasElements}
                  initialElements={[]}
                  assemblyMode={step.assemblyMode}
                />
              </div>
            )}

            {/* MCQ */}
            {activityType === "mcq" && step && (
              <div className="flex flex-col justify-center max-w-2xl mx-auto space-y-5 p-6 sm:p-8 animate-fade-in w-full min-h-full">
                <h2 className="text-base sm:text-lg font-extrabold text-zinc-950 leading-snug tracking-tight">
                  {step.questionText}
                </h2>
                <div className="space-y-2.5">
                  {step.options?.map((opt: any) => {
                    const isSelected = selectedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm active:scale-[0.99] text-sm font-semibold",
                          isSelected
                            ? "bg-[#01696F] border-transparent text-white font-bold"
                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm transition-all",
                              isSelected
                                ? "bg-white text-[#01696F]"
                                : "bg-white border border-zinc-200 text-zinc-700"
                            )}
                          >
                            {opt.display}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={16} className="text-white flex-shrink-0" fill="currentColor" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback overlay */}
            {feedback && !showConfirm && (
              <div
                className={cn(
                  "absolute bottom-4 left-1/2 -translate-x-1/2 z-30",
                  "w-[min(420px,calc(100%-2rem))] rounded-2xl shadow-xl border p-4 flex items-start gap-3 animate-fade-in-up",
                  feedback.isError
                    ? "bg-rose-50 border-rose-200"
                    : "bg-emerald-50 border-emerald-200"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    feedback.isError
                      ? "bg-rose-100 text-rose-500"
                      : "bg-emerald-100 text-emerald-600"
                  )}
                >
                  {feedback.isError ? (
                    <XCircle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs font-bold leading-relaxed",
                    feedback.isError ? "text-rose-800" : "text-emerald-800"
                  )}
                >
                  {feedback.message}
                </p>
              </div>
            )}
          </div>

          {/* Action toolbar */}
          <div className="px-5 py-4 border-t border-zinc-200 bg-white shrink-0 flex items-center justify-between gap-3">
            <button
              onClick={handlePauseExit}
              className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-600 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Pause size={12} />
              <span className="hidden sm:inline">Pause session</span>
              <span className="sm:hidden">Pause</span>
            </button>

            <button
              onClick={handleCheckSubmit}
              disabled={submitting || showConfirm}
              className="px-5 py-2.5 bg-[#00A389] text-white hover:bg-[#00A389]/90 disabled:opacity-50 font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  Submit answer
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}