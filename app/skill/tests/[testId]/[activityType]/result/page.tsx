"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  BarChart2,
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
    return (
      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wide">
        Incomplete
      </span>
    );
  const ok = score >= 70;
  return (
    <span
      className={cn(
        "text-xs font-black",
        ok ? "text-emerald-600" : "text-amber-600"
      )}
    >
      {score}%
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TestResultPage() {
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

  const [session, setSession] = useState<any>(null);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchResult = useCallback(async () => {
    if (!testId || !activityType) return;
    setLoading(true);
    try {
      // 1. Session with full responses (scorePct per item)
      const sessionRes = await fetch(
        `${backendUrl}/api/v1/skill/tests/${testId}/sessions/${activityType}`,
        { headers }
      );
      if (!sessionRes.ok) throw new Error("Failed to load session");
      const sessionData = (await sessionRes.json()).data;
      setSession(sessionData.session);

      // 2. Test details to get item labels
      const testRes = await fetch(
        `${backendUrl}/api/v1/skill/tests/${testId}`,
        { headers }
      );
      if (testRes.ok) {
        const testData = (await testRes.json()).data;
        setTestDetails(testData);
      }
    } catch (e) {
      console.error("Failed to load scorecard:", e);
    } finally {
      setLoading(false);
    }
  }, [testId, activityType, token]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  // ── Loading ────────────────────────────────────────────────────────────────

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
          <button
            onClick={() => router.push("/skill")}
            className="px-4 py-2 bg-[#01696F] text-white rounded-xl shadow font-bold text-xs"
          >
            Back to Skill Tracks
          </button>
        </div>
      </MainLayout>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const scorePct =
    session.scorePct !== null ? Math.round(session.scorePct) : null;
  const isPassed = scorePct !== null && scorePct >= 70;
  const isExpired = session.status === "expired";

  // Build per-item breakdown by joining test items with session responses
  const testItems: any[] =
    testDetails?.items?.[activityType as "mcq" | "canvas" | "quantus"] ?? [];

  // session.responses comes from resumeTestSession which now includes scorePct
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
      score:
        response?.scorePct !== null && response?.scorePct !== undefined
          ? Math.round(response.scorePct)
          : null,
      completed: !!response,
    };
  });

  // ── Status badge copy ──────────────────────────────────────────────────────

  const statusCopy = isExpired
    ? "Session expired"
    : isPassed
      ? "Competency achieved ✨"
      : "Needs more practice 📚";

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
            onClick={() => router.push("/skill")}
            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm active:scale-95 text-[#01696F]"
            title="Back to skill tracks"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#01696F] tracking-tight">
              Performance Scorecard
            </h2>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              {activityType.toUpperCase()} · {testDetails?.test?.name || "Skill Test"}
            </p>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-5 sm:gap-6 pb-4">

          {/* Left: big score + AI assessment */}
          <div className="flex-1 flex flex-col gap-5">

            {/* Score card */}
            <div
              className={cn(
                "border rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm",
                isExpired
                  ? "bg-zinc-50/30 border-zinc-200"
                  : isPassed
                    ? "bg-emerald-50/30 border-emerald-200"
                    : "bg-amber-50/30 border-amber-200"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-md border mb-5",
                  isExpired
                    ? "bg-zinc-400 text-white border-transparent"
                    : isPassed
                      ? "bg-emerald-500 text-white border-transparent"
                      : "bg-amber-500 text-white border-transparent"
                )}
              >
                {isExpired ? (
                  <XCircle size={28} />
                ) : isPassed ? (
                  <Trophy size={28} />
                ) : (
                  <BarChart2 size={28} />
                )}
              </div>

              <h3
                className={cn(
                  "text-4xl font-black tracking-tight leading-none",
                  isExpired
                    ? "text-zinc-600"
                    : isPassed
                      ? "text-emerald-700"
                      : "text-amber-700"
                )}
              >
                {scorePct !== null ? `${scorePct}%` : "—"}
              </h3>

              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-wider mt-2 opacity-80",
                  isExpired
                    ? "text-zinc-500"
                    : isPassed
                      ? "text-emerald-600"
                      : "text-amber-600"
                )}
              >
                {statusCopy}
              </p>

              <div className="grid grid-cols-2 gap-6 sm:gap-10 w-full mt-8 pt-6 border-t border-zinc-200/50">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                    <Clock size={12} />
                    Time spent
                  </div>
                  <p className="text-xl font-black text-zinc-800 mt-1">
                    {formatTime(session.timeSpentSecs ?? 0)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 justify-center text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    Completed
                  </div>
                  <p className="text-xl font-black text-zinc-800 mt-1">
                    {session.completedItems ?? 0} / {session.totalItems ?? "?"}
                  </p>
                </div>
              </div>
            </div>

            {/* AI assessment */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                AI coach assessment
              </h4>
              <p className="text-xs text-zinc-600 font-semibold leading-relaxed">
                {aiAssessment}
              </p>
            </div>
          </div>

          {/* Right: item breakdown */}
          <div className="w-full lg:w-96 shrink-0 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 shrink-0">
              Activity breakdown
            </h4>

            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
              {resolvedItems.length === 0 && (
                <div className="text-center text-zinc-400 text-xs py-10 font-bold">
                  No activity breakdown available.
                </div>
              )}

              {resolvedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors",
                    item.completed
                      ? "bg-zinc-50 border-zinc-100"
                      : "bg-rose-50/40 border-rose-100"
                  )}
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black border mt-0.5",
                        item.completed
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-rose-50 border-rose-200 text-rose-400"
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#01696F] uppercase tracking-wider leading-none">
                        {activityType.toUpperCase()} activity
                      </p>
                      <p className="text-xs font-extrabold text-zinc-800 truncate mt-1">
                        {item.lessonName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <ScoreBadge score={item.score} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/skill")}
              className="w-full py-3 bg-[#01696F] text-white hover:bg-[#01696F]/90 font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-sm shrink-0 flex items-center justify-center gap-1.5"
            >
              Return to skill tracks
              <ArrowLeft size={12} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}