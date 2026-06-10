"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─── Panel reopen tab (previous style) ────────────────────────────────────────
// The original tall "pill" tab shown at the panel seam to re-open a collapsed
// panel — a vertical rotated label plus an icon. Used for the right panels
// (Session / Activities / AI Coach). It only renders while the panel is closed;
// collapsing is handled by the panel header's own close button. Renders nothing
// when open, so it takes no layout space then.

export function PanelReopenTab({
  open,
  onOpen,
  label,
  icon,
  className,
}: {
  open: boolean;
  onOpen: () => void;
  /** Rotated label shown on the pill, e.g. "Session". */
  label: string;
  /** Icon node rendered under the label. */
  icon?: React.ReactNode;
  className?: string;
}) {
  if (open) return null;

  return (
    <button
      onClick={onOpen}
      aria-label={`Expand ${label}`}
      className={cn(
        "self-center z-20 flex-shrink-0 w-8 h-40 bg-white border border-zinc-200 shadow-md rounded-full flex items-center justify-center hover:bg-[#E6F0F1] hover:border-[#01696F]/30 transition-all duration-200 active:scale-95 group",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-[11px] font-bold text-[#01696F] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
          {label}
        </span>
        {icon}
      </div>
    </button>
  );
}

export default PanelReopenTab;
