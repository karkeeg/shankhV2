"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PaletteItem } from "./types";

interface CanvasPaletteProps {
  items: PaletteItem[];
  placedIds: Set<string>;
}

export function CanvasPalette({ items, placedIds }: CanvasPaletteProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-black uppercase tracking-widest text-[#01696F]/70 block">
        Drag to Canvas
      </span>
      <p className="text-[9px] text-zinc-400 font-medium -mt-1">Double-click a placed node to remove it</p>
      <div className="flex flex-col gap-1.5">
        {items.map(item => {
          const placed = placedIds.has(item.id);
          return (
            <div
              key={item.id}
              draggable={!placed}
              onDragStart={e => e.dataTransfer.setData("canvas/item-id", item.id)}
              title={placed ? "Already on canvas" : `Drag to place "${item.label}"`}
              className={cn(
                "h-9 rounded-xl flex items-center justify-center text-[11px] font-bold border transition-all select-none px-2",
                placed
                  ? "opacity-30 cursor-default border-zinc-100 bg-zinc-100 text-zinc-400"
                  : "cursor-grab hover:shadow-sm active:scale-95 border-white/60 hover:ring-1 hover:ring-[#01696F]/30"
              )}
              style={{ backgroundColor: placed ? undefined : item.color }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper: convert legacy lesson canvas tokens → PaletteItem[] ─────────────

const LEGACY_COLOR: Record<string, string> = {
  rectangle: "#dbeafe",
  ellipse:   "#d1fae5",
  diamond:   "#fae8ff",
  equation:  "#fef3c7",
};

export function tokensToItems(tokens: any[]): PaletteItem[] {
  return (tokens ?? []).map((t: any) => ({
    id: t.id,
    label: t.content || t.label || t.id,
    shape: (t.type === "ellipse" ? "ellipse" : t.type === "diamond" ? "diamond" : "rectangle") as PaletteItem["shape"],
    color: LEGACY_COLOR[t.type] ?? "#dbeafe",
  }));
}
