import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface SidebarStatCardProps {
  successRate?: number;
  thumbsUp?: number;
  thumbsDown?: number;
}

export const SidebarStatCard = ({
  successRate = 53.47,
  thumbsUp = 4,
  thumbsDown = 2,
}: SidebarStatCardProps) => {
  return (
    <div className="bg-[var(--sidebar-card)] rounded-2xl p-4 flex items-center justify-between shadow-lg border border-white/5">
      <div className="flex items-center gap-4 text-xs font-bold">
        <div className="flex items-center gap-1.5 hover:text-white text-[var(--sidebar-muted)] cursor-pointer transition-colors group">
          <ThumbsUp size={14} className="group-hover:scale-110 transition-transform" />
          <span>{thumbsUp}</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-white text-[var(--sidebar-muted)] cursor-pointer transition-colors group">
          <ThumbsDown size={14} className="group-hover:scale-110 transition-transform" />
          <span>{thumbsDown}</span>
        </div>
      </div>
      <div className="text-right flex flex-col">
        <span className="font-black text-sm text-[var(--sidebar-text)]">{successRate}%</span>
        <span className="text-[9px] text-[var(--sidebar-muted)] uppercase tracking-widest font-black">Success Rate</span>
      </div>
    </div>
  );
};
