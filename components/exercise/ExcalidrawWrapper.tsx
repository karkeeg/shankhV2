"use client";

import React, { useEffect, useState } from "react";
import "@excalidraw/excalidraw/index.css";

interface ExcalidrawWrapperProps {
  excalidrawRef: any;
  initialData?: any;
  onChange?: (elements: any, appState: any, files: any) => void;
  onDrop?: (event: React.DragEvent) => void;
}

const ExcalidrawWrapper = ({ 
  excalidrawRef, 
  initialData, 
  onChange,
  onDrop
}: ExcalidrawWrapperProps) => {
  const [Excalidraw, setExcalidraw] = useState<any>(null);

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
        excalidrawAPI={(api: any) => {
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
