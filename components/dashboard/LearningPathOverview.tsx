import React from "react";

interface LearningPathOverviewProps {
  progressPercentage: number;
  streak: number;
  simulations: number;
}

export const LearningPathOverview = ({
  progressPercentage,
  streak,
  simulations,
}: LearningPathOverviewProps) => {
  return (
    <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-content gap-5">
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#1a1a1a] tracking-tight">
          Your learning path is organized by function, topic, and role outcome.
        </h3>
        <p className="text-zinc-600 text-sm font-medium leading-relaxed">
          Move from topic depth into simulations and then into review loops. The structure is built to improve concept absorption and decision quality under real business pressure.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 p-5 border border-[#1a1a1a] rounded-xl">
        <div className="space-y-1 text-center border-r border-zinc-500">
          <p className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider">Mastery Score</p>
          <p className="text-2xl font-bold text-[#1a1a1a]">{Math.round(progressPercentage)}%</p>
        </div>
        <div className="space-y-1 text-center border-r border-zinc-500">
          <p className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider">Streak</p>
          <p className="text-2xl font-bold text-[#1a1a1a]">{streak} {streak === 1 ? "day" : "days"}</p>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider">Simulations</p>
          <p className="text-2xl font-bold text-[#1a1a1a]">{simulations}</p>
        </div>
      </div>
    </div>
  );
};
