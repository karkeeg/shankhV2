"use client";

import { useState } from "react";
import { BarChart2, Clock, FileText, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LessonDifficulty = "Easy" | "Medium" | "Hard";

export interface SubItemLesson {
  id: string;
  title: string;
  difficulty: LessonDifficulty;
}

export interface CourseSubItem {
  id: string;
  title: string;
  lessons?: SubItemLesson[];
}

export interface CourseDetailCardProps {
  title: string;
  subtitle: string;
  difficulty: string;
  duration: string;
  module: {
    title: string;
    description: string;
    subItems: CourseSubItem[];
  };
  prerequisites?: string[];
  numPractices?: number;
}

// ─── Difficulty badge colours ─────────────────────────────────────────────────

const difficultyStyle: Record<LessonDifficulty, string> = {
  Easy: "bg-green-500 text-white",
  Medium: "bg-yellow-500 text-white",
  Hard: "bg-red-500 text-white",
};

// ─── Sub-section (expandable group of lessons) ────────────────────────────────

function SubSection({ 
  item,
  onSelectLevel,
}: { 
  item: CourseSubItem;
  onSelectLevel: (difficulty: LessonDifficulty) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 font-bold text-sm text-zinc-800 mb-2.5 hover:text-zinc-600 transition-colors"
      >
        {item.title}
        <ChevronUp
          size={14}
          className={cn(
            "transition-transform duration-200",
            open ? "rotate-0" : "rotate-180",
          )}
        />
      </button>

      {open && item.lessons && (
        <div className="flex flex-col gap-1.5">
          {item.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onSelectLevel(lesson.difficulty)}
              className="w-full flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 transition-colors px-3 py-2.5 rounded-lg text-left"
            >
              <span className="text-sm font-semibold text-zinc-700">{lesson.title}</span>
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md shrink-0",
                  difficultyStyle[lesson.difficulty],
                )}
              >
                {lesson.difficulty}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CourseDetailPanel({
  card,
  onStart,
  onSelectLevel,
}: {
  card: CourseDetailCardProps;
  onStart?: () => void;
  onSelectLevel?: (difficulty: LessonDifficulty) => void;
}) {
  const { completedLessons } = useAppStore();

  const allLessons = card.module.subItems.flatMap((s) => s.lessons ?? []);
  const totalLessons = card.numPractices ?? allLessons.length;
  const completedCount = allLessons.filter(
    (l) => completedLessons[l.id]?.completed,
  ).length;
  const progressPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-5 bg-[#F2F3F5]">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 leading-tight">
          {card.title}
        </h1>
        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
          {card.module.description}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 px-5 py-4 flex items-center divide-x divide-zinc-200">
        {/* Skill Level */}
        <div className="flex items-center gap-3 pr-6">
          <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
            <BarChart2 size={18} className="text-zinc-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Skill Level
            </p>
            <p className="text-sm font-bold text-zinc-900">{card.difficulty}</p>
          </div>
        </div>

        {/* Time to Complete */}
        <div className="flex items-center gap-3 px-6">
          <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={18} className="text-zinc-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Time to Complete
            </p>
            <p className="text-sm font-bold text-zinc-900">{card.duration}</p>
          </div>
        </div>

        {/* Number of Practices */}
        <div className="flex items-center gap-3 pl-6">
          <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={18} className="text-zinc-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Number of Practices
            </p>
            <p className="text-sm font-bold text-zinc-900">
              {totalLessons} Practices
            </p>
          </div>
        </div>
      </div>

      {/* ── Prerequisites ── */}
      {card.prerequisites && card.prerequisites.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 px-5 py-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <FileText size={18} className="text-zinc-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Prerequisites
            </p>
            <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5">
              {card.prerequisites.map((prereq, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block shrink-0" />
                  {prereq}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-bold text-zinc-900">Progress</span>
          <span className="text-sm text-zinc-500">
            {completedCount}/{totalLessons} Complete
          </span>
        </div>
        <div className="w-full bg-white border border-zinc-200 rounded-full h-10 relative overflow-hidden">
          <div
            className="h-full bg-zinc-900 rounded-full flex items-center justify-center transition-all duration-700"
            style={{ width: `${Math.max(progressPct, 20)}%` }}
          >
            <span className="text-xs font-bold text-white whitespace-nowrap">
              {progressPct}% Completed
            </span>
          </div>
        </div>
      </div>

      {/* ── Module card ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        {/* Module header */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              {card.module.title}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">{card.subtitle}</p>
          </div>
          <button
            onClick={onStart}
            className="shrink-0 bg-zinc-900 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
          >
            Start
          </button>
        </div>

        {/* Sub-items in dashed border box */}
        <div className="border border-dashed border-zinc-300 rounded-xl p-4 mt-4 flex flex-col gap-5">
          {card.module.subItems.map((item) => (
            <SubSection 
              key={item.id} 
              item={item} 
              onSelectLevel={onSelectLevel || (() => {})}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
