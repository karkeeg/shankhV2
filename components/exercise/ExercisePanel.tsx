"use client";

import React, { useState, useEffect } from "react";
import { ExerciseConfig } from "@/types/exercise";

import { ExcelGrid } from "./ExcelGrid";
import { SelectExercise } from "./SelectExercise";
import { CanvasExercise } from "./CanvasExercise";
import { Button } from "../ui/Button";
import { RotateCcw, Lightbulb, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

import { useAppStore } from "@/lib/store";
import { CompletionModal } from "./CompletionModal";

interface ExercisePanelProps {
  lessonId: string;
  exercise: ExerciseConfig;
  studyPlanId?: string;
  onCoachUpdate?: (message?: { type: "info" | "warning" | "correct" | "incorrect" | "hint", content: string }, notes?: string) => void;
  onNextActivity?: () => void;
  onBackToPlan?: () => void;
  isLastInTopic?: boolean;
  onGoToSheets?: () => void;
  onGoToMCQ?: () => void;
  onGoToCanvas?: () => void;
}

export const ExercisePanel = ({ 
  lessonId, 
  exercise, 
  studyPlanId,
  onCoachUpdate,
  onNextActivity,
  onBackToPlan,
  isLastInTopic,
  onGoToSheets,
  onGoToMCQ,
  onGoToCanvas,
}: ExercisePanelProps) => {
  const { markLessonComplete, updateAttempt, xp } = useAppStore();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [isValidated, setIsValidated] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [isFullyCorrect, setIsFullyCorrect] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);

  // Handle tasks from API
  const tasks = exercise.tasks || [];
  const currentTask = tasks[currentTaskIndex];
  const hasTasks = tasks.length > 0;

  // Handle multi-question MCQ
  const mcqQuestions = exercise.questions || [];
  const currentMcqQuestion = mcqQuestions[currentTaskIndex];
  const hasMcqQuestions = mcqQuestions.length > 0;

  // Handle multi-table spreadsheet
  const hasMultipleTables = Array.isArray(exercise.tables) && exercise.tables.length > 0;
  const activeTable = hasMultipleTables ? exercise.tables![activeTabIndex] : null;

  // Generate table for current task if it's a spreadsheet type
  const getTaskTable = () => {
    if (activeTable) return activeTable.table;
    if (!currentTask || exercise.type !== "excel") return exercise.table || [[]];
    
    const inputParts = (currentTask.inputs || "").split(';').filter(Boolean);
    const table: (string | number | null)[][] = [
      ["Item", "Value"],
      ...inputParts.map(pair => {
        const [k, v] = pair.split('₹').map(s => s.trim());
        return [k, v ? parseFloat(v.replace(/,/g, '')) : null];
      }),
      ["Total Result", null]
    ];
    return table;
  };

  const currentTable = getTaskTable();
  const currentInputs = activeTable ? activeTable.inputs : (hasTasks && currentTask) ? [
    {
      row: currentTable.length - 1,
      col: 1,
      correctValue: parseFloat(String(currentTask.answer || 0).replace(/[₹,]/g, '')),
      type: "number" as const,
      formula: currentTask.formula
    }
  ] : exercise.inputs;

  useEffect(() => {
    setCurrentTaskIndex(0);
    setActiveTabIndex(0);
    // Initialize in_progress attempt
    updateAttempt(lessonId, { status: "in_progress", studyPlanId });
  }, [lessonId]);

  useEffect(() => {
    setIsValidated(false);
    setFeedback({});
    setIsFullyCorrect(false);
    
    // Restore state from store if available
    const savedAnswers = useAppStore.getState().completedLessons[lessonId]?.answers || [];
    const savedAnswer = savedAnswers.find((a: any) => a.taskIndex === currentTaskIndex);
    
    if (savedAnswer) {
      setUserInputs(savedAnswer.inputs || {});
      setSelectedOptions(savedAnswer.selection || []);
      if (savedAnswer.correct) {
        setIsFullyCorrect(true);
        setIsValidated(true);
        
        // Regenerate feedback for Excel (multi-tab or single)
        const restoredFeedback: Record<string, boolean> = {};
        if (hasMultipleTables) {
          exercise.tables!.forEach((tbl, tIdx) => {
            (tbl.inputs || []).forEach(input => {
              restoredFeedback[`${tIdx}-${input.row}-${input.col}`] = true;
            });
          });
        } else if (exercise.type === "excel" && currentInputs) {
          currentInputs.forEach((input) => {
            restoredFeedback[`${input.row}-${input.col}`] = true;
          });
        }
        setFeedback(restoredFeedback);
      }
    } else {
      setUserInputs({});
      setSelectedOptions([]);
    }
  }, [currentTaskIndex, lessonId]);

  // Auto-save effect for Excel/MCQ
  useEffect(() => {
    // Only auto-save if it's an interactive type and not already validated as correct
    if (exercise.type !== "excel" && exercise.type !== "select") return;
    if (isValidated && isFullyCorrect) return;

    const timer = setTimeout(() => {
      const currentAnswers = useAppStore.getState().completedLessons[lessonId]?.answers || [];
      const updatedAnswers = [...currentAnswers];
      const existingIndex = updatedAnswers.findIndex((a: any) => a.taskIndex === currentTaskIndex);
      
      const newAnswer = { 
        taskIndex: currentTaskIndex, 
        correct: isFullyCorrect, 
        inputs: userInputs, 
        selection: selectedOptions 
      };
      
      // Check if anything actually changed
      if (existingIndex > -1) {
        const existing = updatedAnswers[existingIndex];
        const isSame = JSON.stringify(existing.inputs) === JSON.stringify(userInputs) && 
                      JSON.stringify(existing.selection) === JSON.stringify(selectedOptions);
        if (isSame) return;
        updatedAnswers[existingIndex] = newAnswer;
      } else {
        if (Object.keys(userInputs).length === 0 && selectedOptions.length === 0) return;
        updatedAnswers.push(newAnswer);
      }

      updateAttempt(lessonId, { 
        studyPlanId,
        status: "in_progress",
        answers: updatedAnswers,
        checkCount,
        hintsUsedCount
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [userInputs, selectedOptions, lessonId, currentTaskIndex, exercise.type, isFullyCorrect]);

  const validate = () => {

    const newFeedback: Record<string, boolean> = {};
    let correctCount = 0;
    let totalCount = 0;

    if (exercise.type === "select") {
      totalCount = 1;
      const currentOptions = currentMcqQuestion?.options || exercise.options || [];
      const option = currentOptions.find(o => o.isCorrect);
      const isCorrect = option ? selectedOptions.includes(option.id) : false;
      if (selectedOptions[0]) {
        newFeedback[selectedOptions[0]] = isCorrect;
      }
      if (isCorrect) correctCount++;
    } else if (exercise.type === "canvas") {
      totalCount = 1;
      correctCount = 1;
    } else if (hasMultipleTables) {
      // Validate all tabs
      exercise.tables!.forEach((tbl, tIdx) => {
        const tblInputs = tbl.inputs || [];
        tblInputs.forEach((input) => {
          totalCount++;
          const key = `${tIdx}-${input.row}-${input.col}`;
          const userValue = (userInputs[key] || "").toString().trim().replace(/[₹,]/g, "");
          const correctVal = typeof input.correctValue === 'string' ? parseFloat(input.correctValue.replace(/[₹,]/g, '')) : input.correctValue;
          const isCorrect = parseFloat(userValue) === correctVal;
          newFeedback[key] = isCorrect;
          if (isCorrect) correctCount++;
        });
      });
    } else if (currentInputs) {
      totalCount = currentInputs.length;
      currentInputs.forEach((input) => {
        const key = `${input.row}-${input.col}`;
        const userValue = (userInputs[key] || "").toString().trim().replace(/[₹,]/g, "");
        const correctVal = typeof input.correctValue === 'string' ? parseFloat(input.correctValue.replace(/[₹,]/g, '')) : input.correctValue;
        const isCorrect = parseFloat(userValue) === correctVal;
        newFeedback[key] = isCorrect;
        if (isCorrect) correctCount++;
      });
    }


    setFeedback(newFeedback);
    setIsValidated(true);
    setCheckCount(prev => prev + 1);

    const isAllCorrect = correctCount === totalCount && totalCount > 0;
    setIsFullyCorrect(isAllCorrect);

    // Incremental save
    const currentAnswers = useAppStore.getState().completedLessons[lessonId]?.answers || [];
    const updatedAnswers = [...currentAnswers];
    const existingIndex = updatedAnswers.findIndex((a: any) => a.taskIndex === currentTaskIndex);
    
    const newAnswer = { taskIndex: currentTaskIndex, correct: isAllCorrect, inputs: userInputs, selection: selectedOptions };
    if (existingIndex > -1) {
      updatedAnswers[existingIndex] = newAnswer;
    } else {
      updatedAnswers.push(newAnswer);
    }

    updateAttempt(lessonId, { 
      checkCount: checkCount + 1, 
      hintsUsedCount, 
      studyPlanId,
      status: "in_progress",
      answers: updatedAnswers
    });


    // Update AI Coach
    if (onCoachUpdate) {
      if (isAllCorrect) {
        onCoachUpdate({ 
          type: 'correct', 
          content: (currentMcqQuestion?.coach?.correct) || exercise.coach?.correct || "Great job! That's correct." 
        });
      } else {
        onCoachUpdate({ 
          type: 'incorrect', 
          content: (currentMcqQuestion?.coach?.incorrect) || exercise.coach?.incorrect || "That's not quite right. Double check your selection." 
        });
      }
    }

    if (isAllCorrect && !hasTasks && !hasMcqQuestions) {
       markLessonComplete(lessonId, { score: 100, checkCount, hintsUsedCount, studyPlanId });
       confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
       setTimeout(() => setShowCompletionModal(true), 800);
    }
  };

  const handleNext = () => {
    if (!isFullyCorrect) {
      if (onCoachUpdate) {
        onCoachUpdate({ 
          type: 'warning', 
          content: "Please complete the current task correctly before moving to the next one." 
        });
      }
      return;
    }

    const totalSteps = Math.max(tasks.length, mcqQuestions.length);
    if (currentTaskIndex < totalSteps - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      if (onCoachUpdate) {
        const nextTitle = tasks[currentTaskIndex + 1]?.task || mcqQuestions[currentTaskIndex + 1]?.question || "Next Task";
        onCoachUpdate({ 
          type: 'info', 
          content: `Moving to Task ${currentTaskIndex + 2}: ${nextTitle}` 
        });
      }
    } else {
      markLessonComplete(lessonId, { score: 100, checkCount, hintsUsedCount, studyPlanId });
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => setShowCompletionModal(true), 600);
    }
  };

  const handleHint = () => {
    setHintsUsedCount(prev => prev + 1);
    if (onCoachUpdate) {
      onCoachUpdate({ 
        type: 'hint', 
        content: currentTask?.formula 
          ? `Try using this logic: ${currentTask.formula}. ${exercise.coach?.hint || ""}` 
          : (currentMcqQuestion?.coach?.hint || exercise.coach?.hint || "Look closely at the options provided.") 
      });
    }
  };

  const reset = () => {
    setIsValidated(false);
    setFeedback({});
    setIsFullyCorrect(false);
    setUserInputs({});
    setSelectedOptions([]);
    if (onCoachUpdate) onCoachUpdate(undefined);
  };

  const totalStepsCount = Math.max(tasks.length, mcqQuestions.length);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#F3F4F6] border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={reset} className="h-10 px-4 font-bold shadow-sm">
            <RotateCcw size={16} className="mr-2" />
            Reset
          </Button>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black text-zinc-900 tracking-tight">
            {totalStepsCount > 1 ? `Task ${currentTaskIndex + 1} of ${totalStepsCount}` : "Exercise"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="group relative bg-white border border-zinc-200 px-3 py-1 rounded-xl flex items-center gap-2 mr-2 cursor-help">
            <Zap size={14} className="text-indigo-600" fill="currentColor" />
            <span className="text-sm font-black text-zinc-900">{xp}</span>
            <div className="absolute top-full mt-2 right-0 w-48 bg-zinc-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              <p className="font-bold mb-1">Scoring Rules:</p>
              <ul className="space-y-1 list-disc ml-3 opacity-80">
                <li>Perfect: 100 XP</li>
                <li>-2 XP per Check Answer</li>
                <li>-5 XP per Hint used</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleHint}
            className="flex items-center gap-2 px-4 py-2 text-zinc-600 hover:text-zinc-900 transition-colors font-bold text-sm"
          >
            <Lightbulb size={18} className="text-amber-500" />
            <span>Hint</span>
          </button>

          <Button
            variant="success"
            onClick={validate}
            disabled={isFullyCorrect && isValidated}
            className={cn(
              "bg-[#10B981] hover:bg-[#059669] text-white px-6 py-2.5 h-10 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95",
              isFullyCorrect && isValidated && "opacity-50 cursor-not-allowed"
            )}
          >
            {isFullyCorrect && isValidated ? "Validated" : "Check Answer"}
          </Button>


          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className={cn(
              "h-10 px-6 font-black uppercase tracking-widest text-[11px] shadow-sm transition-all flex items-center gap-1.5",
              isFullyCorrect 
                ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105" 
                : "bg-white text-zinc-300 border-zinc-200"
            )}
          >
            {currentTaskIndex < totalStepsCount - 1 ? "Next Task" : "Finish"}
            <ChevronRight size={16} className={cn("transition-transform", isFullyCorrect && "translate-x-0.5")} />
          </Button>
        </div>
      </div>

      {/* Exercise Component Area */}
      <div className="flex-1 overflow-y-auto flex flex-col p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-black text-[#1F2937] leading-tight tracking-tight flex-1">
            {currentTask?.task || currentMcqQuestion?.question || exercise.question}
          </h2>
          {isFullyCorrect && (
            <div className="shrink-0 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-wider">Task Completed</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          {exercise.type === "excel" && (
            <ExcelGrid
              table={currentTable}
              inputs={currentInputs}
              userInputs={userInputs}
              setUserInputs={setUserInputs}
              isValidated={isValidated}
              feedback={feedback}
              showToolbar={true}
              activeTabIndex={activeTabIndex}
              tabNames={hasMultipleTables ? exercise.tables!.map(t => t.name) : []}
              onTabChange={setActiveTabIndex}
            />
          )}
          {exercise.type === "canvas" && (
            <CanvasExercise
              canvasBackgroundText={exercise.canvasBackgroundText}
              onElementsChange={(elements) => {
                const { saveCanvasState } = useAppStore.getState();
                saveCanvasState(lessonId, elements);
              }}
              initialElements={useAppStore.getState().completedLessons[lessonId]?.lastCanvasElements as any}
            />
          )}

          {exercise.type === "select" && (
            <SelectExercise
              options={currentMcqQuestion?.options || exercise.options || []}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              isValidated={isValidated}
              feedback={feedback}
            />
          )}
        </div>
      </div>

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onNext={() => {
          setShowCompletionModal(false);
          onNextActivity?.();
        }}
        onBackToPlan={() => {
          setShowCompletionModal(false);
          onBackToPlan?.();
        }}
        title={exercise.question || "Exercise"}
        isLastInTopic={isLastInTopic}
        onGoToSheets={onGoToSheets}
        onGoToMCQ={onGoToMCQ}
        onGoToCanvas={onGoToCanvas}
      />
    </div>
  );
};

