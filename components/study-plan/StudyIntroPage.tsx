"use client";

import { ChevronLeft, ArrowRight } from "lucide-react";
import {
  CourseDetailPanel,
  CourseDetailCardProps,
  LessonDifficulty,
} from "@/components/study-plan/CourseDetailPanel";

interface StudyIntroPageProps {
  card: CourseDetailCardProps;
  onBack: () => void;
  onNext: () => void;
  onSelectActivity: (activityId: string, difficulty: LessonDifficulty) => void;
}

export function StudyIntroPage({
  card,
  onBack,
  onNext,
  onSelectActivity,
}: StudyIntroPageProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top bar ── */}
        <header className="shrink-0 flex items-center justify-between px-8 h-16 bg-white border-b border-zinc-100">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-[#01696F] text-sm font-bold transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-[#E6F0F1] transition-colors">
              <ChevronLeft size={18} />
            </div>
            Back to Study Plan
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-2 bg-[#01696F] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#01696F]/20"
          >
            Resume Learning
            <ArrowRight size={16} />
          </button>
        </header>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          <CourseDetailPanel
            card={card}
            onStart={onNext}
            onSelectActivity={onSelectActivity}
          />
        </div>
      </div>
    </div>
  );
}
