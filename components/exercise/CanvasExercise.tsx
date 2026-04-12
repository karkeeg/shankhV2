"use client";

import React from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export interface CanvasExerciseProps {
  canvasBackgroundText?: string;
}

export const CanvasExercise = ({ canvasBackgroundText }: CanvasExerciseProps) => {
  return (
    <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden border border-zinc-200 shadow-inner flex flex-col">
      {/* Optional Top Bar for self-check if we ever need it */}


      {/* Tldraw covers the remainder of the container */}
      <div className="flex-1 relative bg-zinc-50 z-0">
        <Tldraw persistenceKey="quantus-canvas-practice" />
      </div>
    </div>
  );
};
