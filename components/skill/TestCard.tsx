"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play, Lock, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";

interface TypeConfig {
  activityType: "mcq" | "canvas" | "quantus";
  timeLimitMins: number;
}

interface TestCardProps {
  test: {
    id: string;
    name: string;
    description: string | null;
    typeConfigs: TypeConfig[];
    itemCounts: {
      mcq: number;
      canvas: number;
      quantus: number;
    };
    userProgress: Array<{
      id: string;
      activityType: string;
      status: "in_progress" | "completed" | "expired";
      scorePct: number | null;
      completedItems: number;
      totalItems: number;
    }>;
  };
  activeActivityType?: string | null;
}

export const TestCard: React.FC<TestCardProps> = ({ test, activeActivityType }) => {
  const router = useRouter();

  const activityTypes: Array<{
    type: "mcq" | "canvas" | "quantus";
    label: string;
    colorClass: string;
  }> = [
    { type: "mcq", label: "MCQ Quiz", colorClass: "border-violet-100 bg-violet-50 text-violet-700" },
    { type: "canvas", label: "Canvas Drill", colorClass: "border-amber-100 bg-amber-50 text-amber-700" },
    { type: "quantus", label: "Quantus Lab", colorClass: "border-sky-100 bg-sky-50 text-sky-700" },
  ];

  const filteredActivityTypes = activeActivityType
    ? activityTypes.filter((a) => a.type === activeActivityType)
    : activityTypes;

  const visibleTypes = filteredActivityTypes.filter(({ type }) => (test.itemCounts[type] || 0) > 0);

  const handleStartResume = (activityType: string) => {
    router.push(`/skill/tests/${test.id}/${activityType}`);
  };

  return (
    <div className="bg-white border border-zinc-150 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)] transition-all duration-300">
      <div>
        <h3 className="font-extrabold text-lg text-zinc-900 tracking-tight leading-snug">
          {test.name}
        </h3>
        <p className="text-xs text-zinc-500 font-semibold leading-relaxed mt-2">
          {test.description || "Synthesize your practical professional knowledge with this test."}
        </p>
      </div>

      <div className={cn(
        "grid grid-cols-1 gap-3 mt-6",
        visibleTypes.length === 2 ? "md:grid-cols-2" : visibleTypes.length === 1 ? "md:grid-cols-1 max-w-sm" : "md:grid-cols-3"
      )}>
        {filteredActivityTypes.map(({ type, label, colorClass }) => {
          const itemCount = test.itemCounts[type] || 0;
          if (itemCount === 0) return null;

          const session = test.userProgress.find((s) => s.activityType === type);
          const timeLimit = test.typeConfigs.find((c) => c.activityType === type)?.timeLimitMins || 30;

          let statusLabel = "Not Started";
          let statusIcon = <Play size={12} fill="currentColor" />;
          let isComplete = false;

          if (session) {
            if (session.status === "completed") {
              statusLabel = session.scorePct !== null ? `${Math.round(session.scorePct)}%` : "Completed";
              statusIcon = <CheckCircle2 size={12} fill="currentColor" className="text-emerald-500" />;
              isComplete = true;
            } else if (session.status === "expired") {
              statusLabel = "Expired";
              statusIcon = <Hourglass size={12} className="text-rose-500" />;
              isComplete = true;
            } else {
              statusLabel = `In Progress (${session.completedItems}/${session.totalItems})`;
              statusIcon = <Hourglass size={12} className="text-amber-500 animate-spin" />;
            }
          }

          return (
            <div
              key={type}
              onClick={() => handleStartResume(type)}
              className={cn(
                "group/item p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none active:scale-[0.98]",
                isComplete
                  ? "bg-zinc-50/50 border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                  : "bg-white border-zinc-200 hover:border-[#01696F]/30 hover:shadow-sm"
              )}
            >
              <div>
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", colorClass)}>
                  {type}
                </span>
                <h4 className="font-extrabold text-sm text-zinc-800 leading-tight tracking-tight mt-2.5">
                  {label}
                </h4>
                <p className="text-[10px] text-zinc-400 font-bold mt-1">
                  {itemCount} Activities • {timeLimit} Min Timer
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/70 flex items-center gap-1.5">
                  {statusIcon} {statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
