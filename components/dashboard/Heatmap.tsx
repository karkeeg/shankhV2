import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";

interface HeatmapProps {
  completedDates?: string[];
}

export const Heatmap = ({ completedDates = [] }: HeatmapProps) => {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const today = new Date();

  // Currently displayed month/year (defaults to current month)
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed
  const monthName = viewDate.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  const goToPrevMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

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
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

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
    <div className="bg-white p-4 rounded-3xl flex flex-col h-full w-full border border-transparent select-none">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="Previous month"
          className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest">{monthName}</span>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Next month"
          className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 justify-items-center text-center mb-1.5">
        {days.map((day) => (
          <span key={day} className="text-[9px] font-bold text-zinc-400 w-full">{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 justify-items-center flex-1">
        {cells.map((cell, i) => {
          if (!cell.day) {
            return <div key={`empty-${i}`} className="aspect-square w-full max-w-[44px]" />;
          }

          return (
            <div
              key={`day-${cell.day}`}
              title={cell.dateStr || ""}
              className={cn(
                "aspect-square max-w-[44px] max-h-[44px] w-full rounded-full flex items-center justify-center transition-all relative text-xs font-bold",
                cell.isActive
                  ? "bg-[#01696F]/20 text-white border-2 border-[#01696F]" // Keep text white for readability over the flame
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700",
                cell.isToday && "ring-2 ring-[#01696F] ring-offset-1"
              )}
            >
              {cell.isActive && (
                <Flame
                  className="absolute inset-0 m-auto w-9 h-9 text-[#01696F] opacity-90"
                  fill="currentColor"
                />
              )}

              {/* The day number sits on top (Z-index handled by source order) */}
              <span className={cn(cell.isActive && "relative z-10")}>
                {cell.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
