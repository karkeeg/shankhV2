"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PASS_THRESHOLD_PCT } from "@/lib/thresholds";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, Trophy, Clock, CheckCircle2, AlertCircle,
  XCircle, BarChart2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${mins}m ${remaining.toString().padStart(2, "0")}s`;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-[10px] font-black text-rose-500 uppercase tracking-wide">Incomplete</span>;
  const ok = score >= PASS_THRESHOLD_PCT;
  return <span className={cn("text-xs font-black", ok ? "text-emerald-600" : "text-amber-600")}>{score}%</span>;
}

// ─── MCQ Review ───────────────────────────────────────────────────────────────

function McqReview({ answers }: { answers: any[] }) {
  if (!answers?.length) return <p className="text-xs text-zinc-400 font-semibold py-2">No answer data available.</p>;
  return (
    <div className="flex flex-col gap-4">
      {answers.map((a: any, qi: number) => {
        const q = a.question;
        if (!q) return null;
        return (
          <div key={a.id} className="flex flex-col gap-2">
            <p className="text-xs font-extrabold text-zinc-800 leading-snug">
              Q{qi + 1}. {q.questionText}
            </p>
            <div className="flex flex-col gap-1.5">
              {(q.options ?? []).map((opt: any, oi: number) => {
                const isSelected = opt.id === a.selectedOptionId;
                const isCorrect = opt.isCorrect;
                let bg = "bg-zinc-50 border-zinc-200 text-zinc-600";
                if (isCorrect) bg = "bg-emerald-50 border-emerald-300 text-emerald-800";
                if (isSelected && !isCorrect) bg = "bg-rose-50 border-rose-300 text-rose-800";
                return (
                  <div key={opt.id} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[11px] font-semibold", bg)}>
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 border",
                      isCorrect ? "bg-emerald-500 text-white border-transparent"
                        : isSelected ? "bg-rose-500 text-white border-transparent"
                          : "bg-white border-zinc-300 text-zinc-500"
                    )}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt.optionText}</span>
                    {isSelected && !isCorrect && <XCircle size={13} className="text-rose-500 shrink-0" fill="currentColor" />}
                    {isCorrect && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" fill="currentColor" />}
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

// ─── Quantus Review ───────────────────────────────────────────────────────────

function QuantusReview({ quantusSession }: { quantusSession: any }) {
  const activity = quantusSession?.activity;
  const inputSnapshot: Record<string, string> = quantusSession?.inputSnapshot ?? {};

  if (!activity?.columns?.length) {
    return <p className="text-xs text-zinc-400 font-semibold py-2">No answer data available.</p>;
  }

  // Build column labels sorted by colIndex
  const colsSorted: { colIndex: number; label: string }[] = [...(activity.columns ?? [])].sort(
    (a: any, b: any) => a.colIndex - b.colIndex
  );

  // Determine unique row indices from editable cells
  const editableCells: { rowIndex: number; colIndex: number; expectedValue: string | null }[] =
    (activity.quantusCells ?? []).filter((c: any) => c.isEditable);

  const rowIndices = [...new Set(editableCells.map((c: any) => c.colIndex === 0 ? -1 : c.rowIndex))]
    .filter((r) => r >= 0)
    .sort((a, b) => a - b);

  // Build correctAnswers map keyed by "rowIndex-colIndex"
  const correctMap: Record<string, string> = {};
  for (const cell of editableCells) {
    if (cell.expectedValue !== null && cell.expectedValue !== undefined) {
      correctMap[`${cell.rowIndex}-${cell.colIndex}`] = cell.expectedValue;
    }
  }

  if (rowIndices.length === 0) {
    return <p className="text-xs text-zinc-400 font-semibold py-2">No editable cells to review.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="p-1.5 border border-zinc-200 bg-zinc-100 text-left font-black text-zinc-500">Row</th>
            {colsSorted.slice(1).map((col) => (
              <th key={col.colIndex} className="p-1.5 border border-zinc-200 bg-zinc-100 text-center font-black text-zinc-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowIndices.map((rIdx) => (
            <tr key={rIdx}>
              <td className="p-1.5 border border-zinc-200 bg-zinc-50 font-bold text-zinc-600">Row {rIdx + 1}</td>
              {colsSorted.slice(1).map((col) => {
                const k = `${rIdx}-${col.colIndex}`;
                const userVal = (inputSnapshot[k] ?? "").toString().trim();
                const correctVal = (correctMap[k] ?? "").toString().trim();
                const isEditable = !!correctMap[k];
                if (!isEditable) {
                  return <td key={col.colIndex} className="p-1.5 border border-zinc-200 text-center text-zinc-500">{userVal || ""}</td>;
                }
                const isCorrect = userVal === correctVal || Math.abs(Number(userVal) - Number(correctVal)) < 0.001;
                return (
                  <td key={col.colIndex} className={cn("p-1.5 border text-center font-bold", isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700")}>
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

// ─── Expandable item row ──────────────────────────────────────────────────────

function ReviewItem({ item, activityType, idx }: { item: any; activityType: string; idx: number }) {
  const [open, setOpen] = useState(false);

  const hasReviewData =
    (activityType === "mcq" && item.mcqAnswers?.length > 0) ||
    (activityType === "quantus" && item.quantusSession) ||
    (activityType === "canvas" && item.canvasData);

  return (
    <div className={cn("rounded-2xl border transition-colors", item.completed ? "bg-zinc-50 border-zinc-200" : "bg-rose-50/40 border-rose-100")}>
      <button
        onClick={() => hasReviewData && setOpen((o) => !o)}
        className={cn("w-full flex items-center justify-between gap-3 p-4", hasReviewData && "cursor-pointer")}
      >
        <div className="min-w-0 flex items-start gap-3">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black border mt-0.5",
            item.completed ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-400"
          )}>
            {idx + 1}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold text-[#01696F] uppercase tracking-wider leading-none">
              {activityType.toUpperCase()} activity
            </p>
            <p className="text-xs font-extrabold text-zinc-800 truncate mt-1">{item.lessonName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreBadge score={item.score} />
          {hasReviewData && (open ? <ChevronUp size={13} className="text-zinc-400" /> : <ChevronDown size={13} className="text-zinc-400" />)}
        </div>
      </button>

      {open && hasReviewData && (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-3">
          {activityType === "mcq" && <McqReview answers={item.mcqAnswers} />}
          {activityType === "quantus" && <QuantusReview quantusSession={item.quantusSession} />}
          {activityType === "canvas" && (
            <p className="text-xs text-zinc-500 font-semibold py-2">
              Canvas score: {item.score !== null ? `${item.score}%` : "—"}. Open the lesson in Learning mode to review your framework diagram.
            </p>
          )}
        </div>
      )}
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

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const [session, setSession] = useState<any>(null);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = useCallback(async () => {
    if (!testId || !activityType) return;
    setLoading(true);
    try {
      const [sessionRes, testRes] = await Promise.all([
        fetch(`${backendUrl}/api/v1/skill/tests/${testId}/sessions/${activityType}`, { headers }),
        fetch(`${backendUrl}/api/v1/skill/tests/${testId}`, { headers }),
      ]);
      if (!sessionRes.ok) throw new Error("Failed to load session");
      const sessionData = (await sessionRes.json()).data;
      setSession(sessionData.session);
      if (testRes.ok) setTestDetails((await testRes.json()).data);
    } catch (e) {
      console.error("Failed to load scorecard:", e);
    } finally {
      setLoading(false);
    }
  }, [testId, activityType, token]);

  useEffect(() => { fetchResult(); }, [fetchResult]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#01696F]">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-sm font-semibold">Generating your scorecard…</span>
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-zinc-500">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <span className="text-sm font-semibold">Session not found or not completed.</span>
          <button onClick={() => router.push(`/skill?section=${backSection}`)} className="px-4 py-2 bg-[#01696F] text-white rounded-xl shadow font-bold text-xs">
            Back to Skill Tracks
          </button>
        </div>
      </MainLayout>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const scorePct = session.scorePct !== null ? Math.round(session.scorePct) : null;
  const isPassed = scorePct !== null && scorePct >= PASS_THRESHOLD_PCT;
  const isExpired = session.status === "expired";

  const testItems: any[] = testDetails?.items?.[activityType as "mcq" | "canvas" | "quantus"] ?? [];

  const responseMap: Record<string, any> = {};
  if (Array.isArray(session.responses)) {
    for (const r of session.responses) {
      responseMap[r.testItemId] = r;
    }
  }

  const resolvedItems = testItems.map((item: any) => {
    const response = responseMap[item.id];
    return {
      id: item.id,
      lessonName: item.lessonName || "Exercise",
      score: response?.scorePct !== null && response?.scorePct !== undefined ? Math.round(response.scorePct) : null,
      completed: !!response,
      mcqAnswers: response?.mcqSession?.answers ?? [],
      // quantusSession includes inputSnapshot + activity.quantusCells/columns for review
      quantusSession: response?.quantusSession ?? null,
      canvasData: response?.canvasSession?.canvasData ?? null,
    };
  });

  const statusCopy = isExpired ? "Session expired" : isPassed ? "Competency achieved ✨" : "Needs more practice 📚";

  const aiAssessment = isExpired
    ? "Your session expired before all activities were completed. Your partial results have been saved. Review the relevant curriculum lessons and attempt a different test when you're ready."
    : isPassed
      ? "Excellent work. You demonstrated strong conceptual accuracy and consistent execution across all activities. This competency is now certified in your skill profile."
      : "You're making progress but a few activities need attention. Review the lessons linked to your weaker items in Learning mode, then look for another available test to practice on.";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden p-4 sm:p-6 gap-5 sm:gap-6">

        {/* ── Header ── */}
        <header className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => router.push(`/skill?section=${backSection}`)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm active:scale-95 text-[#01696F]"
            title="Back to skill tracks"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#01696F] tracking-tight">Performance Scorecard</h2>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              {activityType.toUpperCase()} · {testDetails?.test?.name || "Skill Test"}
            </p>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-5 sm:gap-6 pb-4">

          {/* Left: score + AI assessment */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Score card */}
            <div className={cn(
              "border rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm",
              isExpired ? "bg-zinc-50/30 border-zinc-200" : isPassed ? "bg-emerald-50/30 border-emerald-200" : "bg-amber-50/30 border-amber-200"
            )}>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shadow-md border mb-5",
                isExpired ? "bg-zinc-400 text-white border-transparent" : isPassed ? "bg-emerald-500 text-white border-transparent" : "bg-amber-500 text-white border-transparent"
              )}>
                {isExpired ? <XCircle size={28} /> : isPassed ? <Trophy size={28} /> : <BarChart2 size={28} />}
              </div>
              <h3 className={cn("text-4xl font-black tracking-tight leading-none", isExpired ? "text-zinc-600" : isPassed ? "text-emerald-700" : "text-amber-700")}>
                {scorePct !== null ? `${scorePct}%` : "—"}
              </h3>
              <p className={cn("text-xs font-bold uppercase tracking-wider mt-2 opacity-80", isExpired ? "text-zinc-500" : isPassed ? "text-emerald-600" : "text-amber-600")}>
                {statusCopy}
              </p>
              <div className="grid grid-cols-2 gap-6 sm:gap-10 w-full mt-8 pt-6 border-t border-zinc-200/50">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                    <Clock size={12} /> Time spent
                  </div>
                  <p className="text-xl font-black text-zinc-800 mt-1">{formatTime(session.timeSpentSecs ?? 0)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Completed
                  </div>
                  <p className="text-xl font-black text-zinc-800 mt-1">{session.completedItems ?? 0} / {session.totalItems ?? "?"}</p>
                </div>
              </div>
            </div>

            {/* AI assessment */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">AI coach assessment</h4>
              <p className="text-xs text-zinc-600 font-semibold leading-relaxed">{aiAssessment}</p>
            </div>
          </div>

          {/* Right: activity breakdown + answer review */}
          <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-4">

            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4 flex-1 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Answer Review
                </h4>
                <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {resolvedItems.filter(i => i.completed).length}/{resolvedItems.length} done
                </span>
              </div>

              <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
                {resolvedItems.length === 0 && (
                  <div className="text-center text-zinc-400 text-xs py-10 font-bold">No activity breakdown available.</div>
                )}
                {resolvedItems.map((item, idx) => (
                  <ReviewItem key={item.id} item={item} activityType={activityType} idx={idx} />
                ))}
              </div>

              <button
                onClick={() => router.push(`/skill?section=${backSection}`)}
                className="w-full py-3 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-sm shrink-0 flex items-center justify-center gap-1.5"
              >
                Return to skill tracks
                <ArrowLeft size={12} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
