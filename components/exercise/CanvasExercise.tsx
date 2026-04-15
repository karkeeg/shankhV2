"use client";

import React, { useRef } from "react";
import ExcalidrawWrapper from "./ExcalidrawWrapper";
import { DragItem } from "@/data/financeData";

export interface CanvasExerciseProps {
  canvasBackgroundText?: string;
}

export const CanvasExercise = ({ canvasBackgroundText }: CanvasExerciseProps) => {
  const excalidrawRef = useRef<any>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/vnd.excalidraw.item");
    if (!data || !excalidrawRef.current) return;

    try {
      const item = JSON.parse(data) as DragItem;
      const api = excalidrawRef.current;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const appState = api.getAppState();
      const { scrollX, scrollY, zoom } = appState;
      
      const x = (clientX - scrollX) / zoom.value;
      const y = (clientY - scrollY) / zoom.value;

      const commonProps = {
        strokeColor: "#18181b",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        roundness: { type: 3 },
        seed: Math.floor(Math.random() * 100000),
        version: Date.now(),
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        groupIds: [],
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        angle: 0,
        strokeSharpness: "round",
      };

      if (item.type === "shape") {
        const groupId = generateId();
        const shapeId = generateId();
        const textId = generateId();

        const newElement: any = {
          ...commonProps,
          id: shapeId,
          type: "rectangle",
          x,
          y,
          width: 160,
          height: 60,
          backgroundColor: "#e0e7ff",
          groupIds: [groupId],
        };
        
        const textElement: any = {
          ...commonProps,
          id: textId,
          type: "text",
          x: x + 10,
          y: y + 20,
          width: 140,
          height: 20,
          text: item.content,
          fontSize: 16,
          fontFamily: 1,
          textAlign: "center",
          verticalAlign: "middle",
          backgroundColor: "transparent",
          groupIds: [groupId],
          originalText: item.content,
          lineHeight: 1.2,
        };
        
        api.updateScene({
          elements: [...api.getSceneElements(), newElement, textElement],
          appState: { ...api.getAppState() }
        });
      } else {
        const textElement: any = {
          ...commonProps,
          id: generateId(),
          type: "text",
          x,
          y,
          width: 300,
          height: 30,
          text: item.content,
          fontSize: 20,
          fontFamily: 1,
          textAlign: "left",
          verticalAlign: "top",
          baseline: 18,
          backgroundColor: "transparent",
          originalText: item.content,
          lineHeight: 1.2,
        };
        
        api.updateScene({
          elements: [...api.getSceneElements(), textElement],
          appState: { ...api.getAppState() }
        });
      }
    } catch (err) {
      console.error("Failed to parse drop data", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden border border-zinc-200 shadow-xl flex bg-white">
      {/* Canvas Area - Now Edge-to-Edge */}
      <div 
        className="flex-1 relative bg-[#f8f9fa] z-0"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ExcalidrawWrapper excalidrawRef={excalidrawRef} />
        
        {/* Helper Message if needed */}
        {canvasBackgroundText && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 bg-zinc-900/5 backdrop-blur-sm rounded-full border border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
            {canvasBackgroundText}
          </div>
        )}
      </div>
    </div>
  );
};
