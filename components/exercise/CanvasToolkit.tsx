"use client";

import React, { useRef } from "react";
import { Box, Variable, Layers, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DragCategory, DragItem } from "@/data/financeData";

interface CanvasToolkitProps {
  draggableElements?: DragCategory[];
}

export const CanvasToolkit = ({ draggableElements }: CanvasToolkitProps) => {
  const dragGhostRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, item: DragItem) => {
    e.dataTransfer.setData("application/vnd.excalidraw.item", JSON.stringify(item));
    
    // Set up the drag ghost image
    if (dragGhostRef.current) {
      dragGhostRef.current.innerHTML = `
        <div style="
          padding: 10px 20px;
          background: ${item.type === 'shape' ? '#e0e7ff' : '#fef3c7'};
          border: 2px solid ${item.type === 'shape' ? '#4f46e5' : '#d97706'};
          border-radius: 8px;
          color: #1f2937;
          font-weight: bold;
          font-family: sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          opacity: 0.8;
          white-space: nowrap;
        ">
          ${item.label}
        </div>
      `;
      e.dataTransfer.setDragImage(dragGhostRef.current, 40, 20);
    }
  };

  if (!draggableElements || draggableElements.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-zinc-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
          <Layers size={18} />
        </div>
        <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">Modeling Toolkit</h3>
      </div>
      
      <div className="space-y-6">
        {draggableElements.map((category, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-400 group">
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                {category.category}
              </span>
              <div className="h-[1px] flex-1 bg-zinc-200" />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-white transition-all cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md hover:translate-y-[-2px]",
                    item.type === "equation" ? "bg-amber-50/30 border-amber-100" : "bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      item.type === "shape" ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {item.type === "shape" ? <Box size={16} /> : <Variable size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-700 tracking-tight leading-none mb-1">{item.label}</span>
                      <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">{item.content}</span>
                    </div>
                  </div>
                  <GripVertical size={14} className="text-zinc-300 group-hover:text-zinc-500" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden element for drag ghost image */}
      <div 
        ref={dragGhostRef}
        className="fixed top-[-1000px] left-[-1000px] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
