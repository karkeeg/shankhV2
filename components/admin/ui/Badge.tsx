import React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "teal" | "green" | "amber" | "rose" | "violet" | "indigo";

const TONES: Record<Tone, string> = {
  neutral: "bg-zinc-50 text-zinc-500 border-zinc-200",
  teal: "bg-[#E6F0F1] text-[#01696F] border-[#01696F]/20",
  green: "bg-emerald-50 text-emerald-600 border-emerald-200",
  amber: "bg-amber-50 text-amber-600 border-amber-200",
  rose: "bg-rose-50 text-rose-600 border-rose-200",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

const DIFFICULTY_TONE: Record<string, Tone> = {
  easy: "green",
  medium: "amber",
  hard: "rose",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon: Icon,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  icon?: React.ElementType;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full border uppercase tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}

/** Difficulty pill mapping easy/medium/hard to the right tone. */
export function DifficultyBadge({ difficulty, className }: { difficulty: string; className?: string }) {
  return (
    <Badge tone={DIFFICULTY_TONE[difficulty] ?? "neutral"} className={className}>
      {difficulty}
    </Badge>
  );
}
