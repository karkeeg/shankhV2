'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface SelectExerciseProps {
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
  }[];
  selectedOptions: string[];
  setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>;
  isValidated: boolean;
  feedback: Record<string, boolean>;
}

export const SelectExercise = ({
  options,
  selectedOptions,
  setSelectedOptions,
  isValidated,
  feedback,
}: SelectExerciseProps) => {
  const toggleOption = (id: string) => {
    if (isValidated) return;
    
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option.id);
        const isCorrectResult = feedback[option.id];

        return (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={cn(
              "flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 transform active:scale-[0.98] group relative overflow-hidden",
              isSelected 
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700",
              isValidated && isCorrectResult === true && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-emerald-500/10 scale-[1.02]",
              isValidated && isCorrectResult === false && "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20 shadow-rose-500/10"
            )}
          >
            {/* Background Accent */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-10 dark:opacity-0 transition-opacity pointer-events-none",
              isSelected ? "bg-blue-500" : "bg-zinc-200"
            )} />

            <span className={cn(
               "text-lg font-semibold relative z-10",
               isSelected ? "text-blue-700 dark:text-blue-300" : "text-zinc-600 dark:text-zinc-400",
               isValidated && isCorrectResult === true && "text-emerald-700 dark:text-emerald-400",
               isValidated && isCorrectResult === false && "text-rose-700 dark:text-rose-400"
            )}>
              {option.label}
            </span>

            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10",
              isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-zinc-300 dark:border-zinc-700 bg-transparent",
              isValidated && isCorrectResult === true && "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]",
              isValidated && isCorrectResult === false && "bg-rose-500 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
            )}>
               {isValidated ? (
                 isCorrectResult ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />
               ) : (
                 isSelected && <Check size={18} strokeWidth={3} />
               )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
