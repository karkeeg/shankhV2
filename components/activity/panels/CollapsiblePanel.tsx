"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Resizer } from "./Resizer";

// ─── Collapsible + resizable activity side panel ──────────────────────────────
// The animated-width shell shared by the activity screens. Collapses to width 0
// (content stays at its fixed pixel width inside an overflow-hidden wrapper, so
// it doesn't reflow mid-animation) and exposes an optional resizer on its inner
// edge. Drag deltas are sign-corrected for side: dragging a right panel's left
// edge leftwards widens it.
//
// Two content modes:
//   • `title` set  → renders the standard white card + `bg-[#FAF7F2]` header
//     (icon, title, close X); `children` are the card body.
//   • `title` unset → `children` render directly (e.g. the case-test left panel
//     with its own logo / back / tabs layout).

interface CollapsiblePanelProps {
  side: "left" | "right";
  open: boolean;
  width: number;
  /** Disable the width transition while a resizer drag is in progress. */
  dragging?: boolean;
  resizable?: boolean;
  /** Receives a sign-corrected delta — pass the hook's `resize`. */
  onResize?: (delta: number) => void;
  onDragState?: (dragging: boolean) => void;
  /** Header (card) mode. */
  title?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  /** Classes for the fixed-width inner wrapper (layout/padding). */
  innerClassName?: string;
  /** Extra classes for the animated outer wrapper. */
  className?: string;
  children: React.ReactNode;
}

export function CollapsiblePanel({
  side,
  open,
  width,
  dragging,
  resizable,
  onResize,
  onDragState,
  title,
  icon,
  onClose,
  innerClassName,
  className,
  children,
}: CollapsiblePanelProps) {
  const panel = (
    <div
      className={cn(
        "flex-shrink-0 overflow-hidden",
        !dragging && "transition-all duration-300 ease-in-out",
        className
      )}
      style={{ width: open ? width : 0 }}
    >
      <div className={innerClassName} style={{ width }}>
        {title ? (
          <div className="bg-white flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 flex-shrink-0 bg-[#FAF7F2]">
              {icon && (
                <div className="w-8 h-8 rounded-full bg-[#01696F]/10 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
              )}
              <h3 className="font-black text-zinc-800 text-base tracking-tight">{title}</h3>
              {onClose && (
                <button
                  onClick={onClose}
                  aria-label="Close panel"
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition group"
                >
                  <X size={16} className="text-zinc-500 group-hover:text-zinc-800 transition" />
                </button>
              )}
            </div>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );

  const resizer =
    resizable && open && onResize ? (
      <Resizer
        onResize={(d) => onResize(side === "right" ? -d : d)}
        onDragState={onDragState}
      />
    ) : null;

  // Resizer sits on the inner edge: after a left panel, before a right panel.
  return side === "right" ? (
    <>
      {resizer}
      {panel}
    </>
  ) : (
    <>
      {panel}
      {resizer}
    </>
  );
}

export default CollapsiblePanel;
