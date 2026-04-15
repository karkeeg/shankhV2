"use client";

import React, { useState, useEffect } from "react";
import { ExerciseConfig } from "@/data/financeData";
import { ExcelGrid } from "./ExcelGrid";
import { SelectExercise } from "./SelectExercise";
import { CanvasExercise } from "./CanvasExercise";
import { Button } from "../ui/Button";
import { CheckCircle2, RotateCcw, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface ExercisePanelProps {
  exercise: ExerciseConfig;
}

export const ExercisePanel = ({ exercise }: ExercisePanelProps) => {
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
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
      // Real Canvas is self-graded. Set to correct so they can proceed.
      totalCount = 1;
      correctCount = 1;
    }

    setFeedback(newFeedback);
    setIsValidated(true);

    if (correctCount === totalCount && totalCount > 0) {
      setIsFullyCorrect(true);
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
    <div className="flex flex-col gap-4 h-full px-2">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-1 py-1 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 border-zinc-300 text-zinc-400 bg-white shadow-sm"
          >
            Previous
          </Button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 h-8 px-2 text-zinc-400 hover:text-zinc-600 transition-colors text-xs font-bold"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Dynamic Message Area (One Line, Simple) */}
        <div className="flex-1 flex justify-center px-4 overflow-hidden">
          {isValidated ? (
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-bold transition-all animate-in fade-in slide-in-from-top-1",
                isFullyCorrect ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {isFullyCorrect ? (
                <>
                  <CheckCircle2 size={14} /> Brilliant! All answers are correct.
                </>
              ) : (
                <>
                  <AlertCircle size={14} /> Review and retry. Some entries need
                  correction.
                </>
              )}
            </div>
          ) : showHint ? (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 animate-in fade-in slide-in-from-top-1">
              <Lightbulb size={14} />
              Hint: Think about definitions on the left.
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHint(!showHint)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-2 transition-colors text-xs font-bold",
              showHint ? "text-amber-600" : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            <Lightbulb size={16} />
            Hint
          </button>
          <Button
            variant="success"
            onClick={validate}
            disabled={isValidated && isFullyCorrect}
            className="bg-[#00AB6B] hover:bg-[#00915B] text-white px-3 py-1.5 h-8 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-sm"
          >
            Check Answer
          </Button>
        </div>
      </div>

      {/* Question Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">
          {exercise.question}
        </h2>
      </div>

      {/* Exercise Component Area */}
      <div className="flex-1 min-h-[400px] flex flex-col">
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
            canvasBackgroundText={exercise.canvasBackgroundText}
          />
        )}
      </div>

      {/* Simplified Bottom Actions (if needed) */}
      {isFullyCorrect && (
        <div className="flex justify-center pb-4 animate-in slide-in-from-bottom-2">
          <Button
            variant="primary"
            className="bg-[#7C5DFA] hover:bg-[#9277FF] px-12 py-3"
          >
            Next Module
          </Button>
        </div>
      )}
    </div>
  );
};
