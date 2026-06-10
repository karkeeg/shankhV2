"use client";

import React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Panel edge rail ──────────────────────────────────────────────────────────
// A floating toggle pinned to the far edge of the activity layout, so the
// open/close control lives at the screen edge instead of on the seam between
// two panels. It is absolutely positioned and takes no layout width — the
// parent must be `relative`. One button: collapse when the panel is open,
// expand when it's closed.

export function PanelEdgeRail({
  side,
  open,
  onToggle,
  label,
  className,
}: {
  side: "left" | "right";
  open: boolean;
  onToggle: () => void;
  /** Used for title / aria-label, e.g. "case studies". */
  label?: string;
  className?: string;
}) {
  const isLeft = side === "left";
  const Icon = isLeft
    ? open ? PanelLeftClose : PanelLeftOpen
    : open ? PanelRightClose : PanelRightOpen;
  const action = open ? "Collapse" : "Expand";
  const aria = `${action}${label ? ` ${label}` : " panel"}`;

  return (
    <button
      onClick={onToggle}
      title={aria}
      aria-label={aria}
      aria-pressed={open}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-40 w-7 h-7 bg-white border border-zinc-200 shadow-md rounded-lg flex items-center justify-center text-zinc-500 hover:text-[#01696F] hover:border-[#01696F]/30 transition-all active:scale-90",
        isLeft ? "left-1" : "right-1",
        className
      )}
    >
      <Icon size={16} />
    </button>
  );
}

export default PanelEdgeRail;
