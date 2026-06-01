import React from "react";
import { cn } from "@/lib/utils";

interface HeatmapProps {
  completedDates?: string[];
}

export const Heatmap = ({ completedDates = [] }: HeatmapProps) => {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const monthName = today.toLocaleString("default", { month: "short", year: "numeric" });

  // Get first day of the month
  const firstDay = new Date(year, month, 1);
  // Get starting day of the week (0 = Sun, 1 = Mon, ... 6 = Sat)
  // Let's convert to Mon = 0, Tue = 1, ... Sun = 6
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  // Get total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const cells = [];
  // Empty cells for padding at the start
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ day: null, dateStr: null, isActive: false, isToday: false });
  }

  // Populate actual days
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isActive = completedDates.includes(dateStr);
    const isToday = d === today.getDate();

    cells.push({
      day: d,
      dateStr,
      isActive,
      isToday,
    });
  }

  // Pad the end to make it a multiple of 7
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, dateStr: null, isActive: false, isToday: false });
  }

  return (
    <div className="bg-white p-6 rounded-3xl flex flex-col h-full w-full border border-transparent select-none">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest">{monthName}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {days.map((day) => (
          <span key={day} className="text-[10px] font-bold text-zinc-400">{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 flex-1">
        {cells.map((cell, i) => {
          if (!cell.day) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          return (
            <div
              key={`day-${cell.day}`}
              title={cell.dateStr || ""}
              className={cn(
                "aspect-square rounded-full flex flex-col items-center justify-center transition-all relative text-xs font-bold",
                cell.isActive 
                  ? "bg-[#01696F] text-white" 
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700",
                cell.isToday && "ring-2 ring-[#01696F] ring-offset-2"
              )}
            >
              <span>{cell.day}</span>
              {cell.isActive && (
                <div className="w-1.5 h-1.5 bg-white rounded-full mt-0.5 opacity-60" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
