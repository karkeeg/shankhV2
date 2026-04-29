"use client";

import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhaseId = "easy" | "medium" | "hard";

const phases: {
  id: PhaseId;
  label: string;
  badge: string;
  badgeBg: string;
  accentBorder: string;
  accentBtn: string;
  title: string;
  description: string;
  points: string[];
}[] = [
  {
    id: "easy",
    label: "Easy",
    badge: "Beginner Friendly",
    badgeBg: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    accentBorder: "hover:border-emerald-300",
    accentBtn: "bg-emerald-600 hover:bg-emerald-700",
    title: "Simple Financial Statement Modeling",
    description:
      "Complete historical drivers and guided assumptions in a structured, step-by-step workflow.",
    points: [
      "Review historical income, balance sheet, and cash flow drivers.",
      "Fill highlighted projection cells with guided assumptions.",
      "Use consistent growth and margin drivers through 2023.",
    ],
  },
  {
    id: "medium",
    label: "Medium",
    badge: "Intermediate",
    badgeBg: "bg-amber-50 text-amber-700 border border-amber-200",
    accentBorder: "hover:border-amber-300",
    accentBtn: "bg-amber-500 hover:bg-amber-600",
    title: "Intermediate Statement Integration",
    description:
      "Work through connected assumptions across statements and validate key projection relationships.",
    points: [
      "Link Income Statement assumptions to balance sheet and cash flow.",
      "Project working capital and debt balances using modeled drivers.",
      "Confirm the integrated 3-statement structure on each period.",
    ],
  },
  {
    id: "hard",
    label: "Hard",
    badge: "Advanced",
    badgeBg: "bg-rose-50 text-rose-700 border border-rose-200",
    accentBorder: "hover:border-rose-300",
    accentBtn: "bg-rose-600 hover:bg-rose-700",
    title: "Advanced Integrated Modeling",
    description:
      "Take on the full 3-statement forecast with advanced assumptions and cross-statement validation.",
    points: [
      "Complete the full forecast using advanced driver logic.",
      "Validate cash flow and balance sheet alignment across the model.",
      "Review the model for consistency and framing risk assumptions.",
    ],
  },
];

interface StudyLevelPageProps {
  cardTitle: string;
  onBack: () => void;
  onSelect: (phase: PhaseId) => void;
}

export function StudyLevelPage({
  cardTitle,
  onBack,
  onSelect,
}: StudyLevelPageProps) {
  return (
    <div className="flex h-full bg-zinc-100 overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {/* ── Back ── */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-sm font-semibold mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          {cardTitle}
        </button>

        {/* ── Heading ── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Select Your Level
          </h1>
          <p className="text-zinc-500 mt-1.5 text-sm">
            Choose a difficulty that matches your current skill level to begin
            the exercise.
          </p>
        </div>

        {/* ── Level cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={cn(
                "bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-5 transition-all duration-200 cursor-default",
                phase.accentBorder,
                "hover:shadow-md",
              )}
            >
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full",
                    phase.badgeBg,
                  )}
                >
                  {phase.badge}
                </span>
                <span className="text-2xl font-black text-zinc-200">
                  {phase.label[0]}
                </span>
              </div>

              {/* Title + description */}
              <div>
                <h2 className="text-base font-bold text-zinc-900 leading-snug">
                  {phase.title}
                </h2>
                <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
                  {phase.description}
                </p>
              </div>

              {/* Points */}
              <ul className="flex flex-col gap-2">
                {phase.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                    <CheckCircle2
                      size={13}
                      className="text-zinc-400 mt-0.5 shrink-0"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => onSelect(phase.id)}
                className={cn(
                  "mt-auto w-full text-white text-sm font-bold py-3 rounded-xl active:scale-95 transition-all",
                  phase.accentBtn,
                )}
              >
                Start {phase.label}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
