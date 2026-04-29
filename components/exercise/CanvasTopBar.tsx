"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RotateCcw, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";

interface CanvasTopBarProps {
  questionNumber: number;
  totalQuestions?: number;
  showHint: boolean;
  onHint: () => void;
  onReset: () => void;
  onCheckAnswer: () => void;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  isValidated?: boolean;
  isFullyCorrect?: boolean;
}

export const CanvasTopBar = ({
  questionNumber,
  totalQuestions,
  showHint,
  onHint,
  onReset,
  onCheckAnswer,
  onClose,
  onPrevious,
  onNext,
  isValidated = false,
  isFullyCorrect = false,
}: CanvasTopBarProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-[#d4d7db] border-b border-zinc-300 shrink-0 gap-4 h-14">
      {/* Left: Reset + Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#64748b]/20 text-zinc-700 text-xs font-bold hover:bg-[#64748b]/30 transition-all border border-zinc-400/20"
        >
          <RotateCcw size={14} />
          Reset
        </button>

        <button
          onClick={onPrevious}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#64748b]/20 text-zinc-700 text-xs font-bold hover:bg-[#64748b]/30 transition-all border border-zinc-400/20"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
      </div>

      {/* Center: Question Indicator */}
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-zinc-800 tracking-tight">
          Question {questionNumber}
        </span>
        {onNext && (
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-all shadow-sm"
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Right: Hint + Check + Close */}
      <div className="flex items-center gap-2">
        <button
          onClick={onHint}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all",
            showHint
              ? "bg-amber-100 text-amber-700 border border-amber-200"
              : "text-zinc-600 hover:bg-white/40"
          )}
        >
          <Lightbulb size={15} />
          Hint
        </button>

        <button
          onClick={onCheckAnswer}
          disabled={isValidated && isFullyCorrect}
          className={cn(
            "flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-black transition-all",
            isValidated && isFullyCorrect
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-[#00AB6B] hover:bg-[#00915B] text-white shadow-md active:scale-[0.98]"
          )}
        >
          Check Answer
        </button>

        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-zinc-200 shadow-sm"
        >
          <X size={20} className="stroke-[3px]" />
        </button>
      </div>
    </div>
  );
};
