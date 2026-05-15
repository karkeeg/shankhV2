"use client";

import React, { useEffect, useState } from "react";
import "@excalidraw/excalidraw/index.css";

interface ExcalidrawWrapperProps {
  excalidrawRef: React.MutableRefObject<ExcalidrawApi | null>;
  initialData?: ExcalidrawInitialData;
  onChange?: (elements: readonly ExcalidrawSceneElement[]) => void;
  onDrop?: (event: React.DragEvent) => void;
}

interface ExcalidrawApi {
  getAppState: () => {
    scrollX: number;
    scrollY: number;
    zoom: { value: number };
  };
  getSceneElements: () => readonly ExcalidrawSceneElement[];
  updateScene: (scene: {
    elements: readonly ExcalidrawSceneElement[];
    appState: Record<string, unknown>;
  }) => void;
}

interface ExcalidrawInitialData {
  elements: readonly ExcalidrawSceneElement[];
  appState: Record<string, unknown>;
}

type ExcalidrawSceneElement = Record<string, unknown> & {
  customData?: { originalId?: string };
};

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

  return (
    <div 
      className="w-full h-full relative" 
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Excalidraw
        excalidrawAPI={(api: ExcalidrawApi) => {
          if (excalidrawRef) {
            excalidrawRef.current = api;
          }
        }}
        initialData={initialData || { elements: [], appState: { theme: 'light' } }}
        onChange={onChange}
        theme="light"
      />
    </div>
  );
};

export default ExcalidrawWrapper;
