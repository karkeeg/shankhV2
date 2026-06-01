import React from "react";
import Link from "next/link";

interface ResumeLessonCardProps {
  lesson: {
    id: string;
    title: string;
    moduleName: string;
    subtopicName?: string;
  } | null;
}

export const ResumeLessonCard = ({ lesson }: ResumeLessonCardProps) => {
  const title = lesson?.title || "Start Your Journey";
  const subtitle = lesson?.subtopicName || lesson?.moduleName || "Financial Statement Fundamentals";
  const href = lesson ? `/activity/${lesson.id}` : "/learning/finance";

  return (
    <div className="bg-[#01696F] rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {lesson ? "Resume your lesson" : "Start your next lesson"}
        </h2>
        <div className="flex items-center gap-2 text-white/90 text-sm">
          <span className="font-bold">{title}</span>
          <span className="text-white/50">|</span>
          <span className="font-medium">{subtitle}</span>
        </div>
      </div>
      <Link
        href={href}
        className="bg-white text-[#1a1a1a] px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-zinc-50 transition-colors shrink-0 ml-4"
      >
        {lesson ? "Resume Learning" : "Start Learning"}
      </Link>
    </div>
  );
};
