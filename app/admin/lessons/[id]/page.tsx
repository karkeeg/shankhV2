"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, FileQuestion, PenLine, TableProperties,
  Check, Circle, ChevronRight, Loader2, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface LessonDetail {
  id: string;
  name: string;
  difficulty: string;
  description: string | null;
  subtopic: { name: string; topic: { name: string; module: { name: string } } };
  lessonActivities: { activityType: string }[];
  mcqActivity: any | null;
  canvasActivity: any | null;
  quantusActivity: any | null;
}

const DIFF_COLOR: Record<string, string> = {
  easy:   "bg-emerald-50 text-emerald-600 border-emerald-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  hard:   "bg-rose-50 text-rose-600 border-rose-200",
};

// ── Per-activity display config ──────────────────────────────────────────────

const ACTIVITY_CONFIG = {
  mcq: {
    label: "MCQ Quiz",
    Icon: FileQuestion,
    route: "mcq",
    description: "Multiple-choice questions with explanations",
    emptyHint: "Build a question set with 4 options each. Mark the correct answer and add an explanation for every question.",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    badgeBg: "bg-violet-50 text-violet-600 border-violet-100",
    btnCls: "bg-violet-600 hover:bg-violet-700",
    statsBg: "bg-violet-50/50",
    emptyBg: "bg-violet-50",
    statsFor: (a: any) => {
      const q = a?.questions ?? [];
      const opts = q.reduce((s: number, q: any) => s + (q.options?.length ?? 0), 0);
      return [
        { label: "Questions", value: q.length },
        { label: "Avg options", value: q.length ? Math.round(opts / q.length) : 0 },
      ];
    },
  },
  canvas: {
    label: "Canvas Drill",
    Icon: PenLine,
    route: "canvas",
    description: "Drag-and-drop framework diagram exercise",
    emptyHint: "Define a palette of shape tokens, then draw the expected solution graph so the system can auto-grade student submissions.",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    badgeBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    btnCls: "bg-indigo-600 hover:bg-indigo-700",
    statsBg: "bg-indigo-50/50",
    emptyBg: "bg-indigo-50",
    statsFor: (a: any) => [
      { label: "Palette tokens", value: a?.paletteItems?.length ?? a?.tokens?.length ?? 0 },
      { label: "Solution edges", value: a?.solutionSnapshot?.edges?.length ?? a?.solutionEdges?.length ?? 0 },
    ],
  },
  quantus: {
    label: "Quantus Lab",
    Icon: TableProperties,
    route: "quantus",
    description: "Excel-style spreadsheet model exercise",
    emptyHint: "Set up a grid with labelled rows and columns. Mark cells as editable and set expected values for auto-grading.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-50 text-amber-600 border-amber-100",
    btnCls: "bg-amber-500 hover:bg-amber-600",
    statsBg: "bg-amber-50/50",
    emptyBg: "bg-amber-50",
    statsFor: (a: any) => {
      const cells = a?.quantusCells ?? [];
      const cols  = a?.columns?.length ?? 0;
      return [
        { label: "Columns", value: cols },
        { label: "Editable cells", value: cells.filter((c: any) => c.isEditable).length },
      ];
    },
  },
} as const;

type ActivityType = keyof typeof ACTIVITY_CONFIG;

// ── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({
  type,
  lessonId,
  activity,
  hasActivity,
}: {
  type: ActivityType;
  lessonId: string;
  activity: any;
  hasActivity: boolean;
}) {
  const router = useRouter();
  const cfg = ACTIVITY_CONFIG[type];
  const { Icon } = cfg;
  const stats = hasActivity ? cfg.statsFor(activity) : null;

  return (
    <div className={cn(
      "bg-white border border-zinc-200 rounded-3xl p-7 flex flex-col gap-5 shadow-sm",
      "hover:shadow-md hover:border-zinc-300 transition-all"
    )}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-3.5 rounded-2xl", cfg.iconBg, cfg.iconColor)}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Activity Type</p>
            <h3 className="text-base font-extrabold text-zinc-900 leading-tight">{cfg.label}</h3>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{cfg.description}</p>
          </div>
        </div>
        {hasActivity ? (
          <span className={cn("shrink-0 text-[10px] font-black px-3 py-1.5 rounded-full border flex items-center gap-1.5", cfg.badgeBg)}>
            <Check size={10} /> Created
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border bg-zinc-50 text-zinc-400 border-zinc-200 flex items-center gap-1.5">
            <Circle size={10} /> Not yet
          </span>
        )}
      </div>

      {/* Stats or empty hint */}
      {hasActivity && stats ? (
        <div className={cn("grid grid-cols-2 gap-3 rounded-2xl p-4", cfg.statsBg)}>
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-zinc-800">{value}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("rounded-2xl p-4", cfg.emptyBg)}>
          <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{cfg.emptyHint}</p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => router.push(`/admin/lessons/${lessonId}/${cfg.route}`)}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 text-white text-xs font-black rounded-2xl shadow-sm transition-all active:scale-[0.98]",
          cfg.btnCls
        )}
      >
        {hasActivity ? (
          <><PenLine size={13} /> Edit Activity <ChevronRight size={13} /></>
        ) : (
          <><Icon size={13} /> Create Activity <ChevronRight size={13} /></>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function LessonHub() {
  const params = useParams();
  const lessonId = params.id as string;
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLesson = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/lessons/${lessonId}`, { headers });
      const json = await res.json();
      if (json.data) setLesson(json.data as LessonDetail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [lessonId, headers]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full text-[#01696F]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    </MainLayout>
  );

  if (!lesson) return (
    <MainLayout>
      <div className="flex items-center justify-center h-full text-sm text-zinc-400 font-semibold">
        Lesson not found
      </div>
    </MainLayout>
  );

  const hasActivity = (type: string) =>
    lesson.lessonActivities?.some((a) => a.activityType === type);

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-7">

        {/* Header */}
        <div className="shrink-0 space-y-3">
          <button
            onClick={() => router.push("/admin/learning")}
            className="flex items-center gap-1.5 text-xs font-bold text-[#01696F]/70 hover:text-[#01696F] w-fit group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Learning Pathways
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3 border-b border-zinc-100 pb-5">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {lesson.subtopic.topic.module.name} › {lesson.subtopic.topic.name} › {lesson.subtopic.name}
              </p>
              <h1 className="text-2xl font-black text-[#01696F] tracking-tight mt-0.5">{lesson.name}</h1>
              {lesson.description && (
                <p className="text-xs text-zinc-500 font-medium mt-1">{lesson.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "text-[10px] font-black px-3 py-1.5 rounded-full border uppercase tracking-wide",
                DIFF_COLOR[lesson.difficulty] ?? "bg-zinc-50 text-zinc-500 border-zinc-200"
              )}>
                {lesson.difficulty}
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full">
                {lesson.lessonActivities.length} / 3 activities
              </span>
              <button
                onClick={() => router.push(`/admin/lessons/${lessonId}/preview`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#01696F] text-white text-xs font-black rounded-xl hover:bg-[#01696F]/90 active:scale-95 transition-all shadow-sm"
              >
                <Eye size={13} /> Preview
              </button>
            </div>
          </div>
        </div>

        {/* Three activity cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(["mcq", "canvas", "quantus"] as ActivityType[]).map((type) => (
            <ActivityCard
              key={type}
              type={type}
              lessonId={lessonId}
              activity={lesson[`${type}Activity` as keyof LessonDetail]}
              hasActivity={hasActivity(type)}
            />
          ))}
        </div>

      </div>
    </MainLayout>
  );
}
