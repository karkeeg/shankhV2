"use client";

import { ChevronLeft, ArrowRight } from "lucide-react";
import {
  CourseDetailPanel,
  CourseDetailCardProps,
} from "@/components/study-plan/CourseDetailPanel";

interface StudyIntroPageProps {
  card: CourseDetailCardProps;
  onBack: () => void;
  onNext: () => void;
  onSelectLevel: (difficulty: "Easy" | "Medium" | "Hard") => void;
}

export function StudyIntroPage({
  card,
  onBack,
  onNext,
  onSelectLevel,
}: StudyIntroPageProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top bar ── */}
        <header className="shrink-0 flex items-center justify-between px-6 h-12 bg-white border-b border-zinc-200">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-sm font-semibold transition-colors"
          >
            <ChevronLeft size={16} />
            Study Plan
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-zinc-900 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
          >
            Start Practice
            <ArrowRight size={15} />
          </button>
        </header>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          <CourseDetailPanel
            card={card}
            onStart={onNext}
            onSelectLevel={onSelectLevel}
          />
        </div>
      </div>
    </div>
  );
}
