"use client";

import React, { useRef } from "react";

// ─── Draggable splitter (VS Code-style panel resizer) ─────────────────────────
// Reports the horizontal drag delta (px) on each mouse move. The parent decides
// whether to add or subtract it from a panel width. Shared by the activity
// screens (learning lesson, skill test, case-simulation test).

export function Resizer({ onResize, onDragState }: {
  onResize: (deltaX: number) => void;
  onDragState?: (dragging: boolean) => void;
}) {
  const lastX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    lastX.current = e.clientX;
    onDragState?.(true);

    const move = (ev: MouseEvent) => {
      const delta = ev.clientX - lastX.current;
      lastX.current = ev.clientX;
      onResize(delta);
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onDragState?.(false);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="flex-shrink-0 w-1.5 self-stretch my-1 rounded-full cursor-col-resize bg-transparent hover:bg-[#01696F]/30 active:bg-[#01696F]/50 transition-colors duration-150 group"
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-[3px] h-8 rounded-full bg-zinc-200 group-hover:bg-[#01696F]/50 transition-colors" />
      </div>
    </div>
  );
}

export default Resizer;
