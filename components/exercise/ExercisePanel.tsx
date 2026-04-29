"use client";

import React, { useState, useEffect } from "react";
import { ExerciseConfig } from "@/data/financeData";
import { ExcelGrid } from "./ExcelGrid";
import { SelectExercise } from "./SelectExercise";
import { CanvasExercise } from "./CanvasExercise";
import { Button } from "../ui/Button";
import { CheckCircle2, RotateCcw, Lightbulb, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

import { useAppStore } from "@/lib/store";
import Link from "next/link";

interface ExercisePanelProps {
  lessonId: string;
  exercise: ExerciseConfig;
}

export const ExercisePanel = ({ lessonId, exercise }: ExercisePanelProps) => {
  const { markLessonComplete, saveCanvasState, completedLessons } = useAppStore();
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [canvasElements, setCanvasElements] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [isFullyCorrect, setIsFullyCorrect] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState(0);

  // Check if exercise has multiple tables
  const hasMultipleTables = !!(exercise.tables && exercise.tables.length > 0);
  const currentTable = hasMultipleTables && exercise.tables
    ? exercise.tables[activeTableIndex]
    : undefined;

  // Reset state when exercise changes
  useEffect(() => {
    setUserInputs({});
    setSelectedOptions([]);
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

    if (exercise.type === "excel") {
      if (hasMultipleTables && exercise.tables) {
        // Validate all tables
        let allCorrectCount = 0;
        let allTotalCount = 0;
        exercise.tables.forEach((table) => {
          if (table.inputs) {
            allTotalCount += table.inputs.length;
            table.inputs.forEach((input) => {
              const key = `${input.row}-${input.col}`;
              const userValue = (userInputs[key] || "")
                .toString()
                .trim()
                .replace(/,/g, "");
              const isCorrect = userValue === input.correctValue.toString();
              newFeedback[key] = isCorrect;
              if (isCorrect) allCorrectCount++;
            });
          }
        });
        correctCount = allCorrectCount;
        totalCount = allTotalCount;
      } else if (exercise.inputs) {
        totalCount = exercise.inputs.length;
        exercise.inputs.forEach((input) => {
          const key = `${input.row}-${input.col}`;
          const userValue = (userInputs[key] || "")
            .toString()
            .trim()
            .replace(/,/g, "");
          const isCorrect = userValue === input.correctValue.toString();
          newFeedback[key] = isCorrect;
          if (isCorrect) correctCount++;
        });
      }
    } else if (exercise.type === "dropdown" && exercise.dropdowns) {
      totalCount = exercise.dropdowns.length;
      exercise.dropdowns.forEach((dropdown) => {
        const key = `${dropdown.row}-${dropdown.col}`;
        const userValue = userInputs[key];
        const isCorrect = userValue === dropdown.correctValue;
        newFeedback[key] = isCorrect;
        if (isCorrect) correctCount++;
      });
    } else if (exercise.type === "select" && exercise.options) {
      totalCount = exercise.options.length;
      exercise.options.forEach((option) => {
        const isSelected = selectedOptions.includes(option.id);
        const isCorrectResult = isSelected === option.isCorrect;
        newFeedback[option.id] = isCorrectResult;
        if (isCorrectResult) correctCount++;
      });
    } else if (exercise.type === "canvas") {
      // Basic validation: Check if all expected items are present on the canvas
      let allFound = true;
      if (exercise.canvasDraggableElements) {
        const requiredIds = exercise.canvasDraggableElements.flatMap(cat => cat.items.map(i => i.id));
        const presentIds = canvasElements
          .filter(el => el.customData?.originalId)
          .map(el => el.customData.originalId);
        
        allFound = requiredIds.every(id => presentIds.includes(id));
      }
      
      totalCount = 1;
      correctCount = allFound ? 1 : 0;
    }

    setFeedback(newFeedback);
    setIsValidated(true);

    if (correctCount === totalCount && totalCount > 0) {
      setIsFullyCorrect(true);
      markLessonComplete(lessonId, { 
        score: Math.round((correctCount / totalCount) * 100),
        lastCanvasElements: exercise.type === "canvas" ? canvasElements : undefined
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
    setSelectedOptions([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Action Bar (Reference Design) */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#E0E2E5] rounded-t-2xl border-b border-zinc-300">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 border-zinc-400 text-zinc-700 bg-[#C8CBD0] hover:bg-[#B8BBC0] rounded-lg font-bold shadow-none"
          >
            <RotateCcw size={14} className="mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 border-zinc-400 text-zinc-700 bg-[#C8CBD0] hover:bg-[#B8BBC0] rounded-lg font-bold shadow-none"
          >
            <ChevronRight size={14} className="mr-1 rotate-180" />
            Previous
          </Button>
        </div>

        {/* Centered Question Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Question 1</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 border-zinc-400 text-zinc-700 bg-[#C8CBD0] hover:bg-[#B8BBC0] rounded-lg font-bold shadow-none"
          >
            Next
            <ChevronRight size={14} className="ml-1" />
          </Button>
          
          <div className="w-px h-6 bg-zinc-400 mx-1" />

          <button className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors">
            <Lightbulb size={16} />
            <span className="text-sm font-bold">Hint</span>
          </button>

          <Button
            variant="success"
            onClick={validate}
            className="bg-[#00AB6B] hover:bg-[#00915B] text-white px-6 py-2 h-9 rounded-lg font-black uppercase tracking-widest text-[11px] shadow-md transition-all active:scale-95"
          >
            Check Answer
          </Button>

          <button 
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors shadow-sm"
            title="Close"
          >
            <span className="text-xl font-bold">×</span>
          </button>
        </div>
      </div>



      {/* Exercise Component Area */}
      <div className="flex-1 min-h-[400px] flex flex-col p-6">
        {/* Tabs for Multiple Tables */}
        {hasMultipleTables && exercise.tables && (
          <div className="flex gap-1 bg-zinc-100 p-1 rounded-t-lg mb-2 overflow-x-auto border-b border-zinc-200">
            {exercise.tables.map((table, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTableIndex(idx)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-t transition-all whitespace-nowrap",
                  activeTableIndex === idx
                    ? "bg-white text-[#7C5DFA] border-b-2 border-[#7C5DFA]"
                    : "text-zinc-600 hover:text-zinc-900 bg-transparent"
                )}
              >
                {table.name}
              </button>
            ))}
          </div>
        )}

        {(exercise.type === "excel" || exercise.type === "dropdown") && (
          <>
            {hasMultipleTables && currentTable ? (
              <ExcelGrid
                table={currentTable.table}
                inputs={currentTable.inputs || []}
                dropdowns={currentTable.dropdowns || []}
                userInputs={userInputs}
                setUserInputs={setUserInputs}
                isValidated={isValidated}
                feedback={feedback}
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
                />
              )
            )}
          </>
        )}
        {exercise.type === "select" && exercise.options && (
          <SelectExercise
            options={exercise.options}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            isValidated={isValidated}
            feedback={feedback}
          />
        )}
        {exercise.type === "canvas" && (
          <CanvasExercise
            key={lessonId}
            canvasBackgroundText={exercise.canvasBackgroundText}
            onElementsChange={(elements) => {
              setCanvasElements(elements);
              saveCanvasState(lessonId, elements);
            }}
            initialElements={completedLessons[lessonId]?.lastCanvasElements}
          />
        )}
      </div>

      {/* Simplified Bottom Actions */}
      {isFullyCorrect && (
        <div className="flex justify-center pb-8 pt-4 animate-in slide-in-from-bottom-4 duration-700">
          <Link
            href="/"
            className="group relative flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all hover:bg-zinc-800 active:scale-95 shadow-lg"
          >
            <span className="relative z-10 uppercase tracking-widest">Next Module</span>
            <ChevronRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
};
