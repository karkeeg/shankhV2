"use client";

import React, { useRef, useMemo } from "react";
import ExcalidrawWrapper from "./ExcalidrawWrapper";
import { DragItem } from "@/data/financeData";

export interface CanvasExerciseProps {
  canvasBackgroundText?: string;
  onElementsChange?: (elements: any[]) => void;
  initialElements?: any[];
}

export const CanvasExercise = ({ canvasBackgroundText, onElementsChange, initialElements }: CanvasExerciseProps) => {
  const excalidrawRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Memoize initialData so it remains stable across re-renders. 
  // It will only change when the component remounts (triggered by key change in parent).
  const initialData = useMemo(() => ({
    elements: initialElements || [],
    appState: { theme: 'light', viewBackgroundColor: '#ffffff' }
  }), []); // Stable across re-renders of the same lesson

  const handleChange = (elements: readonly any[]) => {
    const now = Date.now();
    // Throttle/Debounce updates to parent to prevent infinite loops and lag
    if (now - lastUpdateRef.current > 500) {
      if (onElementsChange) {
        onElementsChange([...elements]);
      }
      lastUpdateRef.current = now;
    }
  };

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

      const isShape = item.type !== "equation";

      const commonProps = {
        strokeColor: isShape ? "#4f46e5" : "#d97706",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 0,
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
        customData: { originalId: item.id },
      };

      const groupId = generateId();
      const shapeId = generateId();
      const textId = generateId();

      const estimatedWidth = Math.max(160, item.content.length * 9 + 40);

      let excalidrawType = "rectangle";
      let bgColor = "#e0e7ff";
      let strColor = "#4f46e5";

      if (item.type === "ellipse") {
        excalidrawType = "ellipse";
        bgColor = "#d1fae5";
        strColor = "#059669";
      } else if (item.type === "diamond") {
        excalidrawType = "diamond";
        bgColor = "#fae8ff";
        strColor = "#c026d3";
      } else if (item.type === "equation") {
        excalidrawType = "rectangle";
        bgColor = "#fef3c7";
        strColor = "#d97706";
      }

      const newElement: any = {
        ...commonProps,
        strokeColor: strColor,
        id: shapeId,
        type: excalidrawType,
        x,
        y,
        width: estimatedWidth,
        height: 60,
        backgroundColor: bgColor,
        groupIds: [groupId],
      };

      const textElement: any = {
        ...commonProps,
        strokeColor: "#1f2937",
        id: textId,
        type: "text",
        x: x + 10,
        y: y + 20,
        width: estimatedWidth - 20,
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
    } catch (err) {
      console.error("Failed to parse drop data", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex bg-white">
      <div
        className="flex-1 relative bg-white z-0"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ExcalidrawWrapper
          excalidrawRef={excalidrawRef}
          onChange={handleChange}
          initialData={initialData}
        />

        {canvasBackgroundText && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest shadow-sm transition-all">
            {canvasBackgroundText}
          </div>
        )}
      </div>
    </div>
  );
};
