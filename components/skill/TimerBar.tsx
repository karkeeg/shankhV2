"use client";

import React, { useState, useEffect, useRef } from "react";
import { Hourglass, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { skillApi } from "@/lib/api";

interface TimerBarProps {
  sessionId: string;
  timeLimitMins: number;
  initialTimeSpentSecs: number;
  onExpire: () => void;
  /** Called every second with the current timeSpentSecs — lets parent track for complete call */
  onTick?: (timeSpentSecs: number) => void;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  sessionId,
  timeLimitMins,
  initialTimeSpentSecs,
  onExpire,
  onTick,
}) => {
  const [timeSpentSecs, setTimeSpentSecs] = useState(initialTimeSpentSecs);
  const totalSeconds = timeLimitMins * 60;
  const remainingSeconds = Math.max(0, totalSeconds - timeSpentSecs);

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const saveProgress = async (spentSecs: number) => {
    try {
      await skillApi.updateSession(sessionId, { timeSpentSecs: spentSecs });
    } catch (err) {
      console.error("Failed to save timer state:", err);
    }
  };

  // Save on tab blur / visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        saveProgress(timeSpentSecs);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [timeSpentSecs]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onExpireRef.current();
      return;
    }

    const interval = setInterval(() => {
      setTimeSpentSecs((prev) => {
        const next = prev + 1;

        // Notify parent every tick
        onTickRef.current?.(next);

        // Auto-save every 30 seconds
        if (next % 30 === 0) {
          saveProgress(next);
        }

        if (next >= totalSeconds) {
          clearInterval(interval);
          onExpireRef.current();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, remainingSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPct = (remainingSeconds / totalSeconds) * 100;
  const isUrgent = remainingSeconds <= 120;

  return (
    <div className="w-full bg-white border border-zinc-200 shadow-sm rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center border shadow-sm flex-shrink-0",
            isUrgent
              ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
              : "bg-[#E6F0F1] border-[#01696F]/10 text-[#01696F]"
          )}
        >
          {isUrgent ? <AlertCircle size={18} /> : <Hourglass size={16} />}
        </div>
        <div>
          <h4
            className={cn(
              "text-xs font-black uppercase tracking-wider leading-none",
              isUrgent ? "text-rose-600" : "text-[#01696F]"
            )}
          >
            {isUrgent ? "Time running out!" : "Session timer"}
          </h4>
          <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
            Auto-saving every 30s
          </p>
        </div>
      </div>

      <div className="flex-1 w-full sm:max-w-xs flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              isUrgent ? "bg-rose-500" : "bg-[#01696F]"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span
          className={cn(
            "text-lg font-black tabular-nums whitespace-nowrap px-3 py-1 rounded-xl border shadow-sm select-none flex-shrink-0",
            isUrgent
              ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
              : "bg-[#FAF7F2] border-zinc-200 text-zinc-800"
          )}
        >
          {formatTime(remainingSeconds)}
        </span>
      </div>
    </div>
  );
};