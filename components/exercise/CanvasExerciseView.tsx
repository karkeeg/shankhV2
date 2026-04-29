"use client";

import React, { useState, useEffect } from "react";
import { ExerciseConfig } from "@/data/financeData";
import { ExcelGrid } from "./ExcelGrid";
import { CanvasInstructionPanel } from "./CanvasInstructionPanel";
import { CanvasTopBar } from "./CanvasTopBar";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useAppStore } from "@/lib/store";
import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { CanvasExercise } from "./CanvasExercise";
import { CanvasToolkit } from "./CanvasToolkit";

interface CanvasExerciseViewProps {
  lessonId: string;
  exercise: ExerciseConfig;
  /** Title of the exercise card */
  cardTitle: string;
  /** Difficulty label */
  difficulty: "Easy" | "Medium" | "Hard";
  /** Rich instruction content for the left panel */
  instructionContent: React.ReactNode;
  /** Context tab content */
  contextContent?: React.ReactNode;
  /** Sheet tab name to show in the bottom bar */
  sheetTabName?: string;
  /** Called when user closes the exercise view */
  onClose: () => void;
}

export const CanvasExerciseView = ({
  lessonId,
  exercise,
  cardTitle,
  difficulty,
  instructionContent,
  contextContent,
  sheetTabName = "Income Statement",
  onClose,
}: CanvasExerciseViewProps) => {
  const { markLessonComplete } = useAppStore();
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [isValidated, setIsValidated] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [isFullyCorrect, setIsFullyCorrect] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState(0);

  const hasMultipleTables = !!(exercise.tables && exercise.tables.length > 0);
  const currentTable = hasMultipleTables && exercise.tables
    ? exercise.tables[activeTableIndex]
    : undefined;

  // Reset state when exercise changes
  useEffect(() => {
    setUserInputs({});
    setIsValidated(false);
    setFeedback({});
    setShowHint(false);
    setIsFullyCorrect(false);
    setActiveTableIndex(0);
  }, [exercise]);

  const validate = () => {
    const newFeedback: Record<string, boolean> = {};
    let correctCount = 0;
    let totalCount = 0;

    if (hasMultipleTables && exercise.tables) {
      exercise.tables.forEach((table) => {
        if (table.inputs) {
          totalCount += table.inputs.length;
          table.inputs.forEach((input) => {
            const key = `${input.row}-${input.col}`;
            const userValue = (userInputs[key] || "").toString().trim().replace(/,/g, "");
            const isCorrect = userValue === input.correctValue.toString();
            newFeedback[key] = isCorrect;
            if (isCorrect) correctCount++;
          });
        }
      });
    } else if (exercise.inputs) {
      totalCount = exercise.inputs.length;
      exercise.inputs.forEach((input) => {
        const key = `${input.row}-${input.col}`;
        const userValue = (userInputs[key] || "").toString().trim().replace(/,/g, "");
        const isCorrect = userValue === input.correctValue.toString();
        newFeedback[key] = isCorrect;
        if (isCorrect) correctCount++;
      });
    }

    setFeedback(newFeedback);
    setIsValidated(true);

    if (correctCount === totalCount && totalCount > 0) {
      setIsFullyCorrect(true);
      markLessonComplete(lessonId, {
        score: Math.round((correctCount / totalCount) * 100),
      });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#f59e0b"],
      });
    } else {
      setIsFullyCorrect(false);
    }
  };

  const reset = () => {
    setIsValidated(false);
    setFeedback({});
    setIsFullyCorrect(false);
    setUserInputs({});
  };

  return (
    <div className="flex h-full overflow-hidden font-sans">
      {/* Left Sidebar — Instruction Panel */}
      <CanvasInstructionPanel
        difficulty={difficulty}
        title={cardTitle}
        instructions={instructionContent}
        contextContent={contextContent}
      >
        {exercise.type === "canvas" && exercise.canvasDraggableElements && (
          <CanvasToolkit draggableElements={exercise.canvasDraggableElements} />
        )}
      </CanvasInstructionPanel>

      {/* Right Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1E2E3C]">
        {/* Top Navigation Bar */}
        <CanvasTopBar
          questionNumber={1}
          showHint={showHint}
          onHint={() => setShowHint(!showHint)}
          onReset={reset}
          onCheckAnswer={validate}
          onClose={onClose}
          isValidated={isValidated}
          isFullyCorrect={isFullyCorrect}
        />

        {/* Hint / Feedback Banner */}
        {(isValidated || showHint) && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold border-b border-zinc-200 animate-in fade-in slide-in-from-top-1",
              isValidated && isFullyCorrect
                ? "bg-emerald-50 text-emerald-700"
                : isValidated
                  ? "bg-rose-50 text-rose-600"
                  : "bg-amber-50 text-amber-700"
            )}
          >
            {isValidated ? (
              isFullyCorrect ? (
                <>
                  <CheckCircle2 size={14} /> Brilliant! All answers are correct.
                </>
              ) : (
                <>
                  <AlertCircle size={14} /> Review and retry. Some entries need correction.
                </>
              )
            ) : (
              <>
                <Lightbulb size={14} /> Hint: Think about the relationship between the line items.
              </>
            )}
          </div>
        )}

        {/* Tab Bar for Multiple Tables */}
        {hasMultipleTables && exercise.tables && (
          <div className="flex gap-1 bg-zinc-800/20 p-1 px-8 overflow-x-auto border-b border-zinc-700/30 shrink-0">
            {exercise.tables.map((table, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTableIndex(idx)}
                className={cn(
                  "px-6 py-2 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all whitespace-nowrap",
                  activeTableIndex === idx
                    ? "bg-white text-zinc-900 shadow-lg"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/20"
                )}
              >
                {table.name}
              </button>
            ))}
          </div>
        )}

        {/* Spreadsheet Area — Floating Container */}
        <div className="flex-1 min-h-0 relative p-8">
          <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-zinc-700/30 bg-white">
          {exercise.type === "excel" ? (
            hasMultipleTables && currentTable ? (
              <ExcelGrid
                table={currentTable.table}
                inputs={currentTable.inputs || []}
                dropdowns={currentTable.dropdowns || []}
                userInputs={userInputs}
                setUserInputs={setUserInputs}
                isValidated={isValidated}
                feedback={feedback}
                sheetTabName={sheetTabName}
                showToolbar={true}
              />
            ) : (
              exercise.table && (
                <ExcelGrid
                  table={exercise.table}
                  inputs={exercise.inputs || []}
                  dropdowns={exercise.dropdowns || []}
                  userInputs={userInputs}
                  setUserInputs={setUserInputs}
                  isValidated={isValidated}
                  feedback={feedback}
                  sheetTabName={sheetTabName}
                  showToolbar={true}
                />
              )
            )
          ) : exercise.type === "canvas" ? (
            <CanvasExercise
              canvasBackgroundText={exercise.canvasBackgroundText}
            />
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
