"use client";

import React, { useEffect, useState } from "react";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawApi, ExcalidrawSceneElement } from "./CanvasExercise";

interface ExcalidrawWrapperProps {
  excalidrawRef: React.RefObject<ExcalidrawApi | null>;
  initialData?: {
    elements: readonly ExcalidrawSceneElement[];
    appState: Record<string, unknown>;
  };
  onChange?: (elements: readonly ExcalidrawSceneElement[]) => void;
  onDrop?: (event: React.DragEvent) => void;
}

const ExcalidrawWrapper = ({ 
  excalidrawRef, 
  initialData, 
  onChange,
  onDrop
}: ExcalidrawWrapperProps) => {
  const [Excalidraw, setExcalidraw] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    // Excalidraw must be imported dynamically on the client
    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidraw(() => mod.Excalidraw);
    });
  }, []);

  if (!Excalidraw) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-zinc-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  // Typecast external API callback safely to allow assigning to the RefObject
  const handleApiRef = (api: any) => {
    if (excalidrawRef) {
      (excalidrawRef as any).current = api;
    }
  };

  return (
    <div 
      className="w-full h-full relative" 
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Excalidraw
        excalidrawAPI={handleApiRef}
        initialData={initialData || { elements: [], appState: { theme: 'light' } }}
        onChange={onChange}
        theme="light"
      />
    </div>
  );
};

export default ExcalidrawWrapper;
