import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Heatmap = () => {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const weeks = 5;
  return (
    <div className="bg-white p-6 rounded-3xl flex flex-col h-full w-full border border-transparent">
      <div className="flex items-center justify-between mb-4">
        <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronRight className="rotate-180" size={16} />
        </button>
        <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Jan 2022</span>
        <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map((day) => (
          <span key={day} className="text-[10px] font-bold text-zinc-400">{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 flex-1">
        {Array.from({ length: 35 }).map((_, i) => {
          const isActive = [3, 10, 11, 12, 13, 14, 17, 18].includes(i);
          const isToday = i === 18;
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-full flex items-center justify-center transition-all",
                isActive ? "bg-[#01696F] text-white" : "bg-zinc-50 hover:bg-zinc-100",
                isToday && "ring-2 ring-[#01696F] ring-offset-2"
              )}
            >
              {isActive && (
                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
