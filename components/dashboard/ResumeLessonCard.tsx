import React from "react";
import Link from "next/link";

export const ResumeLessonCard = () => {
  return (
    <div className="bg-[#01696F] rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Resume your lesson</h2>
        <div className="flex items-center gap-2 text-white/90 text-sm">
          <span className="font-bold">Modeling Fountains</span>
          <span className="text-white/50">|</span>
          <span className="font-medium">Financial Statement Fundamentals</span>
        </div>
      </div>
      <Link
        href="/study-plan"
        className="bg-white text-[#1a1a1a] px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-zinc-50 transition-colors"
      >
        Resume Learning
      </Link>
    </div>
  );
};
