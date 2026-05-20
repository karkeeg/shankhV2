import React from "react";

export const ProgramInfoCard = () => {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-start justify-between relative overflow-hidden">
      <div className="space-y-2 max-w-4xl">
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
          Build recruiter-grade judgement, not just notes.
        </h2>
        <p className="text-zinc-600 text-sm font-medium leading-relaxed">
          Simulated learning across finance, strategy and operations for consulting, private equity and investing banking readiness.
        </p>
      </div>
      <div className="bg-[#E6F0F1] text-zinc-600 px-4 py-3 rounded-xl text-xs font-medium text-center border border-zinc-200/50">
        <div>Sunday Session 42 mins available</div>
      </div>
    </div>
  );
};
